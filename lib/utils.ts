import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session } from "next-auth";
import { AIRDROP_LIMITS, type AirdropRateLimit } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the desired airdrop rate limit to be applied, based on a given requestor's session
 */
export async function getAirdropRateLimitForSession(
  session: Session | null,
): Promise<AirdropRateLimit> {
  // always initialize with the default rate limit
  let rateLimit = AIRDROP_LIMITS.default;

  // when a user has authed with github, we will raise their rate limit
  if (!!session?.user.githubUsername) {
    rateLimit = AIRDROP_LIMITS.github;
  }

  return rateLimit;
}
