/*
 * `/api/request` endpoint
 * allows people to request devnet solx to be airdropped to their wallet
 */

import { devnetFaucetURL } from "@/lib/constants";

// Solaxy devnet faucet endpoint for SOLX
export const POST = async (req: Request) => {
  try {
    const { walletAddress, amount } = await req.json();
    if (amount > 250000) {
      return new Response(JSON.stringify({ error: "You can only request up to 0.25 SOLX per request." }), { status: 400 });
    }
    if (!devnetFaucetURL) {
      return new Response(JSON.stringify({ error: "Faucet URL is not configured." }), { status: 500 });
    }
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "requestAirdrop",
      params: [
        walletAddress, 
        amount
      ],
    };
    try {
      const response = await fetch(devnetFaucetURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.error) {
        throw Error(data.error.message || "Transaction failed");
      }
      return new Response(JSON.stringify({ success: true, message: "Airdrop successful", result: data.result }), { status: 200 });
    } catch (err) {
      let errorMessage = "Unable to complete airdrop";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (!errorMessage || errorMessage === "undefined") {
          errorMessage = "Unknown error occurred";
        }
      } else if (typeof err === "string" && err && err !== "undefined") {
        errorMessage = err;
      }
      return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
    }
  } catch (err) {
    let errorMessage = "Unable to complete airdrop";
    if (err instanceof Error) {
      errorMessage = err.message;
      if (!errorMessage || errorMessage === "undefined") {
        errorMessage = "Unknown error occurred";
      }
    } else if (typeof err === "string" && err && err !== "undefined") {
      errorMessage = err;
    }
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
};

export const dynamic = "force-dynamic"; // defaults to auto
export const GET = () => {
  return new Response("Nothing to see here");
};