import React, { useState } from "react";
import type { Subscription, Transaction } from "../../utils/types";
import { SubscriptionCard } from "./SubscriptionCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRepeat,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { motion, AnimatePresence } from "framer-motion";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysLeft = (dateStr: string) => {
    const nextDate = new Date(dateStr);
    nextDate.setHours(0, 0, 0, 0);
    return Math.ceil(
      (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  // --- UPCOMING SUBSCRIPTIONS ---
  const activeSubs = subscriptions.filter((s) => s.status !== "COMPLETED");
  const within7Days = activeSubs.filter(
    (s) => getDaysLeft(s.nextExecutionDate) <= 7,
  );
  const within31Days = activeSubs.filter(
    (s) => getDaysLeft(s.nextExecutionDate) > 7,
  );
  const completedSubs = subscriptions.filter((s) => s.status === "COMPLETED");

  within7Days.sort(
    (a, b) =>
      new Date(a.nextExecutionDate).getTime() -
      new Date(b.nextExecutionDate).getTime(),
  );
  within31Days.sort(
    (a, b) =>
      new Date(a.nextExecutionDate).getTime() -
      new Date(b.nextExecutionDate).getTime(),
  );

  // --- PAST SUBSCRIPTIONS ---
  const pastTransactions: { sub: Subscription; tx: Transaction }[] = [];
  subscriptions.forEach((sub) => {
    if (sub.history) {
      sub.history.forEach((tx) => {
        pastTransactions.push({ sub, tx });
      });
    }
  });

  const groupedPastSubs: Record<
    string,
    { sub: Subscription; tx: Transaction }[]
  > = {};
  pastTransactions.forEach(({ sub, tx }) => {
    const d = new Date(tx.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groupedPastSubs[monthKey]) groupedPastSubs[monthKey] = [];
    groupedPastSubs[monthKey].push({ sub, tx });
  });

  const sortedMonthKeys = Object.keys(groupedPastSubs).sort((a, b) =>
    b.localeCompare(a),
  );
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

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

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const hasUpcoming = within7Days.length > 0 || within31Days.length > 0;
  const hasPast = pastTransactions.length > 0;

  return (
    <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-10 pb-10">
      {/* SECTION 1 — TO PAY */}
      {hasUpcoming && (
        <section className="flex flex-col gap-5">
          <SectionHeader title="To Pay" color={wallet.color} />

          {within7Days.length > 0 && (
            <div className="flex flex-col gap-3">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-app-yellow/15 text-app-yellow text-[10px] font-bold uppercase tracking-widest border border-app-yellow/40">
                  Within 7 Days
                </span>
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
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-app-surface text-app-muted text-[10px] font-bold uppercase tracking-widest border border-app-border">
                  Within 31 Days
                </span>
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

          <AnimatePresence initial={false}>
            {sortedMonthKeys.slice(0, visibleMonthsCount).map((monthKey) => {
              const subs = groupedPastSubs[monthKey].sort(
                (a, b) => b.tx.amount - a.tx.amount,
              );
              const expanded = isExpanded(monthKey);
              const hiddenCount = subs.length - 3;

              return (
                <motion.div
                  key={monthKey}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  <h4 className="text-sm font-bold text-app-muted capitalize ml-1">
                    {formatMonthLabel(monthKey)}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subs.slice(0, 3).map(({ sub, tx }) => (
                      <div
                        key={`past-${tx.id}`}
                        className="opacity-60 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300"
                      >
                        <SubscriptionCard
                          subscription={{
                            ...sub,
                            amount: tx.amount,
                            originalAmount:
                              tx.originalAmount ?? sub.originalAmount,
                            originalCurrency:
                              tx.originalCurrency ?? sub.originalCurrency,
                            exchangeValue:
                              tx.exchangeValue ?? sub.exchangeValue,
                          }}
                          date={tx.transactionDate}
                          onClick={() =>
                            onTransactionClick && onTransactionClick(tx)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded && hiddenCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-hidden"
                      >
                        {subs.slice(3).map(({ sub, tx }) => (
                          <div
                            key={`past-${tx.id}`}
                            className="opacity-60 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300"
                          >
                            <SubscriptionCard
                              subscription={{
                                ...sub,
                                amount: tx.amount,
                                originalAmount:
                                  tx.originalAmount ?? sub.originalAmount,
                                originalCurrency:
                                  tx.originalCurrency ?? sub.originalCurrency,
                                exchangeValue:
                                  tx.exchangeValue ?? sub.exchangeValue,
                              }}
                              date={tx.transactionDate}
                              onClick={() =>
                                onTransactionClick && onTransactionClick(tx)
                              }
                            />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {hiddenCount > 0 && (
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="self-center md:self-start mt-2 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-xs font-bold text-app-muted hover:text-app-text hover:bg-app-hover transition-colors flex items-center gap-2"
                    >
                      {expanded ? (
                        <>
                          Show less <FontAwesomeIcon icon={faChevronUp} />
                        </>
                      ) : (
                        <>
                          Show {hiddenCount} more{" "}
                          <FontAwesomeIcon icon={faChevronDown} />
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedMonthKeys.length > visibleMonthsCount && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibleMonthsCount((prev) => prev + 12)}
                className="px-6 py-2 rounded-full bg-app-surface border border-app-border text-sm font-bold text-app-text hover:bg-app-hover transition-colors flex items-center gap-2"
              >
                Load more past months <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>
          )}
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
