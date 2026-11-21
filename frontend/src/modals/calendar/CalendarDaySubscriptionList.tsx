import React from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import type { Subscription, Transaction } from "../../types/domain";
import { SubscriptionCard } from "../../dashboard/subscription/SubscriptionCard";
import { SubscriptionRowV2 } from "../../dashboard/subscription/SubscriptionRowV2";
import { applyTransactionToSubscription } from "../../utils/subscriptionHelper";
import { useUiVersion } from "../../hooks/useUiVersion";

interface CalendarDaySubscriptionListProps {
  subscriptions: Subscription[];
  selectedDate: Date;
  /** Closes the panel before handing off to a click handler. */
  onClose: () => void;
  onEditSubscription?: (subscription: Subscription, date: Date) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

/**
 * The day's subscriptions; a run that already happened shows (and opens) its
 * actual transaction instead of the template.
 */
export const CalendarDaySubscriptionList: React.FC<
  CalendarDaySubscriptionListProps
> = ({
  subscriptions,
  selectedDate,
  onClose,
  onEditSubscription,
  onTransactionClick,
}) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const handleOpen = (sub: Subscription, pastTx?: Transaction) => {
    onClose();
    if (pastTx && onTransactionClick) {
      onTransactionClick(pastTx);
    } else {
      onEditSubscription?.(sub, selectedDate);
    }
  };

  const findPastTx = (sub: Subscription) =>
    sub.history?.find((tx) => tx.transactionDate === dateKey);

  return (
    <div className="flex flex-col gap-2 p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[50vh]">
      {subscriptions.length === 0 ? (
        isV2 ? ( // ui-v2-switch
          <p className="py-6 text-center text-[13px] text-app-muted">
            No subscriptions on this day
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-app-input mb-4 text-app-muted">
              <FontAwesomeIcon icon={faRepeat} className="text-xl" />
            </div>
            <p className="text-sm text-app-muted">
              No subscriptions on this day
            </p>
          </div>
        )
      ) : isV2 ? ( // ui-v2-switch
        <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
          {subscriptions.map((sub) => {
            const pastTx = findPastTx(sub);
            return (
              <SubscriptionRowV2
                key={sub.id}
                subscription={
                  pastTx ? applyTransactionToSubscription(sub, pastTx) : sub
                }
                date={dateKey}
                // A paid run is not overdue, so drop the due label for it.
                showDue={!pastTx}
                onClick={() => handleOpen(sub, pastTx)}
              />
            );
          })}
        </div>
      ) : (
        subscriptions.map((sub) => {
          const pastTx = findPastTx(sub);
          return (
            <SubscriptionCard
              key={sub.id}
              subscription={
                pastTx ? applyTransactionToSubscription(sub, pastTx) : sub
              }
              date={dateKey}
              onClick={() => handleOpen(sub, pastTx)}
            />
          );
        })
      )}
    </div>
  );
};
