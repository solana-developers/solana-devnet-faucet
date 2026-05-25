import { checkCloudflare } from "@/lib/cloudflare";

import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import type { RequestContext } from "./types";

export async function verifyCaptcha(ctx: RequestContext): Promise<void> {
  if (ctx.skipCaptcha) return;

  if (!ctx.body.captchaToken) {
    throw new AirdropError(AirdropErrorCode.CAPTCHA_MISSING);
  }

  const approved = await checkCloudflare(ctx.body.captchaToken);
  if (!approved) {
    throw new AirdropError(AirdropErrorCode.CAPTCHA_FAILED);
  }
}
