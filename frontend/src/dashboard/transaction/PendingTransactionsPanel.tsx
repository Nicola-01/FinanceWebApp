import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faTags } from "@fortawesome/free-solid-svg-icons";
import type { Transaction, Wallet } from "../../types/domain.ts";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import api from "../../api/axiosConfig.ts";
import Button from "../../components/ui/Button.tsx";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import {
  NumberInput,
  type AmountType,
} from "../../components/ui/NumberInput.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

interface PendingRowProps {
  wallet: Wallet;
  transaction: Transaction;
  focused: boolean;
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

const PendingTransactionRow: React.FC<PendingRowProps> = ({
  wallet,
  transaction,
  focused,
  onFilled,
  onOpenDetails,
}) => {
  const [ui] = useUiVersion();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);
  // Seed the direction from the reminder's inherited type; the user can flip it.
  const [type, setType] = useState<AmountType>(transaction.type);
  const [saving, setSaving] = useState(false);
  const canEdit = wallet.userRole !== "VIEWER";
  const currency = (transaction.originalCurrency ??
    wallet.currency) as CurrencyCode;
  const symbol = CURRENCY_META[currency]?.symbol || currency;

  const submit = async () => {
    if (!value || Number.isNaN(Number(value)) || Number(value) === 0)
      return triggerToast("Please enter a valid amount.", false);
    setSaving(true);
    try {
      await api.put(`/transactions/${wallet.id}/${transaction.id}/amount`, {
        originalAmount: Math.abs(Number(value)),
        type: type || undefined,
      });
      triggerToast("Amount saved!", true);
      onFilled();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error saving amount"), false);
      setSaving(false);
    }
  };

  const formattedDate = new Date(
    transaction.transactionDate,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ui-v2-switch: needs-attention row (surface box + warn bar), amount + Save wrap below sm.
  // Warn bar + hairline share one shadow list: --box-ring is transparent in dark (not none).
  if (ui === "v2")
    return (
      <div
        onClick={() => onOpenDetails(transaction)}
        className="mb-3.5 grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--r-card)] bg-app-card p-3 shadow-[inset_3px_0_0_var(--color-app-warn),var(--box-ring)] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
      >
        <CategoryIcon
          icon={transaction.tag.icon}
          color={transaction.tag.colorHex}
        />
        <div className="min-w-0">
          <div className="truncate font-semibold text-app-text">
            {transaction.name}
          </div>
          <div className="text-[13px] text-app-muted">
            Due {formattedDate}, waiting for the amount
          </div>
        </div>
        <div
          className="col-span-2 flex items-center gap-2 sm:col-span-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit ? (
            <>
              <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
                <NumberInput
                  ref={inputRef}
                  placeholder={`0.00 ${symbol}`}
                  value={value}
                  onChange={setValue}
                  onEnter={submit}
                  type={type}
                  onTypeChange={setType}
                  aria-label={`Amount for ${transaction.name}`}
                  className="text-right"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                ripple
                disabled={saving}
                onClick={submit}
                aria-label="Confirm amount"
              >
                {saving ? "…" : "Save"}
              </Button>
            </>
          ) : (
            <span className="text-sm text-app-muted">—</span>
          )}
        </div>
      </div>
    );

  return (
    <div
      onClick={() => onOpenDetails(transaction)}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:brightness-110"
      style={{
        backgroundColor: `${wallet.color}0d`,
        border: `1px solid ${wallet.color}40`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
          style={{ color: transaction.tag.colorHex }}
        >
          <FontAwesomeIcon
            icon={ICONS[transaction.tag.icon as IconKey] || faTags}
          />
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-base font-bold text-app-text truncate">
            {transaction.name}
          </span>
          <span className="text-xs font-medium text-app-muted whitespace-nowrap">
            {formattedDate}
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0 w-full sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit ? (
          <>
            <div className="flex-1 min-w-0 sm:w-52 sm:flex-none">
              <NumberInput
                ref={inputRef}
                placeholder={`0.00 ${symbol}`}
                value={value}
                onChange={setValue}
                onEnter={submit}
                type={type}
                onTypeChange={setType}
                aria-label={`Amount for ${transaction.name}`}
              />
            </div>
            <Button
              type="button"
              accentColor={wallet.color}
              ripple
              disabled={saving}
              onClick={submit}
              aria-label="Confirm amount"
            >
              {saving ? "…" : "Save"}
            </Button>
          </>
        ) : (
          <span className="text-sm font-bold font-app-mono text-app-muted">
            —
          </span>
        )}
      </div>
    </div>
  );
};

interface PendingTransactionsPanelProps {
  wallet: Wallet;
  pendingTransactions: Transaction[];
  /** Id of the row whose amount input should take focus (notification deep link). */
  focusId?: string | null;
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

/**
 * Pinned "awaiting amount" rows shown above the transaction list. Immune to
 * filters/search/pagination by design — these are reminders, they must stay visible.
 */
export const PendingTransactionsPanel: React.FC<
  PendingTransactionsPanelProps
> = ({ wallet, pendingTransactions, focusId, onFilled, onOpenDetails }) => {
  const [ui] = useUiVersion();
  if (pendingTransactions.length === 0) return null;

  const rows = pendingTransactions.map((tx) => (
    <PendingTransactionRow
      key={tx.id}
      wallet={wallet}
      transaction={tx}
      focused={String(tx.id) === focusId}
      onFilled={onFilled}
      onOpenDetails={onOpenDetails}
    />
  ));

  // ui-v2-switch: each v2 row says "waiting for the amount" itself, so the
  // "Awaiting amount" header is dropped.
  if (ui === "v2") return <div className="mb-6">{rows}</div>;

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="mb-1 flex items-center gap-2">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-xs"
          style={{ color: wallet.color }}
        />
        <h4 className="text-xs font-black uppercase tracking-widest text-app-muted">
          Awaiting amount
        </h4>
      </div>
      {rows}
    </div>
  );
};
