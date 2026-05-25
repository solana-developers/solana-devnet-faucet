export const AirdropErrorCode = {
  // Request parsing
  NO_IP:              { code: "no_ip",               status: 400, message: "Could not determine client IP address" },
  NO_KEYPAIR:         { code: "no_keypair",          status: 500, message: "Internal server error" },
  INVALID_BODY:       { code: "invalid_body",        status: 400, message: "Invalid request body" },

  // Validation
  MISSING_WALLET:     { code: "missing_wallet",      status: 400, message: "Missing wallet address" },
  INVALID_WALLET:     { code: "invalid_wallet",      status: 400, message: "Invalid wallet address" },
  INVALID_AMOUNT:     { code: "invalid_amount",      status: 400, message: "Invalid SOL amount" },
  AMOUNT_TOO_LARGE:   { code: "amount_too_large",    status: 400, message: "Requested SOL amount too large" },
  INVALID_NETWORK:    { code: "invalid_network",     status: 400, message: "Invalid network" },

  // Auth
  GITHUB_AUTH_REQUIRED: { code: "github_auth_required", status: 400, message: "GitHub authentication is required. Please sign in with GitHub to use the faucet." },

  // Captcha
  CAPTCHA_MISSING:    { code: "captcha_missing",     status: 400, message: "Missing CAPTCHA token" },
  CAPTCHA_FAILED:     { code: "captcha_failed",      status: 400, message: "Invalid CAPTCHA" },

  // Rate limiting
  VALIDATION_REJECTED: { code: "validation_rejected", status: 429, message: "Request rejected by validation" },
  RATE_LIMITED:       { code: "rate_limited",         status: 429, message: "Rate limit exceeded" },

  // Transaction
  TX_FAILED:          { code: "tx_failed",           status: 400, message: "Faucet is empty, ping @solana_devs on Twitter" },
  TX_NO_SIGNATURE:    { code: "tx_no_signature",     status: 400, message: "Transaction failed" },
} as const;

type ErrorDef = typeof AirdropErrorCode[keyof typeof AirdropErrorCode];

export class AirdropError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(def: ErrorDef, options?: ErrorOptions & { message?: string }) {
    super(options?.message ?? def.message, options);
    this.status = def.status;
    this.code = def.code;
  }
}
