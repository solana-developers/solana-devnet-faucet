/**
 * POST /api/request — Airdrop SOL on devnet or testnet.
 *
 * Thin HTTP adapter: parses the request into a RequestContext,
 * delegates to handleAirdrop, and maps the result to an HTTP response.
 */
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

import { withOptionalUserSession } from "@/lib/auth";
import { resolveTier } from "@/lib/airdrop/server";

import { trackEvent } from "@/lib/analytics";

import { getClientIp, sanitizeIp } from "./ip";
import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import { trackError, trackSuccess } from "./tracking";
import { validateBody } from "./validation";
import { handleAirdrop } from "./handler";
import type { AirdropResponse, RequestContext } from "./types";

export const dynamic = "force-dynamic";

export const POST = withOptionalUserSession(async ({ req, session }) => {
  const ip = getClientIp(req);
  const clientId = sanitizeIp(ip ?? "unknown");

  let ctx: RequestContext;
  try {
    ctx = await buildContext(req, session ?? undefined, ip);
  } catch (err) {
    console.error("[AIRDROP ERROR] buildContext failed:", err);
    trackEvent("airdrop_failed", {
      reason: err instanceof AirdropError ? err.code : "unhandled",
      error_message: err instanceof Error ? err.message : "unknown",
    }, clientId);
    if (err instanceof AirdropError) {
      return new Response(err.message, { status: err.status });
    }
    return new Response("Unable to complete airdrop", { status: 500 });
  }

  const result = await handleAirdrop(ctx);

  if (result.success) {
    trackSuccess(clientId, ctx, result.signature);
    const body: AirdropResponse = {
      success: true,
      message: "Airdrop successful",
      signature: result.signature,
    };
    return NextResponse.json(body, { status: 200 });
  }

  trackError(clientId, ctx, result.error);
  return new Response(result.error.message, { status: result.error.status });
});

async function buildContext(
  req: Request,
  session: Session | undefined,
  ip: string | undefined,
): Promise<RequestContext> {
  const githubUserId = session?.user?.githubUserId;

  if (!ip) {
    throw new AirdropError(AirdropErrorCode.NO_IP);
  }

  const sanitizedIp = sanitizeIp(ip);

  let faucetKeypair: Keypair;
  try {
    faucetKeypair = getKeypairFromEnvironment("FAUCET_KEYPAIR_NEW");
  } catch {
    throw new AirdropError(AirdropErrorCode.NO_KEYPAIR);
  }

  const authToken = req.headers
    .get("authorization")
    ?.match(/^Bearer:?\s*(.+)/i)?.[1];

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AirdropError(AirdropErrorCode.INVALID_BODY);
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new AirdropError(AirdropErrorCode.INVALID_BODY);
  }

  const tier = resolveTier(githubUserId);
  const body = validateBody(raw as Record<string, unknown>, tier);

  const ctx = {
    ip,
    sanitizedIp,
    githubUserId,
    tier,
    skipCaptcha: process.env.NODE_ENV === "development",
    body,
  } as RequestContext;

  // Sensitive fields are non-enumerable (skipped by spread/Object.keys/default console.log); toJSON emits "<redacted>" placeholders so logs show presence without leaking values.
  Object.defineProperties(ctx, {
    faucetKeypair: { value: faucetKeypair, enumerable: false },
    authToken: { value: authToken, enumerable: false },
    toJSON: {
      value(this: RequestContext) {
        const { faucetKeypair: kp, authToken: tok, ...safe } = this;
        return {
          ...safe,
          ...(kp && { faucetKeypair: "<redacted>" }),
          ...(tok && { authToken: "<redacted>" }),
        };
      },
      enumerable: false,
    },
  });

  return ctx;
}
