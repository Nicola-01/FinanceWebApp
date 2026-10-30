import React from "react";
import type { Transaction } from "../../types/domain.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import {
  faTags,
  faCommentAlt,
  faRepeat,
  faLeftRight,
} from "@fortawesome/free-solid-svg-icons";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { SyncStateIcon } from "../../components/ui/SyncStateIcon.tsx";
import { ToCategoriseActions } from "./ToCategoriseActions.tsx";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";

interface TransactionRowProps {
  transaction: Transaction;
  onClick: (tx: Transaction) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onClick,
  isFirst,
  isLast,
}) => {
  const isIncome = transaction.type === "INCOME";
  // Older bank imports may carry the counterparty again as the note.
  const notes =
    transaction.notes &&
    transaction.notes.trim().toLowerCase() !==
      transaction.name.trim().toLowerCase()
      ? transaction.notes
      : null;
  const radius = `${isFirst ? "rounded-t-2xl" : ""} ${isLast ? "rounded-b-2xl" : ""}`;

  return (
    <div
      onClick={() => onClick(transaction)}
      className={`
                flex items-center justify-between p-4 bg-app-input cursor-pointer transition-all hover:bg-app-surface
                ${
                  transaction.needsReview
                    ? // On phones the actions wrap onto their own full-width line.
                      // A full dashed outline drawn over the neighbour's divider (-mt-px), so the
                      // "to categorise" row reads as one card even inside a joined group.
                      // No z-index: it would trap the tag dropdown under the next row.
                      `relative flex-wrap border border-dashed border-app-muted/70 ${isFirst ? "" : "-mt-px"} ${radius}`
                    : `
                ${isFirst && isLast ? "rounded-2xl border border-app-border" : ""}
                ${isFirst && !isLast ? "rounded-t-2xl border-t border-l border-r border-app-border" : ""}
                ${!isFirst && isLast ? "rounded-b-2xl border-b border-l border-r border-app-border" : ""}
                ${!isFirst && !isLast ? "border-l border-r border-app-border" : ""}
                ${!isLast ? "border-b border-app-border/40" : ""}`
                }
            `}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink max-w-[65%] lg:max-w-[75%]">
        <div
          className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
          style={{ color: transaction.tag.colorHex }}
        >
          <FontAwesomeIcon
            icon={
              transaction.needsReview
                ? faLeftRight
                : ICONS[transaction.tag.icon as IconKey] || faTags
            }
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center items-start gap-1.5 md:gap-3 min-w-0 py-0.5">
          {transaction.name !== transaction.tag.name && (
            <span className="text-base font-bold text-app-text truncate">
              {transaction.name}
            </span>
          )}
          <div className="flex items-center gap-1.5 overflow-hidden shrink-0">
            {transaction.subscriptionId && (
              <FontAwesomeIcon
                icon={faRepeat}
                className="text-[10px] sm:text-[11px] text-app-muted opacity-80 shrink-0"
                title="Recurring Payment"
              />
            )}
            <SyncStateIcon state={transaction.syncState} />
            {/* The placeholder isn't a real tag: no badge, the picker stands in for it. */}
            {!transaction.needsReview && <TagBadge tag={transaction.tag} />}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-start flex-1 min-w-0 pl-3 md:pl-4">
        {notes && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-app-muted truncate">
            <FontAwesomeIcon
              icon={faCommentAlt}
              className="text-[11px] text-app-muted/50 shrink-0 mt-0.5"
            />
            <span className="truncate">{notes}</span>
          </div>
        )}
      </div>

      {transaction.needsReview && (
        <div className="order-last mt-3 basis-full sm:order-none sm:mt-0 sm:basis-auto sm:pl-3">
          <ToCategoriseActions transaction={transaction} />
        </div>
      )}

      <div
        className={`shrink-0 pl-3 text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${isIncome ? "text-app-green" : "text-app-red"}`}
      >
        <span>
          {isIncome ? "+" : "-"}
          {transaction.amount.toFixed(2)}
        </span>
        <span>
          {CURRENCY_META[transaction.originalCurrency as CurrencyCode]?.symbol}
        </span>
      </div>
    </div>
  );
};

export default TransactionRow;
