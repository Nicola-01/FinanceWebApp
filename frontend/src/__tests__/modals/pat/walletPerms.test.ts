import { describe, expect, it } from "vitest";
import type { WalletPermState } from "../../../types/domain";
import { applyPermissionLevel } from "../../../modals/pat/walletPerms";

const wp = (
  walletId: string,
  over: Partial<WalletPermState> = {},
): WalletPermState => ({
  walletId,
  walletName: walletId,
  walletIcon: "",
  walletColor: "",
  enabled: false,
  read: true,
  write: false,
  ...over,
});

describe("applyPermissionLevel", () => {
  const perms = [wp("a"), wp("b", { enabled: true, write: true })];

  it("grants read only", () => {
    expect(applyPermissionLevel(perms, "a", "read")[0]).toMatchObject({
      enabled: true,
      read: true,
      write: false,
    });
  });

  it("grants write together with read", () => {
    expect(applyPermissionLevel(perms, "a", "write")[0]).toMatchObject({
      enabled: true,
      read: true,
      write: true,
    });
  });

  it("revokes everything on none", () => {
    expect(applyPermissionLevel(perms, "b", "none")[1]).toMatchObject({
      enabled: false,
      read: false,
      write: false,
    });
  });

  it("leaves other wallets untouched and does not mutate the input", () => {
    const next = applyPermissionLevel(perms, "a", "write");
    expect(next[1]).toBe(perms[1]);
    expect(perms[0].write).toBe(false);
  });
});
