import React from "react";
import type { WalletPermState } from "../../utils/types";
import { WalletPermissionSelector } from "../../components/pat/WalletPermissionSelector";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";

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
  /** Hide the built-in submit button entirely (host renders its own, e.g. a modal footer). */
  hideSubmit?: boolean;
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
  hideSubmit = false,
}) => {
  const submitDisabled =
    isSubmitting ||
    !tokenName.trim() ||
    walletPerms.filter((w) => w.enabled).length === 0;

  return (
    <div className="space-y-5">
      {/* Token name */}
      <div>
        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
          Token Name
        </label>
        <Input
          id="pat-token-name"
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="e.g., CI/CD Bot, Budget Tracker"
          maxLength={50}
          disabled={isEdit}
          className={isEdit ? "cursor-not-allowed opacity-60" : ""}
        />
      </div>

      {/* Wallet permissions */}
      <div>
        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
          Wallet Permissions
        </label>

        {walletPerms.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-border border-t-app-purple" />
          </div>
        ) : (
          <WalletPermissionSelector
            walletPerms={walletPerms}
            setPermission={setPermission}
          />
        )}
      </div>

      {/* Built-in submit (mobile fallback by default; the modal hides it and uses its footer). */}
      {!hideSubmit && (
        <Button
          id="pat-create-btn"
          type="button"
          variant="primary"
          fullWidth
          ripple
          onClick={onSubmit}
          disabled={submitDisabled}
          className={showDesktopButton ? "" : "sm:hidden"}
        >
          {isSubmitting
            ? submittingText || (isEdit ? "Saving..." : "Generating...")
            : submitText || (isEdit ? "Save Changes" : "Generate Token")}
        </Button>
      )}
    </div>
  );
};
