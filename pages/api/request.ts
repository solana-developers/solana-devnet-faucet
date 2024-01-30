// This file is 'request' as in request SOL from the faucet, not as in HTTP request.
import {
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";
import {
  BAD_REQUEST,
  HOUR,
  HOURS,
  INTERNAL_SERVER_ERROR,
  OK,
  TOO_MANY_REQUESTS,
} from "@/lib/constants";
import { checkCloudflare } from "@/lib/cloudflare";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

// Eg if AIRDROPS_LIMIT_TOTAL is 2, and AIRDROPS_LIMIT_HOURS is 1,
// then a user can only get 2 airdrops per 1 hour.
const AIRDROPS_LIMIT_TOTAL = 2;
const AIRDROPS_LIMIT_HOURS = 1;

const MAX_SOL_AMOUNT = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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
    let forwardedForValueOrValues = req.headers["x-forwarded-for"] || [];
    let forwardedForValues: Array<string> = [];
    if (Array.isArray(forwardedForValueOrValues)) {
      forwardedForValues = forwardedForValueOrValues;
    } else {
      forwardedForValues = [forwardedForValueOrValues];
    }

    const firstForwardedIp = forwardedForValues[0] || null;
    const ip = firstForwardedIp || req.socket.remoteAddress;

    // get the required data submitted from the client
    const {
      // comment for better diffs
      walletAddress,
      amount,
      network,
      cloudflareCallback,
    } = req.body;

    console.log("ip", ip);
    console.log("network", network);

    // validate the user provided wallet address is a valid solana wallet address
    let userWallet: PublicKey;
    try {
      if (!walletAddress) throw Error("Missing wallet address");

      userWallet = new PublicKey(walletAddress);

      // verify the wallet is not a PDA
      if (!PublicKey.isOnCurve(userWallet.toBuffer())) {
        return res
          .status(BAD_REQUEST)
          .json({ error: "Address can't be a PDA." });
      }

      // when here, the user provided wallet is considered valid
    } catch (err) {
      return res.status(BAD_REQUEST).json({ error: "Invalid wallet address" });
    }

    if (!amount) {
      return res.status(BAD_REQUEST).json({ error: "Missing SOL amount" });
    }

    if (amount > MAX_SOL_AMOUNT) {
      return res
        .status(BAD_REQUEST)
        .json({ error: "Requested SOL amount too large." });
    }

    if (!ip) {
      // Not sure we'd ever be in a situation where we don't have an IP
      return res.status(BAD_REQUEST).json({ error: "Could not determine IP" });
    }

    // skip the cloudflare check when working on localhost
    if (process.env.NODE_ENV != "development" && ip != "::1") {
      const isCloudflareApproved = await checkCloudflare(cloudflareCallback);

      if (!isCloudflareApproved) {
        return res.status(BAD_REQUEST).json({ error: "Invalid CAPTCHA" });
      }
    } else {
      console.warn("SKIP CLOUDFLARE CHECK IN DEVELOPMENT MODE");
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

      const isIpLimitReached = !(await getOrCreateAndVerifyDatabaseEntry(
        ipAddressWithoutDots,
        res,
      ));

      const isWalletLimitReached = !(await getOrCreateAndVerifyDatabaseEntry(
        userWallet.toBase58(),
        res,
      ));

      // check if a rate limit was reached
      if (isIpLimitReached || isWalletLimitReached) {
        return res;
      }
    }

    const rpc_url =
      network == "testnet"
        ? "https://api.testnet.solana.com"
        : process.env.RPC_URL ?? "https://api.devnet.solana.com";
    console.log("RPC url:", rpc_url);

    const connection = new Connection(rpc_url, "confirmed");

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: serverKeypair.publicKey,
        toPubkey: userWallet,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    );

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
      return res
        .status(OK)
        .json({ success: true, message: "Airdrop successful", signature });
    } catch (error) {
      console.log(error);
      console.error("Faucet is empty. Please refill");
      throw Error("Faucet is empty, ping @solana_devs on Twitter");
    }

    // set a final catching error to handle if an unknown/unhandled thing happen
    throw Error("Unknown completion error");
  } catch (err) {
    console.warn("[FAUCET ERROR]");
    console.warn(err);

    // set the default error message
    let message = "Unable to complete airdrop";

    // handle custom error and their messages
    if (err instanceof Error) message = err.message;

    return res.status(BAD_REQUEST).json({ error: message });
  }
}

interface Row {
  timestamps: Array<number>;
}

const getOrCreateAndVerifyDatabaseEntry = async (
  key: string,
  res: NextApiResponse,
) => {
  const entryQuery = "SELECT * FROM rate_limits WHERE key = $1;";
  const insertQuery =
    "INSERT INTO rate_limits (key, timestamps) VALUES ($1, $2);";
  const updateQuery = "UPDATE rate_limits SET timestamps = $2 WHERE key = $1;";

  const timeAgo = Date.now() - AIRDROPS_LIMIT_HOURS * HOURS;

  try {
    const queryResult = await pgClient.query(entryQuery, [key]);
    const rows = queryResult.rows as Array<Row>;
    const entry = rows[0];

    if (entry) {
      const timestamps = entry.timestamps;

      const isExcessiveUsage =
        timestamps.filter((timestamp: number) => timestamp > timeAgo).length >=
        AIRDROPS_LIMIT_TOTAL;

      if (isExcessiveUsage) {
        return res.status(TOO_MANY_REQUESTS).json({
          error: `You have exceeded the ${AIRDROPS_LIMIT_TOTAL} airdrops limit in the past ${AIRDROPS_LIMIT_HOURS} hour(s)`,
        });
      }

      timestamps.push(Date.now());

      try {
        await pgClient.query(updateQuery, [key, timestamps]);
      } catch (error) {
        console.error(error);
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
      }
    } else {
      try {
        await pgClient.query(insertQuery, [key, [Date.now()]]);
      } catch (error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
        console.error(error);
      }
    }
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    console.error(error);
  }

  return true;
};
