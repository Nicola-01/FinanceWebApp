import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { stubLocation } from "../../../test/testUtils";

vi.mock("../../../utils/authHelper", () => ({
  isTokenValid: vi.fn(() => true),
  getToken: vi.fn(() => "jwt"),
}));
vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import axios from "axios";
import { useOAuthAuthorize } from "../../../auth/oauth/useOAuthAuthorize";
import type { OAuthParams } from "../../../auth/oauth/useOAuthParams";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockedAxiosPost = axios.post as unknown as ReturnType<typeof vi.fn>;

const params: OAuthParams = {
  clientId: "claude",
  redirectUri: "http://cb",
  scope: "",
  codeChallenge: "cc",
  state: "st-hook",
  tokenName: "OAuth: claude",
  valid: true,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe("useOAuthAuthorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockedGet.mockResolvedValue({
      data: [{ id: "w1", name: "Home", icon: "x", color: "#fff" }],
    });
  });

  it("creates a scoped token, completes OAuth and marks the state used", async () => {
    const loc = stubLocation();
    mockedPost.mockResolvedValue({ data: { plainToken: "fin_pat_x" } });
    mockedAxiosPost.mockResolvedValue({
      data: { redirectUrl: "http://cb?code=1" },
    });

    const { result } = renderHook(() => useOAuthAuthorize(params), { wrapper });
    await waitFor(() => expect(result.current.walletPerms).toHaveLength(1));
    act(() => result.current.setPermission("w1", "write"));
    await act(() => result.current.handleAuthorize());

    expect(mockedPost).toHaveBeenCalledWith("/tokens", {
      name: "OAuth: claude",
      walletPermissions: [{ walletId: "w1", permissions: ["READ", "WRITE"] }],
    });
    expect(mockedAxiosPost.mock.calls[0][0]).toMatch(/\/oauth\/authorize$/);
    expect(sessionStorage.getItem("oauth_used_state_st-hook")).toBe("true");
    expect(loc.href).toBe("http://cb?code=1");
  });
});
