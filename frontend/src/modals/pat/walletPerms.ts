import type { WalletPermState } from "../../types/domain";

/** Set one wallet's access level: "none" disables it, "write" implies read. */
export function applyPermissionLevel(
  perms: WalletPermState[],
  walletId: string,
  level: "none" | "read" | "write",
): WalletPermState[] {
  return perms.map((w) =>
    w.walletId === walletId
      ? {
          ...w,
          enabled: level !== "none",
          read: level !== "none",
          write: level === "write",
        }
      : w,
  );
}
