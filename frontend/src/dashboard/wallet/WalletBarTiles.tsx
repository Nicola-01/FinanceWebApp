import React from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/** Loading placeholder shaped like a wallet card. */
export const WalletSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-app-border bg-app-input animate-pulse shrink-0 w-[260px] xl:w-full">
    <div className="h-12 w-12 rounded-full bg-app-surface shrink-0"></div>
    <div className="flex flex-1 flex-col min-w-0 gap-2">
      <div className="h-4 w-3/4 rounded bg-app-surface"></div>
      <div className="h-5 w-10 rounded-md bg-app-surface mt-0.5"></div>
    </div>
  </div>
);

/** Dashed "Add New Wallet" tile — reused for the mobile row and the desktop footer. */
export const AddWalletTile: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-app-border bg-app-input/60 transition-all hover:bg-app-input hover:border-[var(--brand-1)]/50 shrink-0 text-left ${className}`}
  >
    <div className="flex justify-center items-center w-12 h-12 rounded-full bg-app-surface text-xl text-app-muted group-hover:text-[var(--brand-1)] transition-colors shrink-0">
      <FontAwesomeIcon icon={faPlus} />
    </div>
    <div className="flex flex-col min-w-0">
      <h4 className="m-0 text-sm font-bold text-app-muted group-hover:text-app-text transition-colors truncate">
        Add New Wallet
      </h4>
    </div>
  </button>
);
