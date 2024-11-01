import { Pool } from "pg";

export const dynamic = "force-dynamic"; // defaults to auto

/**
 * Define the handler function for GET requests to this endpoint
 */
export const GET = async (_req: Request) => {
  try {
    // connect to the database
    const pgClient = new Pool({
      connectionString: process.env.POSTGRES_STRING_SOLANA,
    });

    const result = await pgClient.query(
      "SELECT account, balance, date FROM faucet.solana_balances WHERE date >= CURRENT_DATE - INTERVAL '1 month' ORDER BY date ",
    );

    return new Response(
      JSON.stringify({ results: result ? result.rows : null }),
      {
        status: 200,
      },
    );
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
