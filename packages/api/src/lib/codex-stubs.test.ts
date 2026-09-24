import { describe, expect, it } from "vitest";

import { buildCodexOAuthStub } from "./codex-stubs";

const decodeClaims = (jwt: string) =>
  JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString()) as {
    "https://api.openai.com/auth": Record<string, string>;
  };

const parse = (stub: string) =>
  JSON.parse(stub) as {
    tokens: Record<string, string>;
  };

describe("buildCodexOAuthStub", () => {
  it("carries the vaulted ChatGPT account id, so Codex's workspace check finds it", () => {
    const { tokens } = parse(buildCodexOAuthStub("acc_123"));

    expect(tokens.account_id).toBe("acc_123");
    expect(
      decodeClaims(tokens.id_token!)["https://api.openai.com/auth"]
        .chatgpt_account_id,
    ).toBe("acc_123");
  });

  it("keeps every credential a placeholder", () => {
    const { tokens } = parse(buildCodexOAuthStub("acc_123"));

    expect(tokens.access_token).toBe("onecli-managed");
    expect(tokens.refresh_token).toBe("onecli-managed");
  });

  it.each([undefined, null, ""])(
    "falls back to the placeholder account id without one (%s)",
    (accountId) => {
      const { tokens } = parse(buildCodexOAuthStub(accountId));

      expect(tokens.account_id).toBe("onecli-managed");
      expect(
        decodeClaims(tokens.id_token!)["https://api.openai.com/auth"]
          .chatgpt_account_id,
      ).toBe("onecli-managed");
    },
  );

  it("still produces the original placeholder id_token without an account id", () => {
    const { tokens } = parse(buildCodexOAuthStub());

    expect(tokens.id_token).toBe(
      [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "eyJzdWIiOiJvbmVjbGktbWFuYWdlZCIsImVtYWlsIjoib25lY2xpQG9uZWNsaS5zaCIsImV4cCI6NDEwMjQ0NDgwMCwiaWF0IjoxNzM1Njg5NjAwLCJodHRwczovL2FwaS5vcGVuYWkuY29tL2F1dGgiOnsiY2hhdGdwdF9wbGFuX3R5cGUiOiJmcmVlIiwiY2hhdGdwdF91c2VyX2lkIjoib25lY2xpLW1hbmFnZWQiLCJjaGF0Z3B0X2FjY291bnRfaWQiOiJvbmVjbGktbWFuYWdlZCJ9fQ",
        "b25lY2xpLW1hbmFnZWQtc2lnbmF0dXJl",
      ].join("."),
    );
  });
});
