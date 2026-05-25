/**
 * Client-safe airdrop constants and types.
 *
 * This barrel is safe to import from client components — it has no
 * server-only dependencies (next-auth, etc.).  For server-only helpers
 * like `resolveTier` and `getTierForSession`, import from
 * `@/lib/airdrop/server`.
 */

export const VALID_AMOUNTS = [0.5, 1, 2.5, 5];

export type AirdropTier = {
  /** number of previous hours covered by the rate limit, in a rolling period */
  coveredHours: number;
  /** max number of requests to allow per `coveredHours` time period */
  allowedRequests: number;
  /** max amount of SOL allowed per individual request */
  maxAmountPerRequest: number;
};

type AirdropTierName = "default" | "github";

export const AIRDROP_TIERS: {
  [key in AirdropTierName]: AirdropTier;
} = {
  default: {
    coveredHours: 8,
    allowedRequests: 2,
    maxAmountPerRequest: 5,
  },
  github: {
    coveredHours: 8,
    allowedRequests: 2,
    maxAmountPerRequest: 5,
  },
};

/**
 * Represents a record in the `faucet.transactions` table.
 */
export type FaucetTransaction = {
  /** Unique signature of the Solana transaction */
  signature: string;
  /** Requestor's IP address with delimiters stripped (dots/colons removed) */
  ip_address: string;
  /** Requestor's Solana wallet address (base58) */
  wallet_address: string;
  /** Requestor's GitHub user ID (omitted for bypass callers) */
  github_id?: string;
  /** Timestamp of the transaction */
  timestamp: number;
};
