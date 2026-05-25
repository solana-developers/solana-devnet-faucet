import { describe, it, expect, vi } from "vitest";
import { AirdropError, AirdropErrorCode } from "../airdrop-error";

vi.spyOn(console, "error").mockImplementation(() => {});

describe("AirdropError", () => {
  it("should set code, status, and message from error def", () => {
    const err = new AirdropError(AirdropErrorCode.INVALID_BODY);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("invalid_body");
    expect(err.status).toBe(400);
    expect(err.message).toBe("Invalid request body");
  });

  it("should allow overriding the message", () => {
    const err = new AirdropError(AirdropErrorCode.RATE_LIMITED, {
      message: "Too fast",
    });
    expect(err.code).toBe("rate_limited");
    expect(err.message).toBe("Too fast");
  });

  it("should preserve the cause", () => {
    const cause = new Error("upstream");
    const err = new AirdropError(AirdropErrorCode.TX_FAILED, { cause });
    expect(err.cause).toBe(cause);
  });
});
