import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { solanaBalancesAPI } from "@/lib/backend";
import { FAUCET_ACCOUNTS } from "@/lib/constants";
import { getConnection } from "@/lib/rpc";

export const dynamic = "force-dynamic"; // defaults to auto

/**
 * Define the handler function for GET requests to this endpoint
 */
export const GET = async (_req: Request) => {
  try {
    const connection = getConnection("devnet");

    const accounts = FAUCET_ACCOUNTS.map(acc => new PublicKey(acc));

    // Fetch and store the balances
    for (let account of accounts) {
      const fetchedBalance = await connection.getBalance(account);

      const balance = fetchedBalance / LAMPORTS_PER_SOL;

      // Make an API call to store the balance
      await solanaBalancesAPI.create(account.toString(), balance);
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
