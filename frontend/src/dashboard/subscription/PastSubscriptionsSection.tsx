import React from "react";
import type { Transaction } from "../../types/domain";
import { SubscriptionCard } from "./SubscriptionCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { applyTransactionToSubscription } from "../../utils/subscriptionHelper";
import { formatMonthLabel, type PastPayment } from "./subscriptionGroups";

interface PastSubscriptionsSectionProps {
  groupedPastSubs: Record<string, PastPayment[]>;
  sortedMonthKeys: string[];
  visibleMonthsCount: number;
  onLoadMore: () => void;
  isExpanded: (monthKey: string) => boolean;
  onToggleMonth: (monthKey: string) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

/** "Paid" month groups: top-3 cards, expandable rest, "Load more" months. */
export const PastSubscriptionsSection: React.FC<
  PastSubscriptionsSectionProps
> = ({
  groupedPastSubs,
  sortedMonthKeys,
  visibleMonthsCount,
  onLoadMore,
  isExpanded,
  onToggleMonth,
  onTransactionClick,
}) => (
  <>
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
                    subscription={applyTransactionToSubscription(sub, tx)}
                    date={tx.transactionDate}
                    onClick={() => onTransactionClick && onTransactionClick(tx)}
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
                        subscription={applyTransactionToSubscription(sub, tx)}
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
                onClick={() => onToggleMonth(monthKey)}
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
          onClick={onLoadMore}
          className="px-6 py-2 rounded-full bg-app-surface border border-app-border text-sm font-bold text-app-text hover:bg-app-hover transition-colors flex items-center gap-2"
        >
          Load more past months <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>
    )}
  </>
);
