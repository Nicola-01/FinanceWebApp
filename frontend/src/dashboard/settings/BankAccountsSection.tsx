import React, { useState } from "react";
import { faBuildingColumns } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { type BankConnection } from "../../api/bankApi";
import { SettingsBox } from "./SettingsBox.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import Button from "../../components/ui/Button.tsx";
import { Badge, type BadgeTone } from "../../components/ui/Badge.tsx";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";
import { ConnectBankForm } from "./ConnectBankForm.tsx";
import { useWalletBank } from "./bank/useWalletBank.ts";
import { useBankConnectionActions } from "./bank/useBankConnectionActions.ts";
import { relativeTime } from "./bank/bankFormat.ts";

const DAY = 86_400_000;
const STATUS_TONE: Partial<Record<BankConnection["status"], BadgeTone>> = {
  ACTIVE: "green",
  PENDING: "yellow",
  EXPIRED: "red",
  PAUSED: "yellow",
  ERROR: "red",
};

const isExpiring = (c: BankConnection) =>
  c.status === "EXPIRED" ||
  (!!c.validUntil && new Date(c.validUntil).getTime() - Date.now() < 7 * DAY);

/** Bank connections for the active wallet; explains how to get access when not enabled. */
export const BankAccountsSection: React.FC = () => {
  const { wallet } = useWalletContext();
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const { enabled, connections, loadFailed, reload } = useWalletBank(wallet.id);
  const { sync, renew, unlink } = useBankConnectionActions(reload);
  const [linking, setLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<BankConnection | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const notice = (text: string) => (
    <SettingsBox
      title="Bank accounts"
      description="Import transactions automatically from your bank"
      icon={faBuildingColumns}
      iconColor={wallet.color}
    >
      <p className="text-sm text-app-muted">{text}</p>
    </SettingsBox>
  );

  if (loadFailed) return notice("Could not load bank accounts.");
  if (enabled === null) return null;
  if (!enabled)
    return notice(
      "Open Banking is not enabled for your account. Ask an admin to turn it on.",
    );

  const isOwner = wallet.userRole === "OWNER";
  const canSync = isOwner || wallet.userRole === "EDITOR";

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    await unlink(unlinkTarget);
    setUnlinking(false);
    setUnlinkTarget(null);
  };

  return (
    <SettingsBox
      title="Bank accounts"
      description="Import transactions automatically from your bank"
      icon={faBuildingColumns}
      iconColor={wallet.color}
    >
      <div className={isV2 ? "flex flex-col" : "flex flex-col gap-3"}>
        {connections.map((c) => {
          const expiring = isExpiring(c);
          return (
            <div
              key={c.id}
              className={
                isV2
                  ? "flex flex-col gap-2 border-t border-app-border py-3 first:border-t-0 first:pt-0"
                  : "flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-app-text">{c.aspspName}</span>
                {isV2 ? ( // ui-v2-switch
                  <Badge tone={STATUS_TONE[c.status]}>
                    {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                  </Badge>
                ) : (
                  <Badge tone={STATUS_TONE[c.status]} uppercase>
                    {c.status}
                  </Badge>
                )}
              </div>
              {c.lastError && (
                <p
                  className={`text-sm ${isV2 ? "text-app-danger" : "text-app-red"}`}
                >
                  {c.lastError}
                </p>
              )}
              {c.accounts.map((a) => (
                <div key={a.id} className="text-sm text-app-muted">
                  <span className="text-app-text">{a.displayName}</span>{" "}
                  <span className={isV2 ? "tabular-nums" : "font-app-mono"}>
                    {a.maskedIban}
                  </span>
                  {" · Last sync "}
                  {relativeTime(a.lastSyncedAt)}
                </div>
              ))}
              {c.validUntil && (
                <div className="text-sm text-app-muted">
                  Consent expires{" "}
                  {new Date(c.validUntil).toLocaleDateString("en-GB")}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {canSync && (
                  <Button size="sm" variant="secondary" onClick={() => sync(c)}>
                    Sync now
                  </Button>
                )}
                {isOwner && (
                  <Button
                    size="sm"
                    variant={expiring ? "primary" : "secondary"}
                    onClick={() => renew(c)}
                  >
                    Renew
                  </Button>
                )}
                {isOwner && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setUnlinkTarget(c)}
                  >
                    Unlink
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {isOwner && (
          <div>
            <Button variant="secondary" onClick={() => setLinking(true)}>
              {isV2 ? "Link a bank account" : "Link bank"}
            </Button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!unlinkTarget}
        title="Unlink bank"
        message={
          <>
            Unlink <strong>{unlinkTarget?.aspspName}</strong>? Imported
            transactions are kept. Linking it again later re-imports
            transactions from the chosen start date.
          </>
        }
        confirmLabel="Unlink"
        busy={unlinking}
        onConfirm={confirmUnlink}
        onCancel={() => setUnlinkTarget(null)}
      />
      <ResponsiveOverlay
        open={linking}
        onClose={() => setLinking(false)}
        title="Link a bank"
        accentColor={wallet.color}
      >
        <ConnectBankForm walletId={wallet.id} />
      </ResponsiveOverlay>
    </SettingsBox>
  );
};
