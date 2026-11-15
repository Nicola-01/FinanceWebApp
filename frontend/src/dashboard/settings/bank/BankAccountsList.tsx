import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faEllipsis,
  faLinkSlash,
  faPlus,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../../wallet/WalletContext.tsx";
import type { BankConnection } from "../../../api/bankApi";
import Button from "../../../components/ui/Button.tsx";
import { Menu } from "../../../components/ui/Menu.tsx";
import { ResponsiveOverlay } from "../../../components/ui/ResponsiveOverlay.tsx";
import { StatusPill, type Status } from "../../../components/ui/StatusPill.tsx";
import { ConfirmModal } from "../../../modals/common/ConfirmModal.tsx";
import { ConnectBankForm } from "../ConnectBankForm.tsx";
import { useBankConnectionActions } from "./useBankConnectionActions.ts";
import { latestSync, relativeTime } from "./bankFormat.ts";

const STATUS: Record<
  BankConnection["status"],
  { status: Status; label: string }
> = {
  ACTIVE: { status: "ok", label: "Active" },
  PENDING: { status: "warn", label: "Pending" },
  PAUSED: { status: "warn", label: "Paused" },
  EXPIRED: { status: "danger", label: "Expired" },
  ERROR: { status: "danger", label: "Error" },
};

/** Linked bank accounts with a per-account ⋯ menu (sync, renew, unlink). */
export function BankAccountsList({
  connections,
  reload,
  onChildOpenChange,
}: {
  connections: BankConnection[];
  reload: () => Promise<void>;
  /** Reports whether a nested dialog (link form, unlink confirm) is open. */
  onChildOpenChange?: (open: boolean) => void;
}) {
  const { wallet } = useWalletContext();
  const isOwner = wallet.userRole === "OWNER";
  const canSync = isOwner || wallet.userRole === "EDITOR";
  const { sync, renew, unlink } = useBankConnectionActions(reload);
  const [linking, setLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<BankConnection | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const childOpen = linking || unlinkTarget !== null;
  useEffect(() => {
    onChildOpenChange?.(childOpen);
  }, [childOpen, onChildOpenChange]);

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    await unlink(unlinkTarget);
    setUnlinking(false);
    setUnlinkTarget(null);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-app-text">
          Accounts
        </h3>
        <span className="flex-1" />
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={() => setLinking(true)}>
            <FontAwesomeIcon icon={faPlus} />
            Link account
          </Button>
        )}
      </div>
      {connections.length === 0 ? (
        <p className="text-sm text-app-muted">No bank accounts linked yet.</p>
      ) : (
        <ul className="divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] bg-app-raised">
          {connections.map((c) => {
            const pill = STATUS[c.status];
            const consent = c.validUntil
              ? new Date(c.validUntil).toLocaleDateString("en-GB")
              : null;
            const digits = c.accounts
              .map((a) =>
                a.maskedIban ? `••${a.maskedIban.slice(-4)}` : a.displayName,
              )
              .join(", ");
            return (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-app-text">
                    {c.aspspName}
                  </div>
                  <div className="truncate text-[12.5px] tabular-nums text-app-muted">
                    {digits} · synced {relativeTime(latestSync([c]))}
                    {consent && (
                      <span className="max-sm:hidden">
                        {" "}
                        · consent until {consent}
                      </span>
                    )}
                  </div>
                  {c.lastError && (
                    <p className="mt-0.5 text-xs text-app-danger">
                      {c.lastError}
                    </p>
                  )}
                </div>
                <StatusPill status={pill.status}>{pill.label}</StatusPill>
                {(canSync || isOwner) && (
                  <Menu align="right" width={208}>
                    <Menu.Trigger>
                      {({ open, toggle }) => (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${c.aspspName}`}
                          aria-haspopup="menu"
                          aria-expanded={open}
                          onClick={toggle}
                        >
                          <FontAwesomeIcon icon={faEllipsis} />
                        </Button>
                      )}
                    </Menu.Trigger>
                    <Menu.Content>
                      {canSync && (
                        <Menu.Item icon={faRotate} onClick={() => sync(c)}>
                          Sync now
                        </Menu.Item>
                      )}
                      {isOwner && (
                        <Menu.Item
                          icon={faArrowsRotate}
                          onClick={() => renew(c)}
                        >
                          Renew consent
                        </Menu.Item>
                      )}
                      {isOwner && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            icon={faLinkSlash}
                            tone="danger"
                            onClick={() => setUnlinkTarget(c)}
                          >
                            Unlink…
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Content>
                  </Menu>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ResponsiveOverlay
        open={linking}
        onClose={() => setLinking(false)}
        title="Link a bank"
        accentColor={wallet.color}
      >
        <ConnectBankForm walletId={wallet.id} />
      </ResponsiveOverlay>
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
    </section>
  );
}
