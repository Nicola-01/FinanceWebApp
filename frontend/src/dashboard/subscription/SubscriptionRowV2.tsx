import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { Subscription } from "../../types/domain";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { formatAmount } from "../../utils/format.ts";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import { getDaysLeft } from "../../utils/subscriptionHelper";
import {
  dueToneClass,
  formatDueRelative,
  formatEvery,
} from "./subscriptionSummary";

interface SubscriptionRowV2Props {
  subscription: Subscription;
  date: string;
  /** Past payments and completed rows have no upcoming due label. */
  showDue?: boolean;
  className?: string;
  onClick?: () => void;
}

/** v2 list row: category icon, name + "category · every month", amount and due label. */
export const SubscriptionRowV2: React.FC<SubscriptionRowV2Props> = ({
  subscription: sub,
  date,
  showDue = true,
  className = "",
  onClick,
}) => {
  const isIncome = sub.type === "INCOME";
  const symbol = CURRENCY_META[sub.originalCurrency as CurrencyCode]?.symbol;

  let due: React.ReactNode = null;
  if (showDue && sub.status === "PAUSED") {
    due = <span className="text-app-muted">Paused</span>;
  } else if (showDue && sub.bankDriven) {
    due = <span className="text-app-muted">Bank-driven</span>;
  } else if (showDue && sub.status === "ACTIVE") {
    const days = getDaysLeft(date);
    if (days !== null) {
      due = (
        <span className={dueToneClass(days)}>
          {days < 0 && (
            <FontAwesomeIcon icon={faCircleExclamation} className="mr-1" />
          )}
          {formatDueRelative(days)}
        </span>
      );
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-app-raised ${className}`}
    >
      <CategoryIcon icon={sub.tag.icon} color={sub.tag.colorHex} />

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-app-text">{sub.name}</div>
        <div className="truncate text-[13px] text-app-muted">
          {sub.tag.name} · {formatEvery(sub)}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className={`font-semibold tabular-nums ${isIncome ? "text-app-income" : "text-app-text"}`}
        >
          {sub.amountPending ? (
            <span className="text-app-muted">Reminder</span>
          ) : (
            <>
              {formatAmount(isIncome ? sub.amount : -sub.amount, {
                signed: true,
              })}{" "}
              {symbol}
            </>
          )}
        </div>
        {due && <div className="text-[13px] tabular-nums">{due}</div>}
      </div>
    </button>
  );
};
