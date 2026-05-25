import { describe, it, expect, vi, beforeEach } from "vitest";

import { AirdropError, AirdropErrorCode } from "../airdrop-error";

vi.mock("@/lib/auth", () => ({
  withOptionalUserSession: (handler: Function) => {
    return (req: Request, _opts?: { params?: Record<string, string> }) => {
      const sessionHeader = req.headers.get("x-test-session");
      const session = sessionHeader ? JSON.parse(sessionHeader) : null;
      return handler({ req, session });
    };
  },
}));

vi.mock("@solana-developers/helpers", () => ({
  getKeypairFromEnvironment: vi.fn().mockReturnValue(
    (() => {
      const { Keypair } = require("@solana/web3.js");
      return Keypair.generate();
    })(),
  ),
}));

vi.mock("../handler", () => ({
  handleAirdrop: vi.fn().mockResolvedValue({ success: true, signature: "sig" }),
}));

import { POST as _POST } from "../route";
import { handleAirdrop } from "../handler";

const POST = (req: Request) => _POST(req, { params: {} });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(handleAirdrop).mockResolvedValue({ success: true, signature: "sig" });
});

describe("POST /api/request", () => {
  describe("response mapping", () => {
    it("should return 200 when handler succeeds", async () => {
      const res = await POST(buildRequest());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true, message: "Airdrop successful", signature: "sig" });
    });

    it("should return error status when handler fails", async () => {
      vi.mocked(handleAirdrop).mockResolvedValue({
        success: false,
        error: new AirdropError(AirdropErrorCode.RATE_LIMITED),
      });

      const res = await POST(buildRequest());
      expect(res.status).toBe(429);
    });

    it("should return error message in response body", async () => {
      vi.mocked(handleAirdrop).mockResolvedValue({
        success: false,
        error: new AirdropError(AirdropErrorCode.TX_FAILED),
      });

      const res = await POST(buildRequest());
      expect(await res.text()).toBe("Faucet is empty, ping @solana_devs on Twitter");
    });
  });

  describe("buildContext errors", () => {
    it("should return 400 for non-JSON body", async () => {
      const req = new Request("http://localhost/api/request", {
        method: "POST",
        headers: {
          "cf-connecting-ip": "1.2.3.4",
          "x-test-session": JSON.stringify({
            user: { githubUserId: "user-123" },
          }),
        },
        body: "not-json",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 400 for null body", async () => {
      const req = new Request("http://localhost/api/request", {
        method: "POST",
        headers: {
          "cf-connecting-ip": "1.2.3.4",
          "content-type": "application/json",
          "x-test-session": JSON.stringify({
            user: { githubUserId: "user-123" },
          }),
        },
        body: "null",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 400 for array body", async () => {
      const req = new Request("http://localhost/api/request", {
        method: "POST",
        headers: {
          "cf-connecting-ip": "1.2.3.4",
          "content-type": "application/json",
          "x-test-session": JSON.stringify({
            user: { githubUserId: "user-123" },
          }),
        },
        body: "[]",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid wallet in body", async () => {
      const res = await POST(buildRequest({ walletAddress: "bad" }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid amount", async () => {
      const res = await POST(buildRequest({ amount: 999 }));
      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid network", async () => {
      const res = await POST(buildRequest({ network: "mainnet" }));
      expect(res.status).toBe(400);
    });
  });

  describe("context passed to handler", () => {
    it("should pass parsed session githubUserId", async () => {
      await POST(buildRequest());

      expect(handleAirdrop).toHaveBeenCalledWith(
        expect.objectContaining({ githubUserId: "user-123" }),
      );
    });

    it("should pass undefined githubUserId when no session", async () => {
      await POST(buildRequest({}, { "x-test-session": "null" }));

      expect(handleAirdrop).toHaveBeenCalledWith(
        expect.objectContaining({ githubUserId: undefined }),
      );
    });

    it("should pass sanitized IP", async () => {
      await POST(buildRequest());

      expect(handleAirdrop).toHaveBeenCalledWith(
        expect.objectContaining({ ip: "1.2.3.4", sanitizedIp: "1234" }),
      );
    });
  });

  describe("sensitive field redaction", () => {
    it("should keep faucetKeypair and authToken accessible to consumers", async () => {
      await POST(buildRequest({}, { authorization: "Bearer secret-token" }));

      const ctx = vi.mocked(handleAirdrop).mock.calls[0][0];
      expect(ctx.faucetKeypair).toBeDefined();
      expect(ctx.authToken).toBe("secret-token");
    });

    it("should hide sensitive fields from Object.keys and spread", async () => {
      await POST(buildRequest({}, { authorization: "Bearer secret-token" }));

      const ctx = vi.mocked(handleAirdrop).mock.calls[0][0];
      expect(Object.keys(ctx)).not.toContain("faucetKeypair");
      expect(Object.keys(ctx)).not.toContain("authToken");
      expect({ ...ctx }).not.toHaveProperty("faucetKeypair");
      expect({ ...ctx }).not.toHaveProperty("authToken");
    });

    it("should redact sensitive fields in JSON.stringify", async () => {
      await POST(buildRequest({}, { authorization: "Bearer secret-token" }));

      const ctx = vi.mocked(handleAirdrop).mock.calls[0][0];
      const json = JSON.stringify(ctx);
      expect(json).not.toContain("secret-token");
      expect(JSON.parse(json)).toMatchObject({
        faucetKeypair: "<redacted>",
        authToken: "<redacted>",
      });
    });

    it("should omit authToken redaction placeholder when not present", async () => {
      await POST(buildRequest());

      const ctx = vi.mocked(handleAirdrop).mock.calls[0][0];
      const parsed = JSON.parse(JSON.stringify(ctx));
      expect(parsed).toMatchObject({ faucetKeypair: "<redacted>" });
      expect(parsed).not.toHaveProperty("authToken");
    });
  });
});

function buildRequest(
  bodyOverrides: Record<string, unknown> = {},
  headerOverrides: Record<string, string> = {},
): Request {
  const body = {
    walletAddress: "GFNcycM4KJBibmCGMNyCt9ywUERQBgJ9AMqVuRw7HbZU",
    amount: 1,
    network: "devnet",
    cloudflareCallback: "captcha-token",
    ...bodyOverrides,
  };

  const headers: Record<string, string> = {
    "cf-connecting-ip": "1.2.3.4",
    "content-type": "application/json",
    "x-test-session": JSON.stringify({
      user: { githubUserId: "user-123", githubUsername: "testuser" },
    }),
    ...headerOverrides,
  };

  return new Request("http://localhost/api/request", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
