import React from "react";
import type { WalletPermState } from "../../utils/types";
import { WalletPermissionSelector } from "../../components/pat/WalletPermissionSelector";

interface PatFormViewProps {
  isEdit: boolean;
  tokenName: string;
  setTokenName: (val: string) => void;
  walletPerms: WalletPermState[];
  setPermission: (walletId: string, level: "none" | "read" | "write") => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitText?: string;
  submittingText?: string;
  showDesktopButton?: boolean;
}

export const PatFormView: React.FC<PatFormViewProps> = ({
  isEdit,
  tokenName,
  setTokenName,
  walletPerms,
  setPermission,
  onSubmit,
  isSubmitting,
  submitText,
  submittingText,
  showDesktopButton = false,
}) => {
  return (
    <div className="space-y-5">
      {/* Token name */}
      <div>
        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
          Token Name
        </label>
        <input
          id="pat-token-name"
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="e.g., CI/CD Bot, Budget Tracker"
          maxLength={50}
          disabled={isEdit}
          className={`h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>

      {/* Wallet permissions */}
      <div>
        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
          Wallet Permissions
        </label>

        {walletPerms.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
          </div>
        ) : (
          <WalletPermissionSelector
            walletPerms={walletPerms}
            setPermission={setPermission}
          />
        )}
      </div>

      {/* Create button (mobile fallback, desktop uses the header action) */}
      <button
        id="pat-create-btn"
        onClick={onSubmit}
        disabled={
          isSubmitting ||
          !tokenName.trim() ||
          walletPerms.filter((w) => w.enabled).length === 0
        }
        className={`w-full rounded-xl bg-[#a78bfa] py-3 text-sm font-bold theme-text-default transition-all hover:bg-[#8b5cf6] disabled:opacity-40 disabled:cursor-not-allowed ${showDesktopButton ? "" : "sm:hidden"}`}
      >
        {isSubmitting
          ? submittingText || (isEdit ? "Saving..." : "Generating...")
          : submitText || (isEdit ? "Save Changes" : "Generate Token")}
      </button>
    </div>
  );
};
