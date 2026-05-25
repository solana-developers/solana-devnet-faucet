import type { Keypair } from "@solana/web3.js";
import type { Network } from "@/lib/rpc";
import type { AirdropTier } from "@/lib/airdrop";

export type RequestContext = {
  /** Client IP from Cloudflare headers (cf-connecting-ip / cf-connecting-ipv6) */
  ip: string;
  /** IP with delimiters stripped, used as a stable client identifier */
  sanitizedIp: string;
  /** Keypair that signs airdrop transactions */
  faucetKeypair: Keypair;
  /** Bearer token from Authorization header, if provided */
  authToken: string | undefined;
  /** GitHub user ID from the authenticated session (undefined for bypass callers) */
  githubUserId: string | undefined;
  /** Resolved airdrop tier for this user */
  tier: AirdropTier;
  /** When true, captcha verification is skipped (dev mode or bypass callers) */
  skipCaptcha: boolean;
  /** Validated request body */
  body: {
    /** Base58-encoded Solana wallet address of the recipient */
    recipientAddress: string;
    /** SOL amount to airdrop (must be in VALID_AMOUNTS) */
    amount: number;
    /** Target Solana network */
    network: Network;
    /** Cloudflare Turnstile verification token */
    captchaToken: string | undefined;
  };
};

/** JSON body returned on a successful airdrop (HTTP 200). */
export type AirdropResponse = {
  success: true;
  message: string;
  signature: string;
};

/** RequestContext after GitHub authentication has been verified */
export type AuthenticatedRequestContext = RequestContext & {
  githubUserId: string;
};