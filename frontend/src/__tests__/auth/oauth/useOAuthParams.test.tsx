import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useOAuthParams } from "../../../auth/oauth/useOAuthParams";

const at =
  (url: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );

describe("useOAuthParams", () => {
  it("reads all params and names the token after the client", () => {
    const { result } = renderHook(() => useOAuthParams(), {
      wrapper: at(
        "/oauth/authorize?client_id=claude&redirect_uri=http%3A%2F%2Fx&scope=read%20write&code_challenge=abc&state=s1",
      ),
    });
    expect(result.current).toEqual({
      clientId: "claude",
      redirectUri: "http://x",
      scope: "read write",
      codeChallenge: "abc",
      state: "s1",
      tokenName: "OAuth: claude",
      valid: true,
    });
  });

  it("is invalid when a required param is missing (scope is optional)", () => {
    const { result } = renderHook(() => useOAuthParams(), {
      wrapper: at("/oauth/authorize?client_id=c&redirect_uri=r&state=s"),
    });
    expect(result.current.valid).toBe(false);
    expect(result.current.scope).toBe("");
  });
});
