import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faEye, faBan } from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../types/domain";
import { Icon } from "../icon/Icon";
import { useUiVersion } from "../../hooks/useUiVersion";

interface TokenWalletBadgesProps {
  token: PatToken;
  walletsMap: Record<string, Wallet>;
}

export const TokenWalletBadges: React.FC<TokenWalletBadgesProps> = ({
  token,
  walletsMap,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  const isV2 = ui === "v2";
  if (!token.walletPermissions || token.walletPermissions.length === 0)
    return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
      {token.walletPermissions.map((wp) => {
        const wallet = walletsMap[wp.walletId];
        const canWrite = wp.permissions?.includes("WRITE");
        const canRead = wp.permissions?.includes("READ");

        // Viewer (read) vs editor (edit) — icon + label + tint.
        // v2: no status hue for read/edit; only "none" (no access) is a status.
        const perm = canWrite
          ? {
              icon: faPen,
              label: "edit",
              tint: isV2 ? "text-app-text" : "text-app-yellow",
            }
          : canRead
            ? {
                icon: faEye,
                label: "read",
                tint: isV2 ? "text-app-muted" : "text-app-blue",
              }
            : {
                icon: faBan,
                label: "none",
                tint: isV2 ? "text-app-danger" : "text-app-red",
              };

        return (
          <span
            key={wp.walletId}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium ${
              // ui-v2-switch
              isV2
                ? "rounded-[var(--r-sm)] bg-app-raised"
                : "rounded-md border border-app-border bg-app-bg"
            }`}
          >
            {/* Colored wallet icon */}
            <Icon
              icon={wallet?.icon || "wallet"}
              color={wallet?.color}
              className="text-sm"
            />
            {/* Wallet name */}
            <span className="max-w-[10rem] truncate text-app-muted">
              {wallet?.name || wp.walletId.substring(0, 8) + "..."}
            </span>
            {/* Separator dot */}
            <span aria-hidden="true" className="text-app-muted/40">
              ·
            </span>
            {/* Access: viewer/editor icon + read/edit label */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${perm.tint}`}
              title={`${perm.label} access`}
            >
              <FontAwesomeIcon icon={perm.icon} />
              {perm.label}
            </span>
          </span>
        );
      })}
    </div>
  );
};
