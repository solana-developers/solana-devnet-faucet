import { describe, it, expect } from "vitest";
import { VALID_AMOUNTS, AIRDROP_TIERS } from "../airdrop";
import { resolveTier } from "../airdrop/server";

describe("VALID_AMOUNTS", () => {
  it("should contain expected amounts", () => {
    expect(VALID_AMOUNTS).toEqual([0.5, 1, 2.5, 5]);
  });
});

describe("AIRDROP_TIERS", () => {
  it("should have default and github tiers", () => {
    expect(AIRDROP_TIERS.default).toBeDefined();
    expect(AIRDROP_TIERS.github).toBeDefined();
  });

  it("each tier should have required fields", () => {
    for (const tier of Object.values(AIRDROP_TIERS)) {
      expect(tier.coveredHours).toBeGreaterThan(0);
      expect(tier.allowedRequests).toBeGreaterThan(0);
      expect(tier.maxAmountPerRequest).toBeGreaterThan(0);
    }
  });
});

describe("resolveTier", () => {
  it("should return github tier when githubId is provided", () => {
    expect(resolveTier("user-123")).toBe(AIRDROP_TIERS.github);
  });

  it("should return default tier when githubId is undefined", () => {
    expect(resolveTier(undefined)).toBe(AIRDROP_TIERS.default);
  });

  it("should return github tier for any truthy string", () => {
    expect(resolveTier("abc")).toBe(AIRDROP_TIERS.github);
  });
});
