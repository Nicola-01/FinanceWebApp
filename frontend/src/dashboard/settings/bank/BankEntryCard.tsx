import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../../wallet/WalletContext.tsx";
import { useWalletBank, useBankRules } from "./useWalletBank.ts";
import { latestSync, relativeTime } from "./bankFormat.ts";
import { BankOverlay } from "./BankOverlay.tsx";

/**
 * Settings entry for bank imports (UI v2): one line of status, opens the Bank overlay.
 * Renders nothing when Open Banking is off for the wallet or the load fails.
 */
export function BankEntryCard() {
  const { wallet, toCategorise } = useWalletContext();
  const { enabled, connections, loadFailed, reload } = useWalletBank(wallet.id);
  const { rules, reload: reloadRules } = useBankRules(wallet.id, enabled);
  const [open, setOpen] = useState(false);

  if (loadFailed || enabled !== true || rules === null) return null;

  const accounts = connections.reduce((n, c) => n + c.accounts.length, 0);
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3.5 rounded-[var(--r-card)] bg-app-card p-4 text-left shadow-[var(--box-ring)] transition-colors hover:bg-app-raised sm:p-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-wallet/15 text-wallet">
          <FontAwesomeIcon icon={faBuildingColumns} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
            Bank
          </span>
          <span className="block truncate text-[13px] tabular-nums text-app-muted">
            {plural(accounts, "account")}
            {accounts > 0 &&
              ` · synced ${relativeTime(latestSync(connections))}`}
            {` · ${plural(rules.length, "rule")}`}
            {toCategorise.length > 0 && (
              <>
                {" · "}
                <span className="text-app-warn">
                  {toCategorise.length} to categorise
                </span>
              </>
            )}
          </span>
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-app-faint" />
      </button>
      <BankOverlay
        open={open}
        onClose={() => setOpen(false)}
        connections={connections}
        reloadAccounts={reload}
        rules={rules}
        reloadRules={reloadRules}
      />
    </>
  );
}
