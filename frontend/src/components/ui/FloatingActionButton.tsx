import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import Button from "./Button.tsx";
import type { Wallet } from "../../utils/types.ts";

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
  return (
    <div className="sticky bottom-8 mt-auto mx-auto w-max z-100 pointer-events-none">
      <Button
        type="button"
        onClick={onClick}
        variant="ghost"
        ripple
        rippleColor={`${wallet.color}55`}
        className="pointer-events-auto rounded-2xl border px-6 py-4 font-black backdrop-blur-md hover:brightness-110 active:scale-95 sm:min-w-60"
        style={{
          backgroundColor: wallet.color + "26", // 15% opacity glass fill
          borderColor: wallet.color + "40", // 25% opacity border
          boxShadow: `0 8px 32px 0 ${wallet.color}33`, // soft tinted float
          color: wallet.color, // text follows the wallet colour
        }}
      >
        <FontAwesomeIcon icon={faPlus} className="text-xl" />
        <span className="hidden sm:inline tracking-wide font-black">
          {label}
        </span>
        <span className="inline sm:hidden tracking-wide font-black">
          {mobileLabel}
        </span>
      </Button>
    </div>
  );
};
