import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";

import { AIRDROP_TIERS } from "@/lib/airdrop";

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackSuccess, trackError, trackBypass } from "../tracking";
import { AirdropError, AirdropErrorCode } from "../airdrop-error";
import { trackEvent } from "@/lib/analytics";
import type { RequestContext } from "../types";

const WALLET = "8rWi9H6wcZVPSA3A8LnE7KVvUnPnPnX1zvWnbGN66bBi";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("trackSuccess", () => {
  it("should send airdrop_success event with correct params", () => {
    const ctx = buildCtx();

    trackSuccess("client-1", ctx, "sig-abc");

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_success",
      {
        network: "devnet",
        amount: 1,
        has_github: "yes",
        wallet: "8rWi...6bBi",
        signature: "sig-abc",
      },
      "client-1",
    );
  });

  it("should report has_github as 'no' when githubUserId is undefined", () => {
    const ctx = buildCtx({ githubUserId: undefined });

    trackSuccess("client-1", ctx, "sig-abc");

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_success",
      expect.objectContaining({ has_github: "no" }),
      "client-1",
    );
  });
});

describe("trackBypass", () => {
  it("should send airdrop_bypass_requested with auth_token reason", () => {
    const ctx = buildCtx({ authToken: "secret-token" });

    trackBypass("client-1", ctx, "auth_token");

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_bypass_requested",
      {
        network: "devnet",
        amount: 1,
        has_github: "yes",
        wallet: "8rWi...6bBi",
        bypass_reason: "auth_token",
      },
      "client-1",
    );
  });

  it("should send airdrop_bypass_requested with allow_listed_ip reason", () => {
    const ctx = buildCtx();

    trackBypass("client-1", ctx, "allow_listed_ip");

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_bypass_requested",
      expect.objectContaining({ bypass_reason: "allow_listed_ip" }),
      "client-1",
    );
  });

  it("should not include the raw auth token in the payload", () => {
    const ctx = buildCtx({ authToken: "super-secret" });

    trackBypass("client-1", ctx, "auth_token");

    const payload = (trackEvent as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1];
    expect(JSON.stringify(payload)).not.toContain("super-secret");
  });
});

describe("trackError", () => {
  it("should send airdrop_failed event for AirdropError", () => {
    const ctx = buildCtx();
    const err = new AirdropError(AirdropErrorCode.RATE_LIMITED);

    trackError("client-1", ctx, err);

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_failed",
      {
        reason: "rate_limited",
        error_message: "Rate limit exceeded",
        network: "devnet",
        amount: 1,
        has_github: "yes",
        wallet: "8rWi...6bBi",
      },
      "client-1",
    );
  });

  it("should include cause message when present", () => {
    const ctx = buildCtx();
    const cause = new Error("connection refused");
    const err = new AirdropError(AirdropErrorCode.TX_FAILED, { cause });

    trackError("client-1", ctx, err);

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_failed",
      expect.objectContaining({ cause: "connection refused" }),
      "client-1",
    );
  });

  it("should handle non-AirdropError with reason 'unhandled'", () => {
    const ctx = buildCtx();

    trackError("client-1", ctx, new Error("something broke"));

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_failed",
      expect.objectContaining({
        reason: "unhandled",
        error_message: "something broke",
      }),
      "client-1",
    );
  });

  it("should handle non-Error values", () => {
    const ctx = buildCtx();

    trackError("client-1", ctx, "string error");

    expect(trackEvent).toHaveBeenCalledWith(
      "airdrop_failed",
      expect.objectContaining({
        reason: "unhandled",
        error_message: "unknown",
      }),
      "client-1",
    );
  });
});


function buildCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    ip: "1.2.3.4",
    sanitizedIp: "1234",
    faucetKeypair: Keypair.generate(),
    authToken: undefined,
    githubUserId: "user-123",
    tier: AIRDROP_TIERS.default,
    skipCaptcha: true,
    body: {
      recipientAddress: WALLET,
      amount: 1,
      network: "devnet",
      captchaToken: "token",
    },
    ...overrides,
  };
}