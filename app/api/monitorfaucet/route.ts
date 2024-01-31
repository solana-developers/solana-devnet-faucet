import { LAMPORTS_PER_SOL, PublicKey, Connection } from "@solana/web3.js";
import { Pool } from "pg";

export const dynamic = "force-dynamic"; // defaults to auto

/**
 * Define the handler function for GET requests to this endpoint
 */
export const GET = async (_req: Request) => {
  try {
    // connect to the database
    const pgClient = new Pool({
      connectionString: process.env.POSTGRES_STRING,
    });

    // connect to the desired solana rpc
    const connection = new Connection(
      process.env.RPC_URL ?? "https://api.devnet.solana.com",
    );

    // define the list of faucet accounts to monitor
    const FAUCET_ACCOUNTS = [
      "6yvwhesLJeE8fNWviosRoUtBP3VFUXE7SEhSP9fFRJ3Z",
      "2pekXzx7WRPtdj4Gvtif1mzmHfc21zpNx2AvW9r4g7bo",
      "devwuNsNYACyiEYxRNqMNseBpNnGfnd4ZwNHL7sphqv",
    ].map(acc => new PublicKey(acc));

    // Fetch and store the balances
    for (let account of FAUCET_ACCOUNTS) {
      const fetchedBalance = await connection.getBalance(account);

      const balance = fetchedBalance / LAMPORTS_PER_SOL;

      // Insert the balance and current date into the database
      await pgClient.query(
        "INSERT INTO solana_balances (account, balance, date) VALUES ($1, $2, $3)",
        [account.toString(), balance, new Date()],
      );
    }

    return new Response("Balances updated", {
      status: 200,
    });
  } catch (err) {
    // set the default error message
    let errorMessage = "An unknown error occurred";

    // process the thrown error
    if (err instanceof Error) {
      errorMessage = `Error: ${err.message}`;
    }

    return new Response(errorMessage, {
      status: 400,
    });
  }
};
