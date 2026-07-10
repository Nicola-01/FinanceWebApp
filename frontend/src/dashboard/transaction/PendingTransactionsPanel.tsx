import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faTags } from "@fortawesome/free-solid-svg-icons";
import type { Transaction, Wallet } from "../../utils/types.ts";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import api from "../../api/axiosConfig.ts";
import Button from "../../components/ui/Button.tsx";
import {
  NumberInput,
  type AmountType,
} from "../../components/ui/NumberInput.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

interface PendingRowProps {
  wallet: Wallet;
  transaction: Transaction;
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

const PendingTransactionRow: React.FC<PendingRowProps> = ({
  wallet,
  transaction,
  onFilled,
  onOpenDetails,
}) => {
  const [value, setValue] = useState("");
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

  return (
    <div
      onClick={() => onOpenDetails(transaction)}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:brightness-110"
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
          <span className="text-xs font-medium text-app-muted">
            {formattedDate}
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit ? (
          <>
            <div className="w-52">
              <NumberInput
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
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

/**
 * Pinned "awaiting amount" rows shown above the transaction list. Immune to
 * filters/search/pagination by design — these are reminders, they must stay visible.
 */
export const PendingTransactionsPanel: React.FC<
  PendingTransactionsPanelProps
> = ({ wallet, pendingTransactions, onFilled, onOpenDetails }) => {
  if (pendingTransactions.length === 0) return null;

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
      {pendingTransactions.map((tx) => (
        <PendingTransactionRow
          key={tx.id}
          wallet={wallet}
          transaction={tx}
          onFilled={onFilled}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
};
