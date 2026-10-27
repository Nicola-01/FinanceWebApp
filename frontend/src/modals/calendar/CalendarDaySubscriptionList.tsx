import React from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import type { Subscription, Transaction } from "../../types/domain";
import { SubscriptionCard } from "../../dashboard/subscription/SubscriptionCard";
import { applyTransactionToSubscription } from "../../utils/subscriptionHelper";

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
}) => (
  <div className="flex flex-col gap-2 p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[50vh]">
    {subscriptions.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-app-input mb-4 text-app-muted">
          <FontAwesomeIcon icon={faRepeat} className="text-xl" />
        </div>
        <p className="text-sm text-app-muted">No subscriptions on this day</p>
      </div>
    ) : (
      subscriptions.map((sub) => {
        const pastTx = sub.history?.find(
          (tx) => tx.transactionDate === format(selectedDate, "yyyy-MM-dd"),
        );
        return (
          <SubscriptionCard
            key={sub.id}
            subscription={
              pastTx ? applyTransactionToSubscription(sub, pastTx) : sub
            }
            date={format(selectedDate, "yyyy-MM-dd")}
            onClick={() => {
              onClose();
              if (pastTx && onTransactionClick) {
                onTransactionClick(pastTx);
              } else {
                onEditSubscription?.(sub, selectedDate);
              }
            }}
          />
        );
      })
    )}
  </div>
);
