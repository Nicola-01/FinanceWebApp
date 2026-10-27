import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import type { Wallet } from "../../types/domain";

const { deleteObject, apiDelete, triggerToast } = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  apiDelete: vi.fn(),
  triggerToast: vi.fn(),
}));
vi.mock("../../modals/common/DeleteModalContext", () => ({
  useDeleteModal: () => ({ current: { deleteObject } }),
}));
vi.mock("../../api/axiosConfig", () => ({ default: { delete: apiDelete } }));
vi.mock("../../components/ui/ToastNotification.tsx", () => ({
  triggerToast,
}));

import { useWalletDeletion } from "../../dashboard/useWalletDeletion";

const owned = { id: "w1", name: "Mine", userRole: "OWNER" } as Wallet;
const shared = { id: "w2", name: "Theirs", userRole: "EDITOR" } as Wallet;

function setup() {
  return renderHook(() => {
    const [wallets, setWallets] = useState<Wallet[]>([owned, shared]);
    return { wallets, ...useWalletDeletion(setWallets) };
  });
}

describe("useWalletDeletion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes owners to the delete modal, which removes the wallet", async () => {
    apiDelete.mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.requestDelete(owned));
    expect(result.current.quitTarget).toBeNull();
    expect(deleteObject).toHaveBeenCalledWith(
      owned,
      "wallet",
      expect.any(Function),
      2,
    );

    await act(async () => {
      await deleteObject.mock.calls[0][2]();
    });
    expect(apiDelete).toHaveBeenCalledWith("/wallets/w1");
    expect(result.current.wallets).toEqual([shared]);
    expect(triggerToast).toHaveBeenCalledWith("Deleted!", true);
  });

  it("routes non-owners to the quit confirm and leaves on confirm", async () => {
    apiDelete.mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.requestDelete(shared));
    expect(deleteObject).not.toHaveBeenCalled();
    expect(result.current.quitTarget).toBe(shared);

    await act(async () => {
      await result.current.confirmQuit();
    });
    expect(result.current.wallets).toEqual([owned]);
    expect(result.current.quitTarget).toBeNull();
    expect(result.current.isQuitting).toBe(false);
    expect(triggerToast).toHaveBeenCalledWith("You left the wallet", true);
  });

  it("keeps the wallet and toasts on error; cancel clears the target", async () => {
    apiDelete.mockRejectedValue(new Error("nope"));
    const { result } = setup();
    act(() => result.current.requestDelete(shared));
    await act(async () => {
      await result.current.confirmQuit();
    });
    expect(result.current.wallets).toHaveLength(2);
    expect(triggerToast).toHaveBeenCalledWith(expect.any(String), false);

    act(() => result.current.requestDelete(shared));
    act(() => result.current.cancelQuit());
    expect(result.current.quitTarget).toBeNull();
  });
});
