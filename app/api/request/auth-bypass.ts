/**
 * Auth token bypass for the airdrop endpoint.
 *
 * Tokens in the AUTH_TOKENS_ALLOW_LIST env var can skip captcha and rate
 * limits. Each token may have an optional time window (startDate/endDate).
 *
 * Expected env format:
 *   [{ "token": "abc", "name": "CI", "startDate": "...", "endDate": "..." }]
 */

import { timingSafeEqual } from "crypto";

interface AuthToken {
  token: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

function parseAuthTokenAllowList(): AuthToken[] {
  let raw: unknown;
  try {
    raw = JSON.parse(process.env.AUTH_TOKENS_ALLOW_LIST || "[]");
  } catch {
    // Don't log the parse error — its message can echo bytes from the env var.
    console.error("[AUTH-BYPASS] AUTH_TOKENS_ALLOW_LIST is not valid JSON; bypass disabled");
    return [];
  }

  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (item): item is AuthToken =>
      typeof item === "object" &&
      item !== null &&
      typeof item.token === "string",
  );
}

export function isAuthorizedToBypass(authToken: string | undefined): boolean {
  if (!authToken) return false;

  const match = parseAuthTokenAllowList().find(item => safeEqual(item.token, authToken));
  if (!match) return false;

  const now = new Date();
  if (match.startDate && new Date(match.startDate) >= now) return false;
  if (match.endDate && new Date(match.endDate) <= now) return false;

  return true;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(
    new Uint8Array(new TextEncoder().encode(a)),
    new Uint8Array(new TextEncoder().encode(b)),
  );
}

