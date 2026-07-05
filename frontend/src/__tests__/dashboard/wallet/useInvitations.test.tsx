import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import { useInvitations } from "../../../dashboard/wallet/useInvitations";
import api from "../../../api/axiosConfig";
import type { Invitation } from "../../../utils/types";

const apiGet = (api as unknown as { get: ReturnType<typeof vi.fn> }).get;
const apiPost = (api as unknown as { post: ReturnType<typeof vi.fn> }).post;

const makeInvite = (
  id: string,
  status: Invitation["status"] = "PENDING",
): Invitation => ({
  walletOwner: "Alice",
  role: "EDITOR",
  status,
  invitedAt: "2026-01-01",
  wallet: {
    id,
    name: "W " + id,
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2026-01-01",
    userRole: "EDITOR",
  },
});

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

describe("useInvitations", () => {
  it("loads only PENDING invitations", async () => {
    apiGet.mockResolvedValue({
      data: [makeInvite("a"), makeInvite("b", "ACCEPTED")],
    });
    const { result } = renderHook(() => useInvitations(vi.fn()));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.invites.map((i) => i.wallet.id)).toEqual(["a"]);
  });

  it("accept posts, removes the invite and refreshes wallets", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockResolvedValue({});
    const onRefreshAll = vi.fn();
    const { result } = renderHook(() => useInvitations(onRefreshAll));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.accept("a");
    });
    expect(apiPost).toHaveBeenCalledWith("/invitations/a/accept");
    expect(result.current.invites).toHaveLength(0);
    expect(onRefreshAll).toHaveBeenCalledTimes(1);
  });

  it("reject posts and removes the invite without refreshing", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockResolvedValue({});
    const onRefreshAll = vi.fn();
    const { result } = renderHook(() => useInvitations(onRefreshAll));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.reject("a");
    });
    expect(apiPost).toHaveBeenCalledWith("/invitations/a/reject");
    expect(result.current.invites).toHaveLength(0);
    expect(onRefreshAll).not.toHaveBeenCalled();
  });

  it("keeps the invite when accept fails", async () => {
    apiGet.mockResolvedValue({ data: [makeInvite("a")] });
    apiPost.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useInvitations(vi.fn()));
    await waitFor(() => expect(result.current.invites).toHaveLength(1));
    await act(async () => {
      await result.current.accept("a");
    });
    expect(result.current.invites).toHaveLength(1);
  });
});
