import { trackEvent } from "@/lib/analytics";

import { AirdropError } from "./airdrop-error";
import type { RequestContext } from "./types";

export function trackSuccess(
  clientId: string,
  ctx: RequestContext,
  signature: string,
): void {
  trackEvent(
    "airdrop_success",
    {
      ...extractTrackingParams(ctx),
      signature,
    },
    clientId,
  );
}

export type BypassReason = "auth_token" | "allow_listed_ip";

export function trackBypass(
  clientId: string,
  ctx: RequestContext,
  reason: BypassReason,
): void {
  trackEvent(
    "airdrop_bypass_requested",
    {
      ...extractTrackingParams(ctx),
      bypass_reason: reason,
    },
    clientId,
  );
}

export function trackError(
  clientId: string,
  ctx: RequestContext,
  err: unknown,
): void {
  const ctxParams = extractTrackingParams(ctx);

  if (!(err instanceof AirdropError)) {
    console.error("[AIRDROP ERROR] unhandled:", err);
    trackEvent("airdrop_failed", {
      reason: "unhandled",
      error_message: err instanceof Error ? err.message : "unknown",
      ...ctxParams,
    }, clientId);
    return;
  }

  const causeMessage =
    err.cause instanceof Error ? err.cause.message : undefined;

  console.error(`[AIRDROP ERROR] ${err.code}: ${err.message}`, err.cause ?? "");
  trackEvent(
    "airdrop_failed",
    {
      reason: err.code,
      error_message: err.message,
      ...(causeMessage && { cause: causeMessage }),
      ...ctxParams,
    },
    clientId,
  );
}

function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function extractTrackingParams(ctx: RequestContext) {
  return {
    network: ctx.body.network,
    amount: ctx.body.amount,
    has_github: ctx.githubUserId ? "yes" : "no",
    wallet: shortenAddress(ctx.body.recipientAddress),
  };
}
