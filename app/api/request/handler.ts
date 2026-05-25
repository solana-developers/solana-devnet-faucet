import { transactionsAPI } from "@/lib/backend";

import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import { isAuthorizedToBypass } from "./auth-bypass";
import { isAllowListedIp } from "./ip";
import { enforceRateLimits } from "./rate-limiting";
import { verifyCaptcha } from "./verify-captcha";
import { executeAirdrop } from "./execute-airdrop";
import { trackBypass } from "./tracking";
import type { RequestContext } from "./types";

export type AirdropResult =
  | { success: true; signature: string }
  | { success: false; error: AirdropError };

export async function handleAirdrop(
  ctx: RequestContext,
): Promise<AirdropResult> {
  try {
    const tokenBypass = isAuthorizedToBypass(ctx.authToken);
    const ipBypass = isAllowListedIp(ctx.ip);

    if (!tokenBypass) {
      const { githubUserId } = ctx;
      if (!githubUserId) {
        throw new AirdropError(AirdropErrorCode.GITHUB_AUTH_REQUIRED);
      }
      await verifyCaptcha(ctx);

      if (!ipBypass) {
        await enforceRateLimits({ ...ctx, githubUserId });
      }
    }

    if (tokenBypass) {
      trackBypass(ctx.sanitizedIp, ctx, "auth_token");
    } else if (ipBypass) {
      trackBypass(ctx.sanitizedIp, ctx, "allow_listed_ip");
    }

    const signature = await executeAirdrop(ctx);

    try {
      await recordTransaction(ctx, signature);
    } catch (err) {
      console.error("[AIRDROP] Failed to record transaction:", err);
    }

    return { success: true, signature };
  } catch (err) {
    if (err instanceof AirdropError) {
      return { success: false, error: err };
    }

    return {
      success: false,
      error: new AirdropError(AirdropErrorCode.TX_FAILED, { cause: err }),
    };
  }
}

async function recordTransaction(
  ctx: RequestContext,
  signature: string,
): Promise<void> {
  await transactionsAPI.create(
    signature,
    ctx.sanitizedIp,
    ctx.body.recipientAddress,
    ctx.githubUserId,
    Date.now(),
  );
}
