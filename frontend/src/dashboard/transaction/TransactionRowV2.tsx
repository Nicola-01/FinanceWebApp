import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeftRight, faRepeat } from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../types/domain.ts";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { SyncStateIcon } from "../../components/ui/SyncStateIcon.tsx";
import { ToCategoriseActions } from "./ToCategoriseActions.tsx";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import { formatAmount } from "../../utils/format.ts";

interface TransactionRowV2Props {
  transaction: Transaction;
  onClick: (tx: Transaction) => void;
  // Same signature as TransactionRow so the table can switch in one place; v2 draws no dividers.
  isFirst: boolean;
  isLast: boolean;
  /** Investment flow: violet amount with an Invested / Cashed out badge, no green/red. */
  isInvestment?: boolean;
}

export const TransactionRowV2: React.FC<TransactionRowV2Props> = ({
  transaction: tx,
  onClick,
  isInvestment = false,
}) => {
  const isIncome = tx.type === "INCOME";
  // Older bank imports may carry the counterparty again as the note.
  const notes =
    tx.notes && tx.notes.trim().toLowerCase() !== tx.name.trim().toLowerCase()
      ? tx.notes
      : null;
  const title = tx.name.trim() ? tx.name : tx.tag.name;
  const category = tx.needsReview ? "To categorise" : tx.tag.name;
  // The title already falls back to the category, so repeating it in the sub line adds nothing.
  const showCategory = tx.needsReview || title !== tx.tag.name;
  const showSub = tx.subscriptionId || tx.syncState || showCategory || notes;
  const symbol = CURRENCY_META[tx.originalCurrency as CurrencyCode]?.symbol;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keys typed in the to-categorise picker bubble up here; only the row itself activates.
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(tx);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(tx)}
      onKeyDown={onKeyDown}
      className={`grid cursor-pointer ${tx.needsReview ? "grid-cols-[40px_minmax(0,1fr)_auto] sm:grid-cols-[40px_minmax(0,1fr)_auto_auto]" : "grid-cols-[40px_minmax(0,1fr)_auto]"} items-center gap-x-3 gap-y-1.5 rounded-[var(--r-input)] px-3 py-2.5 hover:bg-app-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-text ${tx.needsReview ? "shadow-[inset_3px_0_0_var(--color-app-warn)]" : ""}`}
    >
      {tx.needsReview ? (
        <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-app-raised text-app-muted">
          <FontAwesomeIcon icon={faLeftRight} />
        </span>
      ) : (
        <CategoryIcon icon={tx.tag.icon} color={tx.tag.colorHex} />
      )}

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-app-text">{title}</span>
          {isInvestment && (
            <span className="shrink-0 rounded-full bg-app-invest/15 px-2 py-px text-[11px] font-semibold text-app-invest">
              {isIncome ? "Cashed out" : "Invested"}
            </span>
          )}
        </div>
        {showSub && (
          <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-app-muted">
            {tx.subscriptionId && (
              <span
                role="img"
                aria-label="Recurring payment"
                title="Recurring payment"
                className="inline-flex shrink-0"
              >
                <FontAwesomeIcon icon={faRepeat} />
              </span>
            )}
            <SyncStateIcon state={tx.syncState} />
            {showCategory && <span className="truncate">{category}</span>}
            {notes && (
              <span className="truncate">
                {showCategory ? "· " : ""}
                {notes}
              </span>
            )}
          </div>
        )}
      </div>

      {tx.needsReview && (
        // Inline before the amount from sm up; on phones its own row, indented under the text.
        <div className="order-last col-span-full pl-[52px] sm:order-none sm:col-span-1 sm:pl-0">
          <ToCategoriseActions transaction={tx} />
        </div>
      )}

      <div
        className={`whitespace-nowrap text-right font-semibold tabular-nums ${isInvestment ? "text-app-invest" : isIncome ? "text-app-income" : "text-app-text"}`}
      >
        {formatAmount(isIncome ? tx.amount : -tx.amount, { signed: true })}
        {symbol && ` ${symbol}`}
      </div>
    </div>
  );
};

export default TransactionRowV2;
