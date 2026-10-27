import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import type { Tag, Wallet } from "../../../types/domain";

vi.mock("../../../api/walletOps", () => ({
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  updateWallet: vi.fn(),
}));
vi.mock("../../../api/walletDataCache", () => ({ invalidate: vi.fn() }));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

import * as walletOps from "../../../api/walletOps";
import { invalidate } from "../../../api/walletDataCache";
import { triggerToast } from "../../../components/ui/ToastNotification.tsx";
import { useWalletMutations } from "../../../dashboard/wallet/useWalletMutations";

const ops = walletOps as unknown as Record<string, ReturnType<typeof vi.fn>>;
const wallet = { id: "w1", name: "W" } as Wallet;
const initialTags = [
  { name: "Food", updatedAt: "u1" },
  { name: "Snacks", parentName: "Food" },
  { name: "Rent" },
] as unknown as Tag[];

function setup(onWalletUpdate = vi.fn()) {
  return renderHook(() => {
    const [w, setWallet] = useState<Wallet>(wallet);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const m = useWalletMutations({
      wallet: w,
      tags,
      setWallet,
      setTags,
      onWalletUpdate,
    });
    return { ...m, wallet: w, tags };
  });
}

describe("useWalletMutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a tag online", async () => {
    ops.createTag.mockResolvedValue({ queued: false, data: { name: "New" } });
    const { result } = setup();
    let ok = false;
    await act(async () => {
      ok = await result.current.handleAddTag({ name: "New" });
    });
    expect(ok).toBe(true);
    expect(result.current.tags.map((t) => t.name)).toContain("New");
    expect(invalidate).toHaveBeenCalledWith("w1");
    expect(triggerToast).toHaveBeenCalledWith(
      "Tag created successfully!",
      true,
    );
  });

  it("leaves state alone when the write is queued offline", async () => {
    ops.createTag.mockResolvedValue({ queued: true, data: null });
    const { result } = setup();
    await act(async () => {
      await result.current.handleAddTag({ name: "New" });
    });
    expect(result.current.tags).toBe(initialTags);
    expect(triggerToast).toHaveBeenCalledWith(
      "Saved offline — will sync when you're back online",
      true,
    );
  });

  it("renames a tag, re-parents its children and sends the base updatedAt", async () => {
    ops.updateTag.mockResolvedValue({ queued: false, data: null });
    const { result } = setup();
    await act(async () => {
      await result.current.handleUpdateTag("Food", { name: "Meals" });
    });
    expect(ops.updateTag).toHaveBeenCalledWith(
      "w1",
      "Food",
      { name: "Meals" },
      "u1",
    );
    expect(result.current.tags.map((t) => [t.name, t.parentName])).toEqual([
      ["Meals", undefined],
      ["Snacks", "Meals"],
      ["Rent", undefined],
    ]);
  });

  it("deletes a tag with its children", async () => {
    ops.deleteTag.mockResolvedValue({ queued: false, data: null });
    const { result } = setup();
    await act(async () => {
      await result.current.handleDeleteTag("Food");
    });
    expect(result.current.tags.map((t) => t.name)).toEqual(["Rent"]);
  });

  it("returns false and toasts on error", async () => {
    ops.deleteTag.mockRejectedValue(new Error("boom"));
    const { result } = setup();
    let ok = true;
    await act(async () => {
      ok = await result.current.handleDeleteTag("Food");
    });
    expect(ok).toBe(false);
    expect(triggerToast).toHaveBeenLastCalledWith(expect.any(String), false);
  });

  it("updates the wallet and notifies the parent", async () => {
    ops.updateWallet.mockResolvedValue({
      queued: false,
      data: { ...wallet, name: "Renamed" },
    });
    const onWalletUpdate = vi.fn();
    const { result } = setup(onWalletUpdate);
    await act(async () => {
      await result.current.handleUpdateWallet({ name: "Renamed" });
    });
    expect(result.current.wallet.name).toBe("Renamed");
    expect(onWalletUpdate).toHaveBeenCalledOnce();
  });
});
