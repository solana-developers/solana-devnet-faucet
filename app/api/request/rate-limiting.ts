/**
 * Rate limiting for the airdrop endpoint.
 *
 * Two layers of enforcement, both delegated to the backend service:
 *  1. Blocklist — the backend validates the IP/wallet/GitHub identity and may
 *     reject it outright (e.g. known abusers, flagged addresses).
 *  2. Frequency limit — recent transactions for the same identity are counted
 *     against the tier's allowedRequests / coveredHours window.
 *
 * Throws AirdropError (VALIDATION_REJECTED or RATE_LIMITED) on failure.
 */

import { type FaucetTransaction, type AirdropTier } from "@/lib/airdrop";
import { transactionsAPI, validationAPI } from "@/lib/backend";
import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import type { AuthenticatedRequestContext } from "./types";

// NOTE (pre-existing): There is a TOCTOU gap between checking rate limits
// here and recording the transaction after executeAirdrop() in the route
// handler. In theory concurrent requests could both pass before either is
// recorded. In practice this is mitigated by Turnstile (each request needs a
// fresh captcha token) and possibly by the backend DB itself. Fully closing
// the gap would require an atomic check-and-reserve at the backend level.
export async function enforceRateLimits(
  ctx: AuthenticatedRequestContext,
): Promise<void> {
  await enforceBlocklist(ctx);
  await enforceFrequencyLimit(ctx, ctx.tier);
}

async function enforceBlocklist(
  ctx: AuthenticatedRequestContext,
): Promise<void> {
  const { valid, reason } = await validationAPI.validate(
    ctx.sanitizedIp,
    ctx.body.recipientAddress,
    ctx.githubUserId,
  );

  if (!valid) {
    console.warn(
      `[RATE LIMIT] backend rejected: ip=${ctx.sanitizedIp} wallet=${ctx.body.recipientAddress} github=${ctx.githubUserId} reason="${reason}"`,
    );
    throw new AirdropError(AirdropErrorCode.VALIDATION_REJECTED, {
      message: reason,
    });
  }
}

async function enforceFrequencyLimit(
  ctx: AuthenticatedRequestContext,
  tier: AirdropTier,
): Promise<void> {
  const lastTransactions = await transactionsAPI.getLastTransactions(
    ctx.body.recipientAddress,
    ctx.githubUserId,
    ctx.sanitizedIp,
    tier.allowedRequests,
  );

  if (!isWithinRateLimit(lastTransactions, tier)) {
    console.warn(
      `[RATE LIMIT] exceeded: ip=${ctx.sanitizedIp} wallet=${ctx.body.recipientAddress} github=${ctx.githubUserId} recent=${lastTransactions.length} allowed=${tier.allowedRequests} window=${tier.coveredHours}h`,
    );
    throw new AirdropError(AirdropErrorCode.RATE_LIMITED, {
      message:
        `You have exceeded the ${tier.allowedRequests} airdrops limit ` +
        `in the past ${tier.coveredHours} hour(s)`,
    });
  }
}

function isWithinRateLimit(
  lastTransactions: FaucetTransaction[],
  tier: AirdropTier,
): boolean {
  const MS_PER_HOUR = 60 * 60 * 1000;

  if (lastTransactions.length === 0) return true;

  const windowStart = Date.now() - tier.coveredHours * MS_PER_HOUR;
  const recentCount = lastTransactions.filter(
    tx => tx.timestamp > windowStart,
  ).length;

  return recentCount < tier.allowedRequests;
}
