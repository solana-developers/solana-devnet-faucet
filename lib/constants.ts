// We could just import http-status-codes,
// but this is a small project and I don't want to add a dependency for this.
export const BAD_REQUEST = 400;
export const OK = 200;
export const TOO_MANY_REQUESTS = 429;
export const INTERNAL_SERVER_ERROR = 500;

export const SECOND = 1000;
export const SECONDS = SECOND;
export const MINUTE = 60 * SECOND;
export const MINUTES = MINUTE;
export const HOUR = 60 * MINUTE;
export const HOURS = HOUR;

export const SITE = {
  domain: "faucet.solana.com",
};
