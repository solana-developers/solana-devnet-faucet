import { solanaBalancesAPI } from "@/lib/backend";

export const dynamic = "force-dynamic"; // defaults to auto

/**
 * Define the handler function for GET requests to this endpoint
 */
export const GET = async (_req: Request) => {
  try {
    // Use the backend API to fetch recent Solana balances
    const recentBalances = await solanaBalancesAPI.getRecent();

    return new Response(JSON.stringify({ results: recentBalances }), {
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
