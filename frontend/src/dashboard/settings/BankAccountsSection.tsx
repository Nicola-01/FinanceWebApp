import React, { useCallback, useEffect, useState } from "react";
import { faBuildingColumns } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import {
  getWalletBank,
  syncConnection,
  renewConnection,
  deleteConnection,
  type BankConnection,
} from "../../api/bankApi";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { Badge, type BadgeTone } from "../../components/ui/Badge.tsx";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError.ts";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";
import { ConnectBankForm } from "./ConnectBankForm.tsx";

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

const relativeTime = (iso?: string) => {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
};

/** Bank connections for the active wallet; renders nothing unless the server says it is enabled. */
export const BankAccountsSection: React.FC = () => {
  const { wallet, fetchData } = useWalletContext();
  const [enabled, setEnabled] = useState(false);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [linking, setLinking] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<BankConnection | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const load = useCallback(
    () =>
      getWalletBank(wallet.id)
        .then((r) => {
          setLoadFailed(false);
          setEnabled(r.enabled);
          setConnections(r.connections);
        })
        .catch(() => setLoadFailed(true)),
    [wallet.id],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loadFailed)
    return (
      <p className="mb-6 text-sm text-app-muted">
        Could not load bank accounts.
      </p>
    );
  if (!enabled) return null;

  const isOwner = wallet.userRole === "OWNER";
  const canSync = isOwner || wallet.userRole === "EDITOR";

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      await action();
    } catch (e) {
      triggerToast(getApiErrorTitle(e, fallback), false);
    }
  };

  const sync = (c: BankConnection) =>
    run(async () => {
      const r = await syncConnection(c.id);
      if (r.status !== "ACTIVE")
        triggerToast(`Sync stopped: connection is ${r.status}`, false);
      else if (r.imported > 0)
        triggerToast(
          `Imported ${r.imported} transaction${r.imported === 1 ? "" : "s"}`,
          true,
        );
      else triggerToast("Nothing new", true);
      await load();
      fetchData();
    }, "Sync failed");

  const renew = (c: BankConnection) =>
    run(async () => {
      const { url } = await renewConnection(c.id);
      window.location.assign(url);
    }, "Could not renew consent");

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    await run(async () => {
      await deleteConnection(unlinkTarget.id);
      await load();
    }, "Could not unlink bank");
    setUnlinking(false);
    setUnlinkTarget(null);
  };

  return (
    <Card
      title="Bank accounts"
      subtitle="Import transactions automatically from your bank"
      icon={faBuildingColumns}
      iconColor={wallet.color}
      className="mb-6"
    >
      <div className="flex flex-col gap-3">
        {connections.map((c) => {
          const expiring = isExpiring(c);
          return (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-app-text">{c.aspspName}</span>
                <Badge tone={STATUS_TONE[c.status]} uppercase>
                  {c.status}
                </Badge>
              </div>
              {c.lastError && (
                <p className="text-sm text-app-red">{c.lastError}</p>
              )}
              {c.accounts.map((a) => (
                <div key={a.id} className="text-sm text-app-muted">
                  <span className="text-app-text">{a.displayName}</span>{" "}
                  <span className="font-app-mono">{a.maskedIban}</span>
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
              Link bank
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
    </Card>
  );
};
