import { Connection } from "@solana/web3.js";

const RPC_URLS = {
  devnet: process.env.RPC_URL_DEVNET ?? "https://api.devnet.solana.com",
  testnet: process.env.RPC_URL_TESTNET ?? "https://api.testnet.solana.com",
} as const;

export type Network = keyof typeof RPC_URLS;
export const VALID_NETWORKS = Object.keys(RPC_URLS) as Network[];

export function isNetwork(value: unknown): value is Network {
  return typeof value === "string" && value in RPC_URLS;
}

export function getRpcUrl(network: Network): string {
  return RPC_URLS[network];
}

export function getConnection(network: Network): Connection {
  return new Connection(getRpcUrl(network), "confirmed");
}
