import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../api/axiosConfig", () => ({ default: { get: vi.fn() } }));

import api from "../../api/axiosConfig";
import { useInviteToken } from "../../auth/useInviteToken";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;

const opts = {
  endpoint: "/auth/register",
  validStatus: "PENDING",
  missingTokenMessage: "missing",
  usedMessage: "used",
  invalidMessage: "invalid",
};

describe("useInviteToken", () => {
  beforeEach(() => mockedGet.mockReset());

  it("errors immediately without a token", () => {
    const { result } = renderHook(() => useInviteToken(null, opts));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("missing");
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("loads a valid invite", async () => {
    mockedGet.mockResolvedValue({
      data: { email: "a@b.c", status: "PENDING" },
    });
    const { result } = renderHook(() => useInviteToken("t1", opts));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedGet).toHaveBeenCalledWith("/auth/register/t1");
    expect(result.current.inviteData?.email).toBe("a@b.c");
    expect(result.current.error).toBeNull();
  });

  it("flags a used invite and a failed lookup", async () => {
    mockedGet.mockResolvedValueOnce({ data: { status: "USED" } });
    const used = renderHook(() => useInviteToken("t1", opts));
    await waitFor(() => expect(used.result.current.error).toBe("used"));

    mockedGet.mockRejectedValueOnce(new Error("boom"));
    const failed = renderHook(() => useInviteToken("t2", opts));
    await waitFor(() => expect(failed.result.current.isLoading).toBe(false));
    expect(failed.result.current.error).toBeTruthy();
  });
});
