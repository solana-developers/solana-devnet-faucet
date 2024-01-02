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
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  OK,
  TOO_MANY_REQUESTS,
} from "@/lib/constants";
import { checkCloudflare } from "@/lib/cloudflare";
import { checkLimits } from "@/lib/db";
import { validate } from "@/lib/validate";
import { getHeaderValues } from "@/lib/utils";
import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";

let IP_ALLOW_LIST: Array<string> = JSON.parse(
  process.env.IP_ALLOW_LIST || "[]"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  let forwardedForValues = getHeaderValues(req, "x-forwarded-for");
  const firstForwardedForIp = forwardedForValues[0] || null;
  const remoteAddress = req.socket.remoteAddress || null;

  const ipAddress = firstForwardedForIp || remoteAddress;
  const walletAddress = req.body.walletAddress;
  const amount = req.body.amount;

  // TODO: the env variable is called FAUCET_KEYPAIR, but it's actually a secret key
  // we should rename it to FAUCET_PRIVATE_KEY or FAUCET_SECRET_KEY (per newer web3.js naming convention)
  let payer: Keypair | null = null;
  try {
    payer = getKeypairFromEnvironment("FAUCET_KEYPAIR");
  } catch (error) {
    console.error(error);
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "Internal server error" });
  }

  // What Solana would call the cluster name, ie 'devnet' or 'testnet'
  const network = req.body.network;
  const cloudflareCallback = req.body.cloudflareCallback;

  console.debug(
    `Incoming request from IP '${ipAddress}' using RPC '${network}'`
  );

  if (!ipAddress) {
    console.debug(
      `Rejected request for ${amount} SOL to wallet '${walletAddress}' due to remote address missing. Likely a disconnect.`
    );
    return res
      .status(BAD_REQUEST)
      .json({ error: "Remote address has disconnected" });
  }

  try {
    validate(walletAddress, amount);
  } catch (thrownObject) {
    const error = thrownObject as Error;
    console.debug(
      `Rejected request for ${amount} SOL to wallet '${walletAddress}' at IP address '${ipAddress}' due to validation failure: ${error.message}`
    );
    return res.status(BAD_REQUEST).json({ error: error.message });
  }

  const isCloudflareApproved = await checkCloudflare(cloudflareCallback);

  if (!isCloudflareApproved) {
    console.debug(
      `Rejected request for ${amount} SOL to wallet '${walletAddress}' at IP address '${ipAddress}' for failing CAPTCHA`
    );
    return res.status(BAD_REQUEST).json({ error: "Invalid CAPTCHA" });
  }

  const isAllowListed = IP_ALLOW_LIST?.includes(ipAddress);

  try {
    await checkLimits(ipAddress);
    await checkLimits(walletAddress);
  } catch (thrownObject) {
    const error = thrownObject as Error;
    // Anything other than 'exceeded' means there's a problem on our end
    if (!error.message.includes("exceeded")) {
      console.error(error);
      return res
        .status(INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error" });
    }

    // An error here means the wallet has exceeded the limit
    // We'll throw an error unless they're on the allow list
    if (!isAllowListed) {
      console.debug(
        `Rejected ${amount} SOL to wallet '${walletAddress}' at IP address '${ipAddress}' due to ${error.message}`
      );
      return res.status(TOO_MANY_REQUESTS).json({ error: error.message });
    }

    console.log(
      `Allow listed IP '${ipAddress}' exceeded limit, but we'll allow it`
    );
  }

  const RPC_URL =
    network === "testnet"
      ? "https://api.testnet.solana.com"
      : process.env.RPC_URL ?? "https://api.devnet.solana.com";
  console.log(RPC_URL);

  const connection = new Connection(RPC_URL, "confirmed");

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

  console.debug(
    `Airdropped ${amount} SOL to wallet '${walletAddress}' at IP address '${ipAddress}'`
  );
  return res.status(OK).json({ success: true, message: "Airdrop successful" });
}
