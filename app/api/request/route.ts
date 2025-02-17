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
  SystemProgram,
} from "@solana/web3.js";
import { checkCloudflare } from "@/lib/cloudflare";
import {
  getKeypairFromEnvironment,
  sendTransaction,
} from "@solana-developers/helpers";
import { withOptionalUserSession } from "@/lib/auth";
import { AirdropRateLimit, FaucetTransaction } from "@/lib/constants";
import {
  getAirdropRateLimitForSession,
  isAuthorizedToBypass,
} from "@/lib/utils";
import { githubValidationAPI, transactionsAPI } from "@/lib/backend";
import { headers } from "next/headers";

export const dynamic = "force-dynamic"; // defaults to auto
const GITHUB_LOGIN_REQUIRED = true;

export const GET = () => {
  return new Response("Nothing to see here");
};

/**
 * Define the handler function for POST requests to this endpoint
 */

export const POST = withOptionalUserSession(async ({ req, session }) => {
  try {
    const headersList = headers();

    // Get the real IP address from Cloudflare headers
    const ip =
      headersList.get("cf-connecting-ipv6") ||
      headersList.get("cf-connecting-ip") ||
      (process.env.NODE_ENV === "development" ? "::1" : null);

    console.log("ip: %s, headersList: %o", ip, headersList);

    if (!ip) {
      return new Response("Could not determine client IP address", {
        status: 400,
      });
    }

    let serverKeypair: Keypair;
    try {
      serverKeypair = await getKeypairFromEnvironment("FAUCET_KEYPAIR");
    } catch (err) {
      throw Error("Internal error. No faucet keypair found");
    }

    const authToken = (req.headers.get("authorization") || "")
      .split(/^Bearer:?/gi)
      .at(1)
      ?.trim();

    console.log("authToken:", authToken);

    // get the required data submitted from the client
    const { walletAddress, amount, network, cloudflareCallback } =
      await req.json();

    // GitHub auth is required
    if (GITHUB_LOGIN_REQUIRED) {
      if (!session?.user?.githubUserId) {
        throw Error(
          "GitHub authentication is required. Please sign in with GitHub to use the faucet.",
        );
      }
      const { valid } = await githubValidationAPI.ghValidation(
        session.user.githubUserId!,
      );
      if (!valid) {
        throw Error("Github account too new");
      }
    }

    // get the desired rate limit for the current requestor
    const rateLimit = await getAirdropRateLimitForSession(session);

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

    if (amount > rateLimit.maxAmountPerRequest) {
      throw Error("Requested SOL amount too large");
    }

    if (!ip) {
      // Not sure we'd ever be in a situation where we don't have an IP
      throw Error("Could not determine IP");
    }

    // enable the some `authTokens`
    if (!isAuthorizedToBypass(authToken)) {
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
        const ipAddressWithoutDots = getCleanIp(ip);
        try {
          // Fetch last transaction for any of the three identifiers
          const lastTransactions = await transactionsAPI.getLastTransaction(userWallet.toBase58(), session?.user?.githubUserId!, ipAddressWithoutDots, rateLimit.allowedRequests);

          // Check if the request exceeds rate limits
          const isWithinRateLimit = checkRateLimit(lastTransactions, rateLimit);

          console.log(
            `network: ${network}, requested: ${amount}, ip: ${ipAddressWithoutDots}, ` +
            `wallet: ${walletAddress}, github: ${session?.user?.githubUserId}, ` +
            `isWithinRateLimit: ${isWithinRateLimit}`
          );

          if (!isWithinRateLimit) {
            throw Error(
              `You have exceeded the ${rateLimit.allowedRequests} airdrops limit ` +
                `in the past ${rateLimit.coveredHours} hour(s)`,
            );
          }

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
    }

    const rpc_url =
      network == "testnet"
        ? "https://api.testnet.solana.com"
        : process.env.RPC_URL ?? "https://api.devnet.solana.com";

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
      const signature = await sendTransaction(
        connection,
        transaction,
        [serverKeypair],
        1000000,
      );

      if (!signature) {
        throw Error("Transaction failed");
      }

      try {
        await transactionsAPI.create(
          signature,
          getCleanIp(ip),
          userWallet.toBase58(),
          session?.user?.githubUserId ?? "",
          Date.now()
        );
        console.log(`Transaction recorded: ${signature}`);
      } catch (error) {
        console.error("Failed to record transaction in database:", error);
      }

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

const checkRateLimit = (lastTransactions: FaucetTransaction[], rateLimit: AirdropRateLimit) => {
  if (lastTransactions.length === 0) return true; // No previous transactions → allow request

  const rateLimitThreshold = Date.now() - rateLimit.coveredHours * (60 * 60 * 1000);

  for(const transaction of lastTransactions) {
    if (transaction.timestamp < rateLimitThreshold) {
      return true; // A single transaction is within the rate limit threshold → allow request
    }
  }
 return false;
};

const getCleanIp = (ip: string) => {
  return ip.includes(":") ? ip.replace(/:/g, "") : ip.replace(/\./g, "");
}
