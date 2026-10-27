import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Wallet } from "../../types/domain";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

import {
  resolveWalletParam,
  useWalletRouting,
} from "../../dashboard/useWalletRouting";
import { walletSlug } from "../../utils/walletSlug";

const wallets = [
  { id: "0000-aaaaa", name: "Home" },
  { id: "0000-bbbbb", name: "Trip" },
] as Wallet[];

describe("resolveWalletParam", () => {
  it("returns null for an empty param", () => {
    expect(resolveWalletParam(wallets, undefined)).toBeNull();
  });
  it("matches a full id exactly", () => {
    expect(resolveWalletParam(wallets, "0000-bbbbb")).toBe(wallets[1]);
  });
  it("matches the last slug segment against the id suffix", () => {
    expect(resolveWalletParam(wallets, "whatever-aaaaa")).toBe(wallets[0]);
  });
  it("returns null when nothing matches", () => {
    expect(resolveWalletParam(wallets, "x-zzzzz")).toBeNull();
  });
});

describe("useWalletRouting", () => {
  beforeEach(() => navigate.mockReset());

  it("does nothing while loading", () => {
    renderHook(() => useWalletRouting(wallets, true, "0000-aaaaa"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("rewrites a non-canonical param to the canonical slug", () => {
    const { result } = renderHook(() =>
      useWalletRouting(wallets, false, "0000-aaaaa"),
    );
    expect(result.current).toBe(wallets[0]);
    expect(navigate).toHaveBeenCalledWith(
      `/dashboard/${walletSlug(wallets[0])}`,
      { replace: true },
    );
  });

  it("leaves a canonical param alone", () => {
    renderHook(() => useWalletRouting(wallets, false, walletSlug(wallets[1])));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("falls back to the first wallet for an unknown param", () => {
    const { result } = renderHook(() =>
      useWalletRouting(wallets, false, "gone-zzzzz"),
    );
    expect(result.current).toBeNull();
    expect(navigate).toHaveBeenCalledWith(
      `/dashboard/${walletSlug(wallets[0])}`,
      { replace: true },
    );
  });
});
