/**
 * General constants used for the website
 */
export const SITE = {
  domain: "faucet.solana.com",
  url: "https://faucet.solana.com",
};

/**
 * Airdrop rate limit controls
 *
 * Example rate limits:
 * - if `coveredHours` = 1, `allowedRequests` = 2, `maxAmountPerRequest` = 5,
 *    + a user could make `2` airdrop requests per `1` hour
 *    + each airdrop could be up to `5` SOL each
 *    + for a total of `10` SOL per hour max
 * - if `coveredHours` = 1, `allowedRequests` = 4, `maxAmountPerRequest` = 10,
 *    + a user could make `4` airdrop requests per `1` hour
 *    + each airdrop could be up to `10` SOL each
 *    + for a total of `40` SOL per hour max
 */
export type AirdropRateLimit = {
  /** number of previous hours covered by the rate limit, in a rolling period */
  coveredHours: number;
  /** max number of requests to allow per `coveredHours` time period */
  allowedRequests: number;
  /** max amount of SOl allowed per individual request */
  maxAmountPerRequest: number;
};

/**
 * Unique keys used to identify a specific airdrop limit
 */
export type AirdropLimitKeys = "default" | "github";

/**
 * Define the standard airdrop limits for requesting users
 * (including the base and elevated)
 */
export const AIRDROP_LIMITS: {
  [key in AirdropLimitKeys]: AirdropRateLimit;
} = {
  default: {
    coveredHours: 1,
    allowedRequests: 2,
    maxAmountPerRequest: 5,
  },
  github: {
    coveredHours: 1,
    allowedRequests: 2,
    maxAmountPerRequest: 5,
  },
};
