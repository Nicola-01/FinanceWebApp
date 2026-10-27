import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faTags } from "@fortawesome/free-solid-svg-icons";
import type { Subscription } from "../../types/domain";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { SyncStateIcon } from "../../components/ui/SyncStateIcon.tsx";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import {
  formatCompactFrequency,
  getDaysLeft,
  getDaysLeftColor,
  getDaysLeftText,
} from "../../utils/subscriptionHelper";

interface SubscriptionCardProps {
  subscription: Subscription;
  date: string;
  onClick?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  date,
  onClick,
}) => {
  const isIncome = subscription.type === "INCOME";

  const frequencyText = formatCompactFrequency(
    subscription.frequencyInterval,
    subscription.frequencyType,
  );
  const daysLeft = getDaysLeft(date);

  let cardBorder = "border border-transparent hover:border-app-border";
  let statusBadge = null;
  let cardMargin = "";

  if (subscription.status === "PAUSED") {
    cardBorder = "border border-app-yellow/40";
    cardMargin = "";
    statusBadge = (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-lg bg-app-yellow/15 text-app-yellow text-[10px] font-bold uppercase tracking-wider border-b border-x border-app-yellow/40 backdrop-blur-sm">
        Paused
      </div>
    );
  } else if (subscription.status === "COMPLETED") {
    cardBorder = "border border-app-green/40";
    cardMargin = "";
    statusBadge = (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-lg bg-app-green/15 text-app-green text-[10px] font-bold uppercase tracking-wider border-b border-x border-app-green/40 backdrop-blur-sm">
        Completed
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-between p-4 bg-app-input cursor-pointer transition-all hover:bg-app-surface rounded-2xl ${cardBorder} ${cardMargin}`}
    >
      {statusBadge}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink max-w-[65%] lg:max-w-[75%]">
        <div
          className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
          style={{ color: subscription.tag?.colorHex || "#ffffff" }}
        >
          <FontAwesomeIcon
            icon={ICONS[subscription.tag?.icon as IconKey] || faTags}
          />
        </div>

        <div className="flex flex-col items-start gap-1.5 min-w-0 py-0.5">
          {subscription.name != subscription.tag.name && (
            <span className="text-base font-bold text-app-text truncate">
              {subscription.name}
            </span>
          )}

          <div className="flex items-center gap-1.5 overflow-hidden shrink-0 flex-wrap">
            <SyncStateIcon state={subscription.syncState} />
            {subscription.tag && (
              <TagBadge tag={subscription.tag} showParent={false} />
            )}
          </div>
        </div>
      </div>

      {/* Center spacer (room for notes in the future) */}
      <div className="flex-1 min-w-0" />

      {/* 2. Right side: amount, recurrence and days left */}
      <div className="flex flex-col items-end justify-center shrink-0 pl-3 min-w-25">
        {/* Row 1: amount + currency + frequency (e.g. -12.99 € / mo) */}
        <div
          className={`text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${isIncome ? "text-app-green" : "text-app-red"}`}
        >
          {subscription.amountPending ? (
            <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
              Reminder
            </span>
          ) : (
            <>
              <span>
                {isIncome ? "+" : "-"}
                {subscription.amount.toFixed(2)}
              </span>
              <span>
                {
                  CURRENCY_META[subscription.originalCurrency as CurrencyCode]
                    ?.symbol
                }
              </span>
            </>
          )}

          <span className="text-xs text-app-muted font-sans font-medium ml-0.5">
            / {frequencyText}
          </span>
        </div>

        {/* Row 2: days left (only for ACTIVE subscriptions with a date) */}
        {subscription.status === "ACTIVE" && daysLeft !== null && (
          <span
            className={`text-xs font-medium mt-0.5 transition-colors duration-500 ${getDaysLeftColor(daysLeft, isIncome)}`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
            {getDaysLeftText(daysLeft, date)}
          </span>
        )}
      </div>
    </div>
  );
};
