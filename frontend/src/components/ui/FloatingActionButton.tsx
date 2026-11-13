import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import Button from "./Button.tsx";
import type { Wallet } from "../../types/domain.ts";
import { useUiVersion } from "../../hooks/useUiVersion";

interface FloatingActionButtonProps {
  wallet: Wallet;
  onClick: () => void;
  label?: string;
  mobileLabel?: string;
}

/**
 * Floating "add" action pinned to the bottom of a scrollable tab. Keeps the
 * frosted-glass ("ice") look tinted with `wallet.color`, and reuses the `Button`
 * primitive for the ripple: `ghost` variant so the glass fill / border / text
 * all come from the inline wallet tints, with a wallet-tinted ripple on press.
 */
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  wallet,
  onClick,
  label = "New Transaction",
  mobileLabel = "Add",
}) => {
  // `sm:min-w-60` pins a consistent desktop FAB width so "New Transaction" and
  // "New Subscription" match across tabs; on mobile both collapse to "Add"
  // (already equal), so no min-width is applied there.
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  // ui-v2-switch: solid wallet fill via `accentColor` (sets --wallet/--on-wallet), a
  // squared CTA radius (matches the primary button rather than a circle, since the
  // label stays visible on desktop), and a soft neutral shadow instead of a tinted glow.
  return (
    <div className="sticky bottom-8 mt-auto mx-auto w-max z-100 pointer-events-none">
      <Button
        type="button"
        onClick={onClick}
        variant={isV2 ? "primary" : "ghost"}
        accentColor={isV2 ? wallet.color : undefined}
        ripple
        rippleColor={`${wallet.color}55`}
        className={
          isV2
            ? "pointer-events-auto px-6 py-4 font-semibold shadow-[0_8px_24px_rgb(0_0_0/0.25)] hover:brightness-110 active:scale-95 sm:min-w-60"
            : "pointer-events-auto rounded-2xl border px-6 py-4 font-black backdrop-blur-md hover:brightness-110 active:scale-95 sm:min-w-60"
        }
        style={
          isV2
            ? undefined
            : {
                backgroundColor: wallet.color + "26", // 15% opacity glass fill
                borderColor: wallet.color + "40", // 25% opacity border
                boxShadow: `0 8px 32px 0 ${wallet.color}33`, // soft tinted float
                color: wallet.color, // text follows the wallet colour
              }
        }
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
        <span
          className={`hidden sm:inline tracking-wide ${isV2 ? "font-semibold" : "font-black"}`}
        >
          {label}
        </span>
        <span
          className={`inline sm:hidden tracking-wide ${isV2 ? "font-semibold" : "font-black"}`}
        >
          {mobileLabel}
        </span>
      </Button>
    </div>
  );
};
