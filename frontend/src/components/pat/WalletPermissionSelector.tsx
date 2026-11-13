import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPen, faBan } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../icon/Icon.tsx";
import type { WalletPermState } from "../../types/domain";
import { Selector } from "../ui/Selector.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";

interface WalletPermissionSelectorProps {
  walletPerms: WalletPermState[];
  setPermission: (walletId: string, level: "none" | "read" | "write") => void;
}

export const WalletPermissionSelector: React.FC<
  WalletPermissionSelectorProps
> = ({ walletPerms, setPermission }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: no per-wallet inline tints; state is a card fill.
  const isV2 = ui === "v2";
  return (
    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
      {walletPerms.map((wp) => {
        const accent = wp.walletColor || "#6b7280";
        return (
          <div
            key={wp.walletId}
            className={`p-3.5 transition-all ${
              isV2
                ? `rounded-[var(--r-card)] shadow-[var(--box-ring)] ${wp.enabled ? "bg-app-card" : "bg-app-bg"}`
                : `rounded-[var(--r-input)] border ${wp.enabled ? "" : "border-app-border bg-app-input/30"}`
            }`}
            // Selected rows are highlighted with the wallet's own accent colour.
            style={
              !isV2 && wp.enabled
                ? { borderColor: `${accent}66`, backgroundColor: `${accent}14` }
                : undefined
            }
          >
            <div className="flex flex-col gap-3">
              {/* Wallet info */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${isV2 ? "bg-app-raised" : ""}`}
                  style={
                    isV2
                      ? undefined
                      : {
                          backgroundColor: (wp.walletColor || "#6b7280") + "20",
                        }
                  }
                >
                  <Icon icon={wp.walletIcon} color={wp.walletColor} />
                </div>
                <span className="text-sm font-semibold text-app-text">
                  {wp.walletName}
                </span>
              </div>

              {/* Segmented Control */}
              <Selector
                value={wp.enabled ? (wp.write ? "write" : "read") : "none"}
                onChange={(val) => setPermission(wp.walletId, val)}
                size="md"
                options={[
                  {
                    value: "none",
                    label: "Unauthorized",
                    icon: (
                      <FontAwesomeIcon icon={faBan} className="text-[10px]" />
                    ),
                    activeColorClass: isV2 ? "text-app-danger" : "text-app-red",
                  },
                  {
                    value: "read",
                    label: "Read",
                    icon: (
                      <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                    ),
                    activeColorClass: isV2
                      ? "text-app-text"
                      : "text-app-purple",
                  },
                  {
                    value: "write",
                    label: "Write",
                    icon: (
                      <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                    ),
                    activeColorClass: isV2
                      ? "text-app-text"
                      : "text-app-yellow",
                    disabled: wp.userRole === "VIEWER",
                    disabledTitle:
                      wp.userRole === "VIEWER"
                        ? "The wallet owner hasn't granted you edit access"
                        : undefined,
                  },
                ]}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
