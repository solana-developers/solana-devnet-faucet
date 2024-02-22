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

/**
 * Check if the given `authToken` should be allowed to bypass auth checks
 */
export function isAuthorizedToBypass(authToken: string = ""): boolean {
  let bypassChecksWithAuth = false;

  try {
    // load the ip address whitelist from the env
    const AUTH_TOKENS_ALLOW_LIST: Array<{
      name?: string;
      token: string;
      startDate?: string;
      endDate?: string;
    }> = JSON.parse(process.env.AUTH_TOKENS_ALLOW_LIST || "[]");

    const authCheck = AUTH_TOKENS_ALLOW_LIST.find(
      item => item.token == authToken,
    );

    if (!!authCheck) {
      try {
        let currentDate = new Date();

        // is this authToken activated within its time window
        if (
          authCheck.startDate &&
          new Date(authCheck.startDate) >= currentDate
        ) {
          throw Error("Not authorized: token not activated");
        }
        // is this authToken activated within its time window

        if (authCheck.endDate && new Date(authCheck.endDate) <= currentDate) {
          throw Error("Not authorized: token expired");
        }

        // when here, we have performed all auth checks. let them pass
        bypassChecksWithAuth = true;
      } catch (err) {
        if (err instanceof Error) console.warn("[authCheck]", err.message);
        // do nothing. the `authToken` is not authorized
      }
    }
  } catch (err) {
    //
  }
  return bypassChecksWithAuth;
}
