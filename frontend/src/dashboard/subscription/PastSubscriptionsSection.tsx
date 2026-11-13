import React from "react";
import type { Transaction } from "../../types/domain";
import { SubscriptionCard } from "./SubscriptionCard";
import { SubscriptionRowV2 } from "./SubscriptionRowV2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { applyTransactionToSubscription } from "../../utils/subscriptionHelper";
import { formatMonthLabel, type PastPayment } from "./subscriptionGroups";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../../components/ui/Button.tsx";

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
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch: rows in one surface box, no card grid

  const listClass = v2
    ? "divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

  const renderPayment = ({ sub, tx }: PastPayment) =>
    v2 ? (
      <SubscriptionRowV2
        key={`past-${tx.id}`}
        subscription={applyTransactionToSubscription(sub, tx)}
        date={tx.transactionDate}
        showDue={false}
        className="opacity-70 transition-opacity hover:opacity-100"
        onClick={() => onTransactionClick && onTransactionClick(tx)}
      />
    ) : (
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
    );

  return (
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
              <h4
                className={
                  v2
                    ? "px-1 text-[13px] text-app-muted capitalize"
                    : "text-sm font-bold text-app-muted capitalize ml-1"
                }
              >
                {formatMonthLabel(monthKey)}
              </h4>

              <div className={listClass}>
                {subs.slice(0, 3).map(renderPayment)}
              </div>

              <AnimatePresence initial={false}>
                {expanded && hiddenCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${listClass} overflow-hidden`}
                  >
                    {subs.slice(3).map(renderPayment)}
                  </motion.div>
                )}
              </AnimatePresence>

              {hiddenCount > 0 &&
                (v2 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    onClick={() => onToggleMonth(monthKey)}
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
                  </Button>
                ) : (
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
                ))}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {sortedMonthKeys.length > visibleMonthsCount &&
        (v2 ? (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={onLoadMore}>
              Load more past months <FontAwesomeIcon icon={faChevronDown} />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center mt-4">
            <button
              onClick={onLoadMore}
              className="px-6 py-2 rounded-full bg-app-surface border border-app-border text-sm font-bold text-app-text hover:bg-app-hover transition-colors flex items-center gap-2"
            >
              Load more past months <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        ))}
    </>
  );
};
