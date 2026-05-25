/**
 * Request body validation for the airdrop endpoint.
 *
 * Parses the raw JSON payload and validates each field:
 *  - recipientAddress — must be a valid Solana public key
 *  - amount — must be in the VALID_AMOUNTS list and within the tier's max
 *  - network — must be a supported network (devnet/testnet)
 *  - captchaToken — optional Cloudflare Turnstile token (string or undefined)
 *
 * Throws AirdropError on any invalid input.
 */

import { PublicKey } from "@solana/web3.js";

import { isNetwork } from "@/lib/rpc";
import { type AirdropTier, VALID_AMOUNTS } from "@/lib/airdrop";

import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import type { RequestContext } from "./types";

export function validateBody(
  raw: Record<string, unknown>,
  tier: AirdropTier,
): RequestContext["body"] {
  return {
    recipientAddress: validateRecipientAddress(raw.walletAddress),
    amount: validateAmount(raw.amount, tier),
    network: validateNetwork(raw.network),
    captchaToken: typeof raw.cloudflareCallback === "string"
      ? raw.cloudflareCallback
      : undefined,
  };
}

function validateRecipientAddress(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AirdropError(AirdropErrorCode.MISSING_WALLET);
  }

  try {
    new PublicKey(value);
  } catch {
    throw new AirdropError(AirdropErrorCode.INVALID_WALLET);
  }

  return value;
}

function validateAmount(value: unknown, tier: AirdropTier): number {
  if (typeof value !== "number" || !VALID_AMOUNTS.includes(value)) {
    throw new AirdropError(AirdropErrorCode.INVALID_AMOUNT);
  }

  if (value > tier.maxAmountPerRequest) {
    throw new AirdropError(AirdropErrorCode.AMOUNT_TOO_LARGE);
  }

  return value;
}

function validateNetwork(value: unknown): RequestContext["body"]["network"] {
  if (!isNetwork(value)) {
    throw new AirdropError(AirdropErrorCode.INVALID_NETWORK);
  }

  return value;
}
