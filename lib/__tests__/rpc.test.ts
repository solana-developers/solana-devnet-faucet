import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isNetwork, getRpcUrl, getConnection, VALID_NETWORKS } from "../rpc";

describe("isNetwork", () => {
  it("should return true for devnet", () => {
    expect(isNetwork("devnet")).toBe(true);
  });

  it("should return true for testnet", () => {
    expect(isNetwork("testnet")).toBe(true);
  });

  it("should return false for mainnet", () => {
    expect(isNetwork("mainnet")).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isNetwork(123)).toBe(false);
    expect(isNetwork(null)).toBe(false);
    expect(isNetwork(undefined)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isNetwork("")).toBe(false);
  });
});

describe("VALID_NETWORKS", () => {
  it("should contain devnet and testnet", () => {
    expect(VALID_NETWORKS).toContain("devnet");
    expect(VALID_NETWORKS).toContain("testnet");
    expect(VALID_NETWORKS).toHaveLength(2);
  });
});

describe("getRpcUrl", () => {
  // RPC_URLS is captured at module-import time, so each test must reset
  // modules and re-import after stubbing env to actually exercise the
  // fallback / override logic.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should fall back to default devnet URL when RPC_URL_DEVNET is unset", async () => {
    vi.stubEnv("RPC_URL_DEVNET", undefined as unknown as string);
    const { getRpcUrl } = await import("../rpc");
    expect(getRpcUrl("devnet")).toBe("https://api.devnet.solana.com");
  });

  it("should fall back to default testnet URL when RPC_URL_TESTNET is unset", async () => {
    vi.stubEnv("RPC_URL_TESTNET", undefined as unknown as string);
    const { getRpcUrl } = await import("../rpc");
    expect(getRpcUrl("testnet")).toBe("https://api.testnet.solana.com");
  });

  it("should use RPC_URL_DEVNET when set", async () => {
    vi.stubEnv("RPC_URL_DEVNET", "https://custom.devnet.example/");
    const { getRpcUrl } = await import("../rpc");
    expect(getRpcUrl("devnet")).toBe("https://custom.devnet.example/");
  });

  it("should use RPC_URL_TESTNET when set", async () => {
    vi.stubEnv("RPC_URL_TESTNET", "https://custom.testnet.example/");
    const { getRpcUrl } = await import("../rpc");
    expect(getRpcUrl("testnet")).toBe("https://custom.testnet.example/");
  });
});

describe("getConnection", () => {
  it("should return a Connection object for devnet", () => {
    const conn = getConnection("devnet");
    expect(conn).toBeDefined();
    expect(conn.rpcEndpoint).toMatch(/^https?:\/\//);
  });

  it("should return a Connection object for testnet", () => {
    const conn = getConnection("testnet");
    expect(conn).toBeDefined();
    expect(conn.rpcEndpoint).toMatch(/^https?:\/\//);
  });
});
