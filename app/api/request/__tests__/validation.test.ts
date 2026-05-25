import { describe, it, expect } from "vitest";
import { Keypair } from "@solana/web3.js";
import { validateBody } from "../validation";
import { AirdropError, AirdropErrorCode } from "../airdrop-error";
import { AIRDROP_TIERS, VALID_AMOUNTS } from "@/lib/airdrop";

const VALID_WALLET = Keypair.generate().publicKey.toBase58();
const DEFAULT_TIER = AIRDROP_TIERS.default;


describe("validateBody", () => {
  it("should accept a valid request", () => {
    const result = validateBody(validInput(), DEFAULT_TIER);
    expect(result).toEqual({
      recipientAddress: VALID_WALLET,
      amount: 1,
      network: "devnet",
      captchaToken: "captcha-token",
    });
  });

  it("should accept testnet", () => {
    const result = validateBody(validInput({ network: "testnet" }), DEFAULT_TIER);
    expect(result.network).toBe("testnet");
  });

  it("should accept all valid amounts", () => {
    for (const amount of VALID_AMOUNTS) {
      const result = validateBody(validInput({ amount }), DEFAULT_TIER);
      expect(result.amount).toBe(amount);
    }
  });

  it("should set captchaToken to undefined when cloudflareCallback is missing", () => {
    const result = validateBody(validInput({ cloudflareCallback: undefined }), DEFAULT_TIER);
    expect(result.captchaToken).toBeUndefined();
  });

  it("should set captchaToken to undefined when cloudflareCallback is not a string", () => {
    const result = validateBody(validInput({ cloudflareCallback: 123 }), DEFAULT_TIER);
    expect(result.captchaToken).toBeUndefined();
  });

  describe("wallet validation", () => {
    it("should throw MISSING_WALLET when walletAddress is missing", () => {
      expectAirdropError(
        () => validateBody(validInput({ walletAddress: undefined }), DEFAULT_TIER),
        AirdropErrorCode.MISSING_WALLET.code,
      );
    });

    it("should throw MISSING_WALLET when walletAddress is empty", () => {
      expectAirdropError(
        () => validateBody(validInput({ walletAddress: "" }), DEFAULT_TIER),
        AirdropErrorCode.MISSING_WALLET.code,
      );
    });

    it("should throw INVALID_WALLET for a non-base58 address", () => {
      expectAirdropError(
        () => validateBody(validInput({ walletAddress: "not-a-wallet" }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_WALLET.code,
      );
    });
  });

  describe("amount validation", () => {
    it("should throw INVALID_AMOUNT when amount is missing", () => {
      expectAirdropError(
        () => validateBody(validInput({ amount: undefined }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_AMOUNT.code,
      );
    });

    it("should throw INVALID_AMOUNT for non-number", () => {
      expectAirdropError(
        () => validateBody(validInput({ amount: "1" }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_AMOUNT.code,
      );
    });

    it("should throw INVALID_AMOUNT for disallowed value", () => {
      expectAirdropError(
        () => validateBody(validInput({ amount: 10 }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_AMOUNT.code,
      );
    });
  });

  describe("network validation", () => {
    it("should throw INVALID_NETWORK when network is missing", () => {
      expectAirdropError(
        () => validateBody(validInput({ network: undefined }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_NETWORK.code,
      );
    });

    it("should throw INVALID_NETWORK for unknown network", () => {
      expectAirdropError(
        () => validateBody(validInput({ network: "mainnet" }), DEFAULT_TIER),
        AirdropErrorCode.INVALID_NETWORK.code,
      );
    });
  });
});

function validInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    walletAddress: VALID_WALLET,
    amount: 1,
    network: "devnet",
    cloudflareCallback: "captcha-token",
    ...overrides,
  };
}

function expectAirdropError(fn: () => unknown, expectedCode: string) {
  try {
    fn();
    expect.unreachable("should have thrown");
  } catch (err) {
    expect(err).toBeInstanceOf(AirdropError);
    expect((err as AirdropError).code).toBe(expectedCode);
  }
}