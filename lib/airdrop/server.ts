/**
 * Server-only airdrop helpers.
 *
 * These depend on next-auth and must NOT be imported from client components.
 * For client-safe exports, import from `@/lib/airdrop`.
 */

import type { Session } from "next-auth";

import { AIRDROP_TIERS, type AirdropTier } from "./index";

/**
 * Resolve the airdrop tier: GitHub-authenticated users get the `github` tier,
 * everyone else gets `default`.
 */
export function resolveTier(githubId: string | undefined): AirdropTier {
  return githubId ? AIRDROP_TIERS.github : AIRDROP_TIERS.default;
}

/**
 * Get the airdrop tier for a given session.
 */
export async function getTierForSession(
  session: Session | null,
): Promise<AirdropTier> {
  return resolveTier(session?.user.githubUserId);
}
