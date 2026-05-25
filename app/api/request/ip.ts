/**
 * Client IP utilities for the airdrop endpoint.
 *
 * Handles IP extraction (Cloudflare headers), sanitization for use as
 * database/analytics keys, and allow-list bypass via IP_ALLOW_LIST env var.
 */

/**
 * Resolve client IP from Cloudflare headers, falling back to
 * localhost in development.
 */
export function getClientIp(req: Request): string | undefined {
  return (
    req.headers.get("cf-connecting-ipv6") ||
    req.headers.get("cf-connecting-ip") ||
    (process.env.NODE_ENV === "development" ? "::1" : undefined)
  );
}

/**
 * Strip delimiters from an IP address to produce a stable identifier
 * suitable for use as a database key or analytics client ID.
 */
export function sanitizeIp(ip: string): string {
  return ip.includes(":") ? ip.replace(/:/g, "") : ip.replace(/\./g, "");
}

/**
 * Check if an IP is on the allow list defined by IP_ALLOW_LIST env var.
 */
export function isAllowListedIp(ip: string): boolean {
  return parseAllowList().includes(ip);
}

function parseAllowList(): string[] {
  try {
    return JSON.parse(process.env.IP_ALLOW_LIST || "[]");
  } catch {
    console.error("[CONFIG] Invalid IP_ALLOW_LIST JSON, using empty list");
    return [];
  }
}
