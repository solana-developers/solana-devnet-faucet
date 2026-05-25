import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair } from "@solana/web3.js";

import { AIRDROP_TIERS } from "@/lib/airdrop";

vi.mock("@/lib/cloudflare", () => ({
  checkCloudflare: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/backend", () => ({
  transactionsAPI: {
    create: vi.fn().mockResolvedValue({}),
    getLastTransactions: vi.fn().mockResolvedValue([]),
  },
  validationAPI: {
    validate: vi.fn().mockResolvedValue({ valid: true }),
  },
}));

vi.mock("@solana-developers/helpers", () => ({
  sendTransaction: vi.fn().mockResolvedValue("mock-sig"),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { handleAirdrop } from "../handler";
import type { RequestContext } from "../types";
import { transactionsAPI, validationAPI } from "@/lib/backend";
import { checkCloudflare } from "@/lib/cloudflare";
import { sendTransaction } from "@solana-developers/helpers";
import { trackEvent } from "@/lib/analytics";

const WALLET = Keypair.generate().publicKey.toBase58();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(validationAPI.validate).mockResolvedValue({ valid: true });
  vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([]);
  vi.mocked(transactionsAPI.create).mockResolvedValue({});
  vi.mocked(checkCloudflare).mockResolvedValue(true);
  vi.mocked(sendTransaction).mockResolvedValue("mock-sig");
});

describe("handleAirdrop", () => {
  it("should succeed on happy path", async () => {
    const result = await handleAirdrop(buildCtx());

    expect(result).toEqual({ success: true, signature: "mock-sig" });
  });

  it("should record the transaction", async () => {
    await handleAirdrop(buildCtx());

    expect(transactionsAPI.create).toHaveBeenCalledWith(
      "mock-sig",
      expect.any(String),
      WALLET,
      "user-123",
      expect.any(Number),
    );
  });

  describe("GitHub auth", () => {
    it("should fail when no GitHub session and not bypassed", async () => {
      const result = await handleAirdrop(
        buildCtx({ githubUserId: undefined }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("github_auth_required");
      }
    });
  });

  describe("captcha", () => {
    it("should skip captcha when skipCaptcha is true", async () => {
      await handleAirdrop(buildCtx({ skipCaptcha: true }));

      expect(checkCloudflare).not.toHaveBeenCalled();
    });

    it("should fail when captcha token is missing", async () => {
      const result = await handleAirdrop(
        buildCtx({
          skipCaptcha: false,
          body: { recipientAddress: WALLET, amount: 1, network: "devnet", captchaToken: undefined },
        }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("captcha_missing");
      }
    });

    it("should fail when captcha verification fails", async () => {
      vi.mocked(checkCloudflare).mockResolvedValue(false);

      const result = await handleAirdrop(
        buildCtx({ skipCaptcha: false }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("captcha_failed");
      }
    });
  });

  describe("rate limiting", () => {
    it("should fail when backend blocklist rejects", async () => {
      vi.mocked(validationAPI.validate).mockResolvedValue({
        valid: false,
        reason: "blocked",
      });

      const result = await handleAirdrop(buildCtx());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("validation_rejected");
      }
    });

    it("should fail when rate limited", async () => {
      const MS_PER_HOUR = 60 * 60 * 1000;
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([
        { signature: "s1", ip_address: "1234", wallet_address: WALLET, timestamp: Date.now() - MS_PER_HOUR },
        { signature: "s2", ip_address: "1234", wallet_address: WALLET, timestamp: Date.now() - 2 * MS_PER_HOUR },
      ]);

      const result = await handleAirdrop(buildCtx());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("rate_limited");
      }
    });
  });

  describe("transaction failure", () => {
    it("should fail when sendTransaction throws", async () => {
      vi.mocked(sendTransaction).mockRejectedValue(new Error("tx failed"));

      const result = await handleAirdrop(buildCtx());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("tx_failed");
      }
    });

    it("should fail when sendTransaction returns empty signature", async () => {
      vi.mocked(sendTransaction).mockResolvedValue("");

      const result = await handleAirdrop(buildCtx());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("tx_no_signature");
      }
    });

    it("should still succeed when recording the transaction fails", async () => {
      vi.mocked(transactionsAPI.create).mockRejectedValue(
        new Error("db error"),
      );

      const result = await handleAirdrop(buildCtx());

      expect(result).toEqual({ success: true, signature: "mock-sig" });
      expect(console.error).toHaveBeenCalledWith(
        "[AIRDROP] Failed to record transaction:",
        expect.any(Error),
      );
    });
  });

  describe("auth bypass", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    describe("with allow-listed IP", () => {
      beforeEach(() => {
        vi.stubEnv("IP_ALLOW_LIST", JSON.stringify(["1.2.3.4"]));
      });

      it("should skip rate limits but still require GitHub auth and captcha", async () => {
        const result = await handleAirdrop(
          buildCtx({ skipCaptcha: false }),
        );

        expect(result.success).toBe(true);
        expect(checkCloudflare).toHaveBeenCalled();
        expect(validationAPI.validate).not.toHaveBeenCalled();
        expect(trackEvent).toHaveBeenCalledWith(
          "airdrop_bypass_requested",
          expect.objectContaining({ bypass_reason: "allow_listed_ip" }),
          "1234",
        );
      });

      // Regression: a spoofed cf-connecting-ip must not unlock GitHub-auth
      // and captcha gates, only the rate-limit gate.
      it("should reject when GitHub session is missing", async () => {
        const result = await handleAirdrop(
          buildCtx({
            githubUserId: undefined,
            skipCaptcha: false,
            body: { recipientAddress: WALLET, amount: 1, network: "devnet", captchaToken: undefined },
          }),
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("github_auth_required");
        }
        expect(checkCloudflare).not.toHaveBeenCalled();
      });

      it("should reject when captcha fails", async () => {
        vi.mocked(checkCloudflare).mockResolvedValue(false);

        const result = await handleAirdrop(
          buildCtx({ skipCaptcha: false }),
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("captcha_failed");
        }
      });
    });

    describe("with allow-listed auth token", () => {
      beforeEach(() => {
        vi.stubEnv(
          "AUTH_TOKENS_ALLOW_LIST",
          JSON.stringify([{ token: "ci-token", name: "CI" }]),
        );
      });

      it("should skip GitHub auth, captcha, and rate limits", async () => {
        const result = await handleAirdrop(
          buildCtx({
            authToken: "ci-token",
            githubUserId: undefined,
            skipCaptcha: false,
            body: { recipientAddress: WALLET, amount: 1, network: "devnet", captchaToken: undefined },
          }),
        );

        expect(result.success).toBe(true);
        expect(checkCloudflare).not.toHaveBeenCalled();
        expect(validationAPI.validate).not.toHaveBeenCalled();
        expect(trackEvent).toHaveBeenCalledWith(
          "airdrop_bypass_requested",
          expect.objectContaining({ bypass_reason: "auth_token" }),
          "1234",
        );
      });

      it("should pass undefined github_id to recordTransaction for token bypass callers", async () => {
        // Backend's githubIdSchema is `^\d+$` + .optional(): empty string fails
        // the regex but `undefined` (omitted by JSON.stringify) is accepted.
        await handleAirdrop(
          buildCtx({
            authToken: "ci-token",
            githubUserId: undefined,
            skipCaptcha: false,
            body: { recipientAddress: WALLET, amount: 1, network: "devnet", captchaToken: undefined },
          }),
        );

        expect(transactionsAPI.create).toHaveBeenCalledWith(
          "mock-sig",
          expect.any(String),
          WALLET,
          undefined,
          expect.any(Number),
        );
      });
    });

    it("should not emit bypass event when not bypassed", async () => {
      await handleAirdrop(buildCtx());

      expect(trackEvent).not.toHaveBeenCalledWith(
        "airdrop_bypass_requested",
        expect.anything(),
        expect.anything(),
      );
    });
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
