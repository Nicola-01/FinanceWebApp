import type React from "react";
import { walletVars } from "../../utils/color.ts";
import { Icon } from "../icon/Icon.tsx";

/** Compact wallet tile (sidebar): solid wallet colour when active, neutral row with a colour edge otherwise. */
export const WalletMiniCard: React.FC<{
  name: string;
  color: string;
  meta?: React.ReactNode;
  /** Wallet icon key (`wallet.icon`), shown before the name. */
  icon?: string;
  active?: boolean;
  className?: string;
}> = ({ name, color, meta, icon, active = false, className }) => (
  <div
    data-active={active ? "true" : undefined}
    style={walletVars(color)}
    className={[
      "grid h-[58px] grid-cols-[1fr_auto] items-center gap-2 rounded-[12px] px-3 py-2.5 text-left",
      // Only the active wallet is a solid card; the others are neutral rows with a colour edge (D10).
      active
        ? "bg-wallet text-on-wallet"
        : "bg-app-raised text-app-text shadow-[inset_4px_0_0_var(--wallet)]",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {icon ? (
      <span className="flex min-w-0 items-center gap-2">
        <Icon icon={icon} className="text-[13px]" />
        <span className="truncate font-display text-[15px] font-semibold">
          {name}
        </span>
      </span>
    ) : (
      <span className="truncate font-display text-[15px] font-semibold">
        {name}
      </span>
    )}
    {meta ? (
      <span
        className={`text-[11px] ${active ? "opacity-70" : "text-app-muted"}`}
      >
        {meta}
      </span>
    ) : null}
  </div>
);
