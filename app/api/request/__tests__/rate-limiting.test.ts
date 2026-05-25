import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";

import { AIRDROP_TIERS, type FaucetTransaction } from "@/lib/airdrop";

import { enforceRateLimits } from "../rate-limiting";
import { AirdropError, AirdropErrorCode } from "../airdrop-error";
import type { AuthenticatedRequestContext } from "../types";

vi.mock("@/lib/backend", () => ({
  validationAPI: {
    validate: vi.fn(),
  },
  transactionsAPI: {
    getLastTransactions: vi.fn(),
  },
}));

import { validationAPI, transactionsAPI } from "@/lib/backend";

const VALID_WALLET = Keypair.generate().publicKey.toBase58();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("enforceRateLimits", () => {
  describe("blocklist", () => {
    it("should pass when backend validates the identity", async () => {
      vi.mocked(validationAPI.validate).mockResolvedValue({ valid: true });
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([]);

      await expect(enforceRateLimits(buildCtx())).resolves.toBeUndefined();
    });

    it("should throw VALIDATION_REJECTED when backend rejects the identity", async () => {
      vi.mocked(validationAPI.validate).mockResolvedValue({
        valid: false,
        reason: "blocked wallet",
      });

      await expectAirdropError(
        () => enforceRateLimits(buildCtx()),
        AirdropErrorCode.VALIDATION_REJECTED.code,
      );
    });

    it("should include backend reason in error message", async () => {
      vi.mocked(validationAPI.validate).mockResolvedValue({
        valid: false,
        reason: "known abuser",
      });

      try {
        await enforceRateLimits(buildCtx());
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AirdropError);
        expect((err as AirdropError).message).toBe("known abuser");
      }
    });
  });

  describe("frequency limit", () => {
    beforeEach(() => {
      vi.mocked(validationAPI.validate).mockResolvedValue({ valid: true });
    });

    it("should pass with no previous transactions", async () => {
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([]);

      await expect(enforceRateLimits(buildCtx())).resolves.toBeUndefined();
    });

    it("should pass when recent transactions are below the limit", async () => {
      // default tier: allowedRequests=2, coveredHours=8
      // 1 recent tx is below the limit of 2
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([
        makeTx(1), // 1 hour ago — within window
      ]);

      await expect(enforceRateLimits(buildCtx())).resolves.toBeUndefined();
    });

    it("should throw RATE_LIMITED when recent transactions meet the limit", async () => {
      // 2 transactions within the window = meets allowedRequests of 2
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([
        makeTx(1),
        makeTx(2),
      ]);

      await expectAirdropError(
        () => enforceRateLimits(buildCtx()),
        AirdropErrorCode.RATE_LIMITED.code,
      );
    });

    it("should not count transactions outside the covered window", async () => {
      // Both transactions are older than 8 hours — outside window
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([
        makeTx(9),
        makeTx(10),
      ]);

      await expect(enforceRateLimits(buildCtx())).resolves.toBeUndefined();
    });

    it("should only count transactions within the window against the limit", async () => {
      // 1 within window, 1 outside — only 1 counts, below limit of 2
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([
        makeTx(1),  // within 8hr window
        makeTx(10), // outside 8hr window
      ]);

      await expect(enforceRateLimits(buildCtx())).resolves.toBeUndefined();
    });

    it("should pass correct parameters to getLastTransactions", async () => {
      vi.mocked(transactionsAPI.getLastTransactions).mockResolvedValue([]);
      const ctx = buildCtx();

      await enforceRateLimits(ctx);

      expect(transactionsAPI.getLastTransactions).toHaveBeenCalledWith(
        ctx.body.recipientAddress,
        ctx.githubUserId,
        ctx.sanitizedIp,
        ctx.tier.allowedRequests,
      );
    });
  });
});

function buildCtx(
  overrides: Partial<AuthenticatedRequestContext> = {},
): AuthenticatedRequestContext {
  return {
    ip: "1.2.3.4",
    sanitizedIp: "1234",
    faucetKeypair: Keypair.generate(),
    authToken: undefined,
    githubUserId: "user-123",
    tier: AIRDROP_TIERS.default,
    skipCaptcha: true,
    body: {
      recipientAddress: VALID_WALLET,
      amount: 1,
      network: "devnet",
      captchaToken: "tok",
    },
    ...overrides,
  };
}

function makeTx(ageHours: number): FaucetTransaction {
  const MS_PER_HOUR = 60 * 60 * 1000;
  return {
    signature: "sig-" + Math.random().toString(36).slice(2),
    ip_address: "1234",
    wallet_address: VALID_WALLET,
    github_id: "user-123",
    timestamp: Date.now() - ageHours * MS_PER_HOUR,
  };
}

async function expectAirdropError(
  fn: () => Promise<unknown>,
  expectedCode: string,
) {
  try {
    await fn();
    expect.unreachable("should have thrown");
  } catch (err) {
    expect(err).toBeInstanceOf(AirdropError);
    expect((err as AirdropError).code).toBe(expectedCode);
  }
}
