import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readWalletOrder,
  sortWalletsBySavedOrder,
  writeWalletOrder,
} from "../../utils/walletOrder";

beforeEach(() => localStorage.clear());

describe("readWalletOrder / writeWalletOrder", () => {
  it("returns null when nothing is saved", () => {
    expect(readWalletOrder()).toBeNull();
  });

  it("round-trips the saved ids under wallet_order", () => {
    writeWalletOrder(["b", "a"]);
    expect(localStorage.getItem("wallet_order")).toBe('["b","a"]');
    expect(readWalletOrder()).toEqual(["b", "a"]);
  });

  it("logs and returns null for unparseable or non-array data", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("wallet_order", "{nope");
    expect(readWalletOrder()).toBeNull();
    localStorage.setItem("wallet_order", "5");
    expect(readWalletOrder()).toBeNull();
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
});

describe("sortWalletsBySavedOrder", () => {
  it("orders by saved ids and appends unknown ones in their original order", () => {
    const wallets = [{ id: "x" }, { id: "a" }, { id: "y" }, { id: "b" }];
    expect(
      sortWalletsBySavedOrder(wallets, ["b", "a", "gone"]).map((w) => w.id),
    ).toEqual(["b", "a", "x", "y"]);
    expect(wallets.map((w) => w.id)).toEqual(["x", "a", "y", "b"]);
  });
});
