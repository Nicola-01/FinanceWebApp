import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faStickyNote,
  faTag,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction, Wallet } from "../../types/domain.ts";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies";
import { ExchangeRateSection } from "../common/exchangeRate/ExchangeRateSection.tsx";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { DetailRow } from "../common/DetailRow";
import Button from "../../components/ui/Button.tsx";
import { FormRow } from "../../components/ui/FormRow";
import { useUiVersion } from "../../hooks/useUiVersion";

interface TransactionViewProps {
  tx: Transaction;
  wallet: Wallet;
  /** Opens the subscription that generated this transaction (owned by the parent). */
  onOpenSubscription?: (subscriptionId: string) => void;
  /** Replaces the tag badge, e.g. a picker to file a "To categorise" import in place. */
  categorySlot?: React.ReactNode;
}

export const TransactionView: React.FC<TransactionViewProps> = ({
  tx,
  wallet,
  onOpenSubscription,
  categorySlot,
}) => {
  const isIncome = tx.type === "INCOME";
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch

  const handleOpenSubscription = () => {
    if (tx.subscriptionId) onOpenSubscription?.(tx.subscriptionId);
  };

  const displayExchangeRate = tx.exchangeValue
    ? Number(tx.exchangeValue)
        .toFixed(6)
        .replace(/\.?0+$/, "")
    : "1";

  const date = new Date(tx.transactionDate);
  const shortDate = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formatedDate = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isV2) {
    // ui-v2-switch: hero amount, grouped cards like the New Transaction form.
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          {tx.amountPending ? (
            <p className="text-2xl text-app-muted">Amount pending</p>
          ) : (
            <p
              className={`text-5xl font-semibold tracking-[-0.02em] tabular-nums ${isIncome ? "text-app-income" : "text-app-text"}`}
            >
              {isIncome ? "+" : "-"}
              {tx.amount.toFixed(2)}{" "}
              <span className="text-2xl text-app-muted">
                {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}
              </span>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categorySlot ?? <TagBadge tag={tx.tag} forceShowParent={true} />}
            {tx.subscriptionId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenSubscription}
              >
                <FontAwesomeIcon icon={faRepeat} />
                Recurring
              </Button>
            )}
          </div>
        </div>

        <div className="divide-y divide-app-border rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
          <FormRow icon={faTag} label="Name">
            <span className="min-w-0 truncate text-right text-[15px] text-app-text">
              {tx.name}
            </span>
          </FormRow>
          <FormRow icon={faCalendarAlt} label="Date">
            <span className="min-w-0 truncate text-right text-[15px] text-app-text">
              {shortDate}
            </span>
          </FormRow>
        </div>

        {tx.notes && (
          <div>
            <h3 className="mb-2 px-1 text-[13px] text-app-muted">Notes</h3>
            <div className="rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
              <p className="whitespace-pre-wrap p-4 text-[15px] text-app-text">
                {tx.notes}
              </p>
            </div>
          </div>
        )}

        {tx.originalCurrency && tx.originalCurrency !== wallet.currency && (
          <ExchangeRateSection
            mode="view"
            accentColor={wallet.color}
            baseCurrency={wallet.currency as CurrencyCode}
            selectedCurrency={tx.originalCurrency as CurrencyCode}
            originalAmount={tx.originalAmount || 0}
            exchangeRate={displayExchangeRate}
            convertedAmount={tx.amount}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
      {/* 1. Amount */}
      <div className="text-center mt-2">
        {tx.amountPending ? (
          <p className="text-4xl font-app-mono text-app-muted">
            Amount pending
          </p>
        ) : (
          <p
            className={`text-6xl font-app-mono ${isIncome ? "text-app-green" : "text-app-red"}`}
          >
            {isIncome ? "+" : "-"}
            {tx.amount.toFixed(2)}{" "}
            <span className="text-3xl">
              {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}
            </span>
          </p>
        )}
      </div>

      {/* Category: kept OUTSIDE the divide-y list so it stands out, centered. */}
      <div className="flex w-full items-center justify-center gap-2 -mt-2">
        {categorySlot ?? <TagBadge tag={tx.tag} forceShowParent={true} />}
        {tx.subscriptionId && (
          <span
            onClick={handleOpenSubscription}
            className="cursor-pointer text-[10px] sm:text-xs bg-[rgb(var(--bg-card-dark))] px-2 sm:px-3 py-1 rounded-full text-app-muted hover:text-app-text hover:bg-app-hover border border-app-border inline-flex items-center gap-1.5 transition-colors font-bold uppercase tracking-wider"
          >
            <FontAwesomeIcon icon={faRepeat} />
            Recurring
          </span>
        )}
      </div>

      {/* 2. Details: divide-y separates the rows; category lives above. */}
      <div className="w-full bg-app-input border border-app-border rounded-2xl text-left flex flex-col divide-y divide-app-border">
        {/* Name */}
        <DetailRow icon={faTag} label="Name">
          <span className="text-app-text font-medium sm:text-right truncate">
            {tx.name}
          </span>
        </DetailRow>

        {/* Date */}
        <DetailRow icon={faCalendarAlt} label="Date">
          <span className="text-app-text font-medium">{formatedDate}</span>
        </DetailRow>

        {/* Notes (only when present) */}
        {tx.notes && (
          <div className="flex flex-col gap-3 p-5">
            <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center">
              <FontAwesomeIcon
                icon={faStickyNote}
                className="w-5 text-center mr-2"
              />
              Notes
            </span>
            <span className="text-app-text text-sm bg-app-input p-3 rounded-lg border border-app-border">
              {tx.notes}
            </span>
          </div>
        )}

        {/* Exchange-rate row */}
        {tx.originalCurrency && tx.originalCurrency !== wallet.currency && (
          <div className="p-4 sm:p-5">
            <ExchangeRateSection
              mode="view"
              accentColor={wallet.color}
              baseCurrency={wallet.currency as CurrencyCode}
              selectedCurrency={tx.originalCurrency as CurrencyCode}
              originalAmount={tx.originalAmount || 0}
              exchangeRate={displayExchangeRate}
              convertedAmount={tx.amount}
            />
          </div>
        )}
      </div>
    </div>
  );
};
