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
  clusterApiUrl,
} from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { Client, Pool } from "pg";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

const network = clusterApiUrl("devnet");
const accountsToMonitor = [
  "6yvwhesLJeE8fNWviosRoUtBP3VFUXE7SEhSP9fFRJ3Z",
  "2pekXzx7WRPtdj4Gvtif1mzmHfc21zpNx2AvW9r4g7bo",
  "devwuNsNYACyiEYxRNqMNseBpNnGfnd4ZwNHL7sphqv",
].map((acc) => new PublicKey(acc));

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const connection = new Connection(network);

    // Fetch and store the balances
    for (let account of accountsToMonitor) {
      const fetchedBalance = await connection.getBalance(account);

      const balance = fetchedBalance / LAMPORTS_PER_SOL;

      // Insert the balance and current date into the database
      await pgClient.query(
        "INSERT INTO solana_balances (account, balance, date) VALUES ($1, $2, $3)",
        [account.toString(), balance, new Date()]
      );
    }

    res.status(200).send("Balances updated.");
  } catch (err) {
    console.error(err);
    // @ts-ignore
    res.status(500).send("Error " + err.message);
  }
};
