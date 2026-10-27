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

  const load = useCallback(
    () =>
      getWalletBank(wallet.id)
        .then((r) => {
          setEnabled(r.enabled);
          setConnections(r.connections);
        })
        // Bank data is optional: on failure the section just stays hidden.
        .catch(() => setEnabled(false)),
    [wallet.id],
  );

  useEffect(() => {
    load();
  }, [load]);

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
      await syncConnection(c.id);
      await load();
      fetchData();
    }, "Sync failed");

  const renew = (c: BankConnection) =>
    run(async () => {
      const { url } = await renewConnection(c.id);
      window.location.assign(url);
    }, "Could not renew consent");

  const unlink = (c: BankConnection) => {
    if (
      !window.confirm(`Unlink ${c.aspspName}? Imported transactions are kept.`)
    )
      return;
    return run(async () => {
      await deleteConnection(c.id);
      await load();
    }, "Could not unlink bank");
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
                  <Button size="sm" variant="danger" onClick={() => unlink(c)}>
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
