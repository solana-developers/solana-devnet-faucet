import { LAMPORTS_PER_SOL, PublicKey, Connection } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";
import { INTERNAL_SERVER_ERROR, OK } from "./constants";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

const network = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const accountsToMonitor = [
  "6yvwhesLJeE8fNWviosRoUtBP3VFUXE7SEhSP9fFRJ3Z",
  "2pekXzx7WRPtdj4Gvtif1mzmHfc21zpNx2AvW9r4g7bo",
  "devwuNsNYACyiEYxRNqMNseBpNnGfnd4ZwNHL7sphqv",
].map((acc) => new PublicKey(acc));

export default async (_: NextApiRequest, res: NextApiResponse) => {
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

    res.status(OK).send("Balances updated.");
  } catch (thrownObject) {
    // JS allows you to throw anything, just just an error.
    // Eg you could throw an Array or a string!
    // In practice through we just throw errors, hence this 'as'
    const error = thrownObject as Error;
    console.error(error);
    res.status(INTERNAL_SERVER_ERROR).send("Error " + error.message);
  }
};
