import fs from "fs";
import path from "path";
import {
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";

const ipDataFilePath = path.join(process.cwd(), "ipData.json");
const walletDataFilePath = path.join(process.cwd(), "walletData.json");
const verifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function loadKeypairFromFile(path) {
  return Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require("fs").readFileSync(path, "utf-8")))
  );
}

function readDataFromFile(filePath) {
  let data;
  try {
    const dataFile = fs.readFileSync(filePath);
    data = JSON.parse(dataFile);
  } catch (err) {
    data = {};
  }
  return data;
}

function writeDataToFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data));
}

export default async function handler(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const walletAddress = req.body.walletAddress;
  const amount = req.body.amount;
  const cloudflareCallback = req.body.cloudflareCallback;

  const secret = process.env.CLOUDFLARE_SECRET;

  console.log("secret", secret);

  const cloudfllareResponse = await fetch(verifyEndpoint, {
    method: "POST",
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(
      cloudflareCallback
    )}`,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  const data = await cloudfllareResponse.json();
  console.log(data);

  if (!data.success) {
    res.status(400).json({ error: "Invalid captcha" });
    return;
  }

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000; // 1 hour in milliseconds

  const ipData = readDataFromFile(ipDataFilePath);
  const walletData = readDataFromFile(walletDataFilePath);

  if (
    ipData[ip] &&
    ipData[ip].filter((timestamp) => timestamp > oneHourAgo).length >= 2
  ) {
    res.status(429).json({
      error: "Your IP has exceeded the 2 airdrops limit in the past hour",
    });
    return;
  }

  if (
    walletData[walletAddress] &&
    walletData[walletAddress].filter((timestamp) => timestamp > oneHourAgo)
      .length >= 2
  ) {
    res.status(429).json({
      error:
        "Your wallet address has exceeded the 2 airdrops limit in the past hour",
    });
    return;
  }

  ipData[ip] = ipData[ip] ? [...ipData[ip], now] : [now];
  walletData[walletAddress] = walletData[walletAddress]
    ? [...walletData[walletAddress], now]
    : [now];

  writeDataToFile(ipDataFilePath, ipData);
  writeDataToFile(walletDataFilePath, walletData);

  const payer = loadKeypairFromFile(
    require("os").homedir() + "/.config/solana/id.json"
  );

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(walletAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    {
      skipPreflight: false,
      commitment: "confirmed",
    }
  ).catch((err) => {
    res
      .status(400)
      .json({ error: "Faucet is empty, ping @valentinmadrid_ on Twitter" });
    return;
  });

  console.log("SIGNATURE", signature);

  res.status(200).json({ success: true, message: "Airdrop successful" });
}
