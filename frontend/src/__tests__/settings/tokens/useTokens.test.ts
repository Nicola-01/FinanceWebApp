import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { useTokens } from "../../../settings/tokens/useTokens";
import { useTokenDialog } from "../../../settings/tokens/useTokenDialog";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;
const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;

const tokens = [
  { id: "t1", name: "a", paused: false, walletPermissions: [] },
  { id: "t2", name: "b", paused: false, walletPermissions: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockedGet.mockImplementation((url: string) =>
    Promise.resolve({
      data:
        url === "/tokens"
          ? tokens
          : [{ id: "w1", name: "Home", icon: "x", color: "#fff" }],
    }),
  );
});

describe("useTokens", () => {
  it("loads tokens and the wallet map on mount", async () => {
    const { result } = renderHook(() => useTokens());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tokens).toHaveLength(2);
    await waitFor(() => expect(result.current.walletsMap.w1.name).toBe("Home"));
  });

  it("bulk-pauses the selection and keeps it", async () => {
    mockedPost.mockResolvedValue({
      data: tokens.map((t) => ({ ...t, paused: true })),
    });
    const { result } = renderHook(() => useTokens());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.selectAll(result.current.tokens));
    await act(() => result.current.handleBulkPause(true));
    expect(mockedPost).toHaveBeenCalledWith("/tokens/bulk-pause", {
      ids: ["t1", "t2"],
      paused: true,
    });
    expect(result.current.tokens.every((t) => t.paused)).toBe(true);
    expect(result.current.selected.size).toBe(2);
    expect(triggerToast).toHaveBeenCalledWith("2 tokens paused", true);
  });
});

describe("useTokenDialog", () => {
  it("creates a token with the enabled wallet permissions", async () => {
    mockedPost.mockResolvedValue({ data: { plainToken: "fin_pat_x" } });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useTokenDialog(onSaved));
    await act(async () => result.current.openCreate());
    await waitFor(() => expect(result.current.walletPerms).toHaveLength(1));
    act(() => {
      result.current.setTokenName(" CI ");
      result.current.setPermission("w1", "write");
    });
    await act(() => result.current.handleSubmit());
    expect(mockedPost).toHaveBeenCalledWith("/tokens", {
      name: "CI",
      walletPermissions: [{ walletId: "w1", permissions: ["READ", "WRITE"] }],
    });
    expect(result.current.view).toBe("showToken");
    expect(result.current.generatedToken).toBe("fin_pat_x");
    act(() => result.current.handleCloseClick());
    expect(onSaved).toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const { result } = renderHook(() => useTokenDialog(vi.fn()));
    await act(() => result.current.handleSubmit());
    expect(triggerToast).toHaveBeenCalledWith(
      "Please enter a token name",
      false,
    );
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
