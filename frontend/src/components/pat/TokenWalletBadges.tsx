import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faEye, faBan } from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../utils/types";

interface TokenWalletBadgesProps {
  token: PatToken;
  walletsMap: Record<string, Wallet>;
}

export const TokenWalletBadges: React.FC<TokenWalletBadgesProps> = ({
  token,
  walletsMap,
}) => {
  if (!token.walletPermissions || token.walletPermissions.length === 0)
    return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
      {token.walletPermissions.map((wp) => {
        const wallet = walletsMap[wp.walletId];
        return (
          <span
            key={wp.walletId}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-app-bg text-app-muted border border-app-border"
          >
            {wallet?.icon && <span className="text-[10px]">{wallet.icon}</span>}
            {wp.permissions?.includes("WRITE") ? (
              <FontAwesomeIcon
                icon={faPen}
                className="theme-text-warning text-[8px]"
              />
            ) : wp.permissions?.includes("READ") ? (
              <FontAwesomeIcon
                icon={faEye}
                className="theme-text-primary text-[8px]"
              />
            ) : (
              <FontAwesomeIcon
                icon={faBan}
                className="theme-text-danger text-[8px]"
              />
            )}
            {wallet?.name || wp.walletId.substring(0, 8) + "..."}
          </span>
        );
      })}
    </div>
  );
};
