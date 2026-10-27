import React, { useState } from "react";
import type { Subscription, Transaction } from "../../types/domain";
import { SubscriptionCard } from "./SubscriptionCard";
import { Badge } from "../../components/ui/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { groupSubscriptions, monthKeyOf } from "./subscriptionGroups";
import { PastSubscriptionsSection } from "./PastSubscriptionsSection";

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEditSubscription?: (subscription: Subscription) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

/**
 * Unified section header: title lives OUTSIDE any card (like the other tabs),
 * white text with a subtle per-wallet accent bar + a hairline that echoes the
 * Transactions date separators. Keeps the layout airy over the ambient spheres.
 */
const SectionHeader: React.FC<{ title: string; color?: string }> = ({
  title,
  color,
}) => (
  <div className="flex items-center gap-3">
    <span
      aria-hidden
      className="h-5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color || "var(--color-app-green)" }}
    />
    <h3 className="text-lg font-bold text-app-text whitespace-nowrap">
      {title}
    </h3>
    <div className="h-px flex-1 bg-app-border rounded-full" />
  </div>
);

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onEditSubscription,
  onTransactionClick,
}) => {
  const { wallet } = useWalletContext();
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    {},
  );
  const [visibleMonthsCount, setVisibleMonthsCount] = useState<number>(4);

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.3s_ease-out]">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-input mb-4 text-app-muted">
          <FontAwesomeIcon icon={faRepeat} className="text-2xl" />
        </div>
        <h3 className="text-lg font-bold text-app-text mb-1">
          No subscriptions found
        </h3>
        <p className="text-sm text-app-muted max-w-sm">
          You don't have any recurring transactions yet. Click "New
          Subscription" to add your first one.
        </p>
      </div>
    );
  }

  const {
    within7Days,
    within31Days,
    completedSubs,
    groupedPastSubs,
    sortedMonthKeys,
    hasPast,
  } = groupSubscriptions(subscriptions);
  const currentMonthKey = monthKeyOf(new Date());

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !isExpanded(monthKey),
    }));
  };

  const isExpanded = (monthKey: string) => {
    if (expandedMonths[monthKey] !== undefined) return expandedMonths[monthKey];
    return monthKey === currentMonthKey;
  };

  const hasUpcoming = within7Days.length > 0 || within31Days.length > 0;

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-10 pb-10">
      {/* SECTION 1 — TO PAY */}
      {hasUpcoming && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="To Pay" color={wallet.color} />

          {within7Days.length > 0 && (
            <div className="flex flex-col gap-3">
              <div>
                <Badge tone="yellow" uppercase>
                  Within 7 Days
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {within7Days.map((sub) => (
                  <SubscriptionCard
                    key={`future-${sub.id}`}
                    subscription={sub}
                    date={sub.nextExecutionDate}
                    onClick={() =>
                      onEditSubscription && onEditSubscription(sub)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {within31Days.length > 0 && (
            <div className="flex flex-col gap-3">
              <div>
                <Badge tone="neutral" uppercase>
                  Within 31 Days
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {within31Days.map((sub) => (
                  <SubscriptionCard
                    key={`future-${sub.id}`}
                    subscription={sub}
                    date={sub.nextExecutionDate}
                    onClick={() =>
                      onEditSubscription && onEditSubscription(sub)
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2 — PAID */}
      {hasPast && (
        <section className="flex flex-col gap-6">
          <SectionHeader title="Paid" color={wallet.color} />
          <PastSubscriptionsSection
            groupedPastSubs={groupedPastSubs}
            sortedMonthKeys={sortedMonthKeys}
            visibleMonthsCount={visibleMonthsCount}
            onLoadMore={() => setVisibleMonthsCount((prev) => prev + 12)}
            isExpanded={isExpanded}
            onToggleMonth={toggleMonth}
            onTransactionClick={onTransactionClick}
          />
        </section>
      )}

      {/* SECTION 3 — COMPLETED */}
      {completedSubs.length > 0 && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="Completed" color={wallet.color} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedSubs.map((sub) => (
              <div
                key={`completed-${sub.id}`}
                className="opacity-70 hover:opacity-100 transition-opacity"
              >
                <SubscriptionCard
                  subscription={sub}
                  date={sub.nextExecutionDate}
                  onClick={() => onEditSubscription && onEditSubscription(sub)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
