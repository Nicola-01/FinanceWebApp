import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { faTags, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../utils/types.ts";

/**
 * Faithful, **decoupled** replica of `dashboard/transaction/TransactionRow`
 * (+ `TagBadge`) for the landing page. The real components read the wallet
 * context (`useWalletContext`), which doesn't exist on the public `/about`
 * route — so this mirrors their markup without the dependency.
 */
interface MockTransactionRowProps {
  transaction: Transaction;
  isFirst: boolean;
  isLast: boolean;
}

const MockTransactionRow: React.FC<MockTransactionRowProps> = ({
  transaction,
  isFirst,
  isLast,
}) => {
  const isIncome = transaction.type === "INCOME";
  const { tag } = transaction;

  return (
    <div
      className={`
        flex items-center justify-between p-4 bg-app-input transition-all
        ${isFirst && isLast ? "rounded-2xl border border-app-border" : ""}
        ${isFirst && !isLast ? "rounded-t-2xl border-t border-l border-r border-app-border" : ""}
        ${!isFirst && isLast ? "rounded-b-2xl border-b border-l border-r border-app-border" : ""}
        ${!isFirst && !isLast ? "border-l border-r border-app-border" : ""}
        ${!isLast ? "border-b border-app-border/40" : ""}
      `}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink max-w-[70%]">
        <div
          className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
          style={{ color: tag.colorHex }}
        >
          <FontAwesomeIcon icon={ICONS[tag.icon as IconKey] || faTags} />
        </div>

        <div className="flex flex-col md:flex-row md:items-center items-start gap-1.5 md:gap-3 min-w-0 py-0.5">
          {transaction.name !== tag.name && (
            <span className="text-base font-bold text-app-text truncate">
              {transaction.name}
            </span>
          )}
          {/* Tag badge (inline replica of TagBadge) */}
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider w-max shrink-0"
              style={{
                backgroundColor: `${tag.colorHex}15`,
                color: tag.colorHex,
                border: `1px solid ${tag.colorHex}30`,
              }}
            >
              <FontAwesomeIcon
                icon={ICONS[tag.icon as IconKey] || faTags}
                className="text-[10px] opacity-70 shrink-0"
              />
              <span>{tag.name}</span>
            </span>
            {tag.parentName && (
              <span className="hidden sm:flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="text-[8px] text-app-muted/60 shrink-0"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  {tag.parentName}
                </span>
              </span>
            )}
          </span>
        </div>
      </div>

      <div
        className={`shrink-0 pl-3 text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${
          isIncome ? "text-app-green" : "text-app-red"
        }`}
      >
        <span>
          {isIncome ? "+" : "-"}
          {transaction.amount.toFixed(2)}
        </span>
        <span>€</span>
      </div>
    </div>
  );
};

export default MockTransactionRow;
