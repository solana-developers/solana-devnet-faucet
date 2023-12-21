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
  INTERNAL_SERVER_ERROR,
  OK,
  TOO_MANY_REQUESTS,
} from "./constants";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

const verifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const firstForwardedIp = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"][0]
    : null;
  const ip = firstForwardedIp || req.socket.remoteAddress;
  const walletAddress = req.body.walletAddress;
  const amount = req.body.amount;
  const cloudflareCallback = req.body.cloudflareCallback;

  if (!walletAddress) {
    res.status(BAD_REQUEST).json({ error: "Missing wallet address" });
    return;
  }

  try {
    let pubkey = new PublicKey(walletAddress);
    let isOnCurve = PublicKey.isOnCurve(pubkey.toBuffer());
    if (!isOnCurve) {
      res.status(BAD_REQUEST).json({ error: "Address can't be a PDA." });
      return false;
    }
  } catch (error) {
    res
      .status(BAD_REQUEST)
      .json({ error: "Please enter valid wallet address." });
    return false;
  }

  if (!amount) {
    res.status(BAD_REQUEST).json({ error: "Missing amount" });
    return;
  }

  if (amount > 5) {
    res.status(BAD_REQUEST).json({ error: "Amount too big." });
    return;
  }

  if (!ip) {
    res.status(BAD_REQUEST).json({ error: "Missing IP" });
    return;
  }

  const secret: string = process.env.CLOUDFLARE_SECRET as string;

  const cloudflareResponse = await fetch(verifyEndpoint, {
    method: "POST",
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(
      cloudflareCallback
    )}`,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  const data = await cloudflareResponse.json();

  if (!data.success) {
    res.status(BAD_REQUEST).json({ error: "Invalid captcha" });
    return;
  }

  let ipAddressWithoutDots;

  if (ip.includes(":")) {
    // IPv6 address
    ipAddressWithoutDots = ip.replace(/:/g, "");
  } else {
    // IPv4 address
    ipAddressWithoutDots = ip.replace(/\./g, "");
  }

  var ipLimitNotReached = await getOrCreateAndVerifyDatabaseEntry(
    ipAddressWithoutDots,
    res
  );
  var walletLimitNotReached = await getOrCreateAndVerifyDatabaseEntry(
    walletAddress,
    res
  );

  if (!ipLimitNotReached || !walletLimitNotReached) {
    return res;
  }

  const keypair = JSON.parse(process.env.FAUCET_KEYPAIR ?? "");
  const payer = Keypair.fromSecretKey(Uint8Array.from(keypair));

  const connection = new Connection(
    process.env.RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed"
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(walletAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  try {
    await sendAndConfirmTransaction(connection, transaction, [payer], {
      skipPreflight: false,
      commitment: "confirmed",
    });
  } catch (error) {
    console.error("Faucet is empty. Please refill");
    return res
      .status(BAD_REQUEST)
      .json({ error: "Faucet is empty, ping @solana_devs on Twitter" });
  }

  return res.status(OK).json({ success: true, message: "Airdrop successful" });
}

const getOrCreateAndVerifyDatabaseEntry = async (
  key: string,
  res: NextApiResponse
) => {
  const entryQuery = "SELECT * FROM rate_limits WHERE key = $1;";
  const insertQuery =
    "INSERT INTO rate_limits (key, timestamps) VALUES ($1, $2);";
  const updateQuery = "UPDATE rate_limits SET timestamps = $2 WHERE key = $1;";

  const oneHourAgo = Date.now() - 1 * HOUR;

  try {
    const { rows } = await pgClient.query(entryQuery, [key]);
    const entry = rows[0];

    if (entry) {
      const value = entry.timestamps;

      if (
        value.filter((timestamp: number) => timestamp > oneHourAgo).length >= 2
      ) {
        res.status(TOO_MANY_REQUESTS).json({
          error: "You have exceeded the 2 airdrops limit in the past hour",
        });
        return false;
      }

      value.push(Date.now());

      try {
        await pgClient.query(updateQuery, [key, value]);
      } catch (error) {
        console.error(error);
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
        return false;
      }
    } else {
      try {
        await pgClient.query(insertQuery, [key, [Date.now()]]);
      } catch (error) {
        res
          .status(INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
        console.error(error);
        return false;
      }
    }
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({ error: "Internal server error" });
    console.error(error);
    return false;
  }

  return true;
};
