import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeIp, isAllowListedIp } from "../ip";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("sanitizeIp", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should strip colons from IPv6", () => {
    expect(sanitizeIp("::1")).toBe("1");
  });

  it("should strip colons from full IPv6", () => {
    expect(sanitizeIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(
      "20010db885a3000000008a2e03707334",
    );
  });

  it("should strip dots from IPv4", () => {
    expect(sanitizeIp("192.168.1.1")).toBe("19216811");
  });
});

describe("isAllowListedIp", () => {
  it("should return false when env var is missing", () => {
    expect(isAllowListedIp("1.2.3.4")).toBe(false);
  });

  it("should return true when IP is in the list", () => {
    vi.stubEnv("IP_ALLOW_LIST", '["1.2.3.4", "5.6.7.8"]');
    expect(isAllowListedIp("1.2.3.4")).toBe(true);
  });

  it("should return false when IP is not in the list", () => {
    vi.stubEnv("IP_ALLOW_LIST", '["1.2.3.4"]');
    expect(isAllowListedIp("9.9.9.9")).toBe(false);
  });

  it("should handle invalid JSON gracefully", () => {
    vi.stubEnv("IP_ALLOW_LIST", "not json");
    expect(isAllowListedIp("1.2.3.4")).toBe(false);
  });

  it("should handle empty array", () => {
    vi.stubEnv("IP_ALLOW_LIST", "[]");
    expect(isAllowListedIp("1.2.3.4")).toBe(false);
  });
});
