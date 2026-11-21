import React from "react";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import type { WalletPermState } from "../../types/domain";
import { WalletPermissionSelector } from "../../components/pat/WalletPermissionSelector";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { FormRow } from "../../components/ui/FormRow";
import { useUiVersion } from "../../hooks/useUiVersion";

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
  /** Hide the token-name field entirely (host supplies the name, e.g. OAuth consent auto-names it). */
  hideName?: boolean;
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
  hideName = false,
}) => {
  const [ui] = useUiVersion(); // ui-v2-switch
  const isV2 = ui === "v2";
  const submitDisabled =
    isSubmitting ||
    !tokenName.trim() ||
    walletPerms.filter((w) => w.enabled).length === 0;

  const loadingSpinner = (
    <div className="flex items-center justify-center py-6">
      <div
        className={`h-5 w-5 animate-spin rounded-full border-2 border-app-border ${isV2 ? "border-t-wallet" : "border-t-app-purple"}`} // ui-v2-switch
      />
    </div>
  );

  return (
    <div className={isV2 ? "flex flex-col gap-6" : "space-y-5"}>
      {/* Token name */}
      {!hideName &&
        (isV2 ? ( // ui-v2-switch
          <div className="divide-y divide-app-border overflow-visible rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
            <FormRow
              icon={faTag}
              label="Name"
              controlClassName="[&>div]:w-full [&>div]:bg-transparent [&>div]:shadow-none"
            >
              <Input
                id="pat-token-name"
                type="text"
                aria-label="Name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., CI/CD Bot, Budget Tracker"
                maxLength={50}
                disabled={isEdit}
                className={`bg-transparent text-right shadow-none px-0 !font-sans ${isEdit ? "cursor-not-allowed opacity-60" : ""}`}
              />
            </FormRow>
          </div>
        ) : (
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
        ))}

      {/* Wallet permissions */}
      <div>
        {isV2 ? ( // ui-v2-switch
          <h3 className="mb-2 px-1 text-[13px] text-app-muted">
            Wallet access
          </h3>
        ) : (
          <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
            Wallet Permissions
          </label>
        )}

        {walletPerms.length === 0 ? (
          loadingSpinner
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
