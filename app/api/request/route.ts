/**
 * `/api/request` endpoint
 *
 * allows people to request devnet and testnet sol be airdropped to their wallet
 */

import {
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import { Pool } from "pg";
import { AIRDROP_LIMITS } from "@/lib/constants";
import { checkCloudflare } from "@/lib/cloudflare";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { withOptionalUserSession } from "@/lib/auth";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

export const dynamic = "force-dynamic"; // defaults to auto

/**
 * Define the handler function for POST requests to this endpoint
 */

export const POST = withOptionalUserSession(async ({ req, session }) => {
  try {
    // load the desired keypair from the server's ENV
    let serverKeypair: Keypair;
    try {
      serverKeypair = await getKeypairFromEnvironment("FAUCET_KEYPAIR");
    } catch (err) {
      throw Error("Internal error. No faucet keypair found");
    }

    // Annoyingly, req.headers["x-forwarded-for"] can be a string or an array of strings
    // Let's just make it an array of strings
    let forwardedForValueOrValues = req.headers.get("x-forwarded-for") || [];
    let forwardedForValues: Array<string> = [];
    if (Array.isArray(forwardedForValueOrValues)) {
      forwardedForValues = forwardedForValueOrValues;
    } else {
      forwardedForValues = [forwardedForValueOrValues];
    }

    const ip = forwardedForValues[0] || null;

    // get the required data submitted from the client
    const {
      // comment for better diffs
      walletAddress,
      amount,
      network,
      cloudflareCallback,
    } = await req.json();

    console.log("ip", ip);
    console.log("network", network);

    // validate the user provided wallet address is a valid solana wallet address
    let userWallet: PublicKey;
    try {
      if (!walletAddress) throw Error("Missing wallet address");

      userWallet = new PublicKey(walletAddress);

      // verify the wallet is not a PDA
      if (!PublicKey.isOnCurve(userWallet.toBuffer())) {
        throw Error("Address cannot be a PDA");
      }

      // when here, the user provided wallet is considered valid
    } catch (err) {
      throw Error("Invalid wallet address");
    }

    if (!amount) {
      throw Error("Missing SOL amount");
    }

    if (amount > AIRDROP_LIMITS.default.maxAmountPerRequest) {
      throw Error("Requested SOL amount too large");
    }

    if (!ip) {
      // Not sure we'd ever be in a situation where we don't have an IP
      throw Error("Could not determine IP");
    }

    // skip the cloudflare check when working on localhost
    if (process.env.NODE_ENV != "development" && ip != "::1") {
      const isCloudflareApproved = await checkCloudflare(cloudflareCallback);

      if (!isCloudflareApproved) {
        throw Error("Invalid CAPTCHA");
      }
    } else {
      console.warn("SKIP CLOUDFLARE CHECK IN DEVELOPMENT MODE ON LOCALHOST");
    }

    // load the ip address whitelist from the env
    const IP_ALLOW_LIST: Array<string> = JSON.parse(
      process.env.IP_ALLOW_LIST || "[]",
    );

    // attempt to rate limit a request (for non-whitelisted ip's)
    if (!IP_ALLOW_LIST?.includes(ip)) {
      let ipAddressWithoutDots;

      if (ip.includes(":")) {
        // IPv6 address
        ipAddressWithoutDots = ip.replace(/:/g, "");
      } else {
        // IPv4 address
        ipAddressWithoutDots = ip.replace(/\./g, "");
      }

      try {
        // perform all database rate limit checks at the same time
        // if one throws an error, the requestor is rate limited
        await Promise.all([
          // check for rate limits on the requestors ip address
          getOrCreateAndVerifyDatabaseEntry(ipAddressWithoutDots),

          // check for rate limits on the requestors wallet address
          getOrCreateAndVerifyDatabaseEntry(userWallet.toBase58()),
        ]);

        /**
         * when here, we assume the request is not rate limited
         * since none of the above Promises will have throw an error
         */
      } catch (err) {
        // set the default error message
        let errorMessage = "Rate limit exceeded";

        // handle custom error and their messages
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        return new Response(errorMessage, {
          status: 429, // too many requests
        });
      }
    }

    const rpc_url =
      network == "testnet"
        ? "https://api.testnet.solana.com"
        : process.env.RPC_URL ?? "https://api.devnet.solana.com";

    const connection = new Connection(rpc_url, "confirmed");

    let blockhash: string;
    try {
      blockhash = (await connection.getLatestBlockhash()).blockhash;
    } catch (err) {
      return new Response("Unable to get latest blockhash", {
        status: 500, // internal server error
      });
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: serverKeypair.publicKey,
        toPubkey: userWallet,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );
    transaction.recentBlockhash = blockhash;

    try {
      // send and confirm the transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [serverKeypair],
        {
          commitment: "confirmed",
        },
      );

      // finally return a success 200 message when the transaction was successful
      return new Response(
        JSON.stringify({
          success: true,
          message: "Airdrop successful",
          signature,
        }),
        {
          status: 200, // success
        },
      );
    } catch (error) {
      console.error("[TRANSACTION FAILED]");
      console.error(error);
      throw Error("Faucet is empty, ping @solana_devs on Twitter");
    }

    // set a final catching error to handle if an unknown/unhandled thing happen
    throw Error("Unknown completion error");
  } catch (err) {
    console.warn("[FAUCET ERROR]");
    console.warn(err);

    // set the default error message
    let errorMessage = "Unable to complete airdrop";

    // handle custom error and their messages
    if (err instanceof Error) {
      errorMessage = err.message;
    }

    return new Response(errorMessage, {
      status: 400, // bad request
    });
  }
});

interface Row {
  timestamps: Array<number>;
}

const getOrCreateAndVerifyDatabaseEntry = async (key: string) => {
  const entryQuery = "SELECT * FROM rate_limits WHERE key = $1;";
  const insertQuery =
    "INSERT INTO rate_limits (key, timestamps) VALUES ($1, $2);";
  const updateQuery = "UPDATE rate_limits SET timestamps = $2 WHERE key = $1;";

  const timeAgo =
    Date.now() - AIRDROP_LIMITS.default.coveredHours * (1 * 60 * 1000);

  const queryResult = await pgClient.query(entryQuery, [key]);
  const rows = queryResult.rows as Array<Row>;

  // check and see if the current requestor has attempted an airdrop before
  const entry = rows[0];
  if (entry) {
    const timestamps = entry.timestamps;

    const isExcessiveUsage =
      timestamps.filter((timestamp: number) => timestamp > timeAgo).length >=
      AIRDROP_LIMITS.default.allowedRequests;

    if (isExcessiveUsage) {
      throw Error(
        `You have exceeded the ${AIRDROP_LIMITS.default.allowedRequests} airdrops limit ` +
          `in the past ${AIRDROP_LIMITS.default.coveredHours} hour(s)`,
      );
    }

    timestamps.push(Date.now());

    // update the requestor's info to track perform future rate limit checks
    await pgClient.query(updateQuery, [key, timestamps]).catch(err => {
      console.error("[DB ERROR]", err);
      throw Error("Rate limit error occurred");
    });
  } else {
    // when no current `entry` exists, we will record the new requestor in the database
    await pgClient.query(insertQuery, [key, [Date.now()]]).catch(err => {
      console.error("[DB ERROR]", err);
      throw Error("Rate limit error occurred");
    });
  }

  // when here, we are sure the user has not been rate limited
  return true;
};
