import { describe, it, expect, beforeEach, vi } from "vitest";
import { isAuthorizedToBypass } from "../auth-bypass";


describe("isAuthorizedToBypass", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return false for undefined token", () => {
    setAllowList([{ token: "abc" }]);
    expect(isAuthorizedToBypass(undefined)).toBe(false);
  });

  it("should return false when env var is missing", () => {
    expect(isAuthorizedToBypass("abc")).toBe(false);
  });

  it("should return false when token is not in the list", () => {
    setAllowList([{ token: "abc" }]);
    expect(isAuthorizedToBypass("xyz")).toBe(false);
  });

  it("should return true for a matching token", () => {
    setAllowList([{ token: "abc" }]);
    expect(isAuthorizedToBypass("abc")).toBe(true);
  });

  it("should return true for a matching token with name", () => {
    setAllowList([{ token: "abc", name: "CI" }]);
    expect(isAuthorizedToBypass("abc")).toBe(true);
  });

  it("should return false when token is not yet active", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    setAllowList([{ token: "abc", startDate: future }]);
    expect(isAuthorizedToBypass("abc")).toBe(false);
  });

  it("should return false when token has expired", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    setAllowList([{ token: "abc", endDate: past }]);
    expect(isAuthorizedToBypass("abc")).toBe(false);
  });

  it("should return true when within time window", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();
    setAllowList([{ token: "abc", startDate: past, endDate: future }]);
    expect(isAuthorizedToBypass("abc")).toBe(true);
  });

  it("should handle invalid JSON in env var gracefully", () => {
    vi.stubEnv("AUTH_TOKENS_ALLOW_LIST", "not json");
    expect(isAuthorizedToBypass("abc")).toBe(false);
  });

  it("should handle non-array JSON gracefully", () => {
    vi.stubEnv("AUTH_TOKENS_ALLOW_LIST", '{"token": "abc"}');
    expect(isAuthorizedToBypass("abc")).toBe(false);
  });

  it("should skip malformed entries missing token field", () => {
    setAllowList([{ name: "no-token" }, { token: "abc" }]);
    expect(isAuthorizedToBypass("abc")).toBe(true);
  });

  it("should skip entries where token is not a string", () => {
    setAllowList([{ token: 123 }, { token: "abc" }]);
    expect(isAuthorizedToBypass("abc")).toBe(true);
  });
});

function setAllowList(list: unknown) {
  vi.stubEnv("AUTH_TOKENS_ALLOW_LIST", JSON.stringify(list));
}