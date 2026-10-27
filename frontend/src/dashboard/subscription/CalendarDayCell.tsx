import React from "react";
import { format, isSameDay } from "date-fns";
import type { Subscription, Transaction } from "../../types/domain";
import { applyTransactionToSubscription } from "../../utils/subscriptionHelper";
import { TagBadge } from "../../components/ui/TagBadge.tsx";

const MAX_VISIBLE = 3;

interface CalendarDayCellProps {
  calendarDay: Date;
  daySubscriptions: Subscription[];
  isCurrentMonth: boolean;
  color: string;
  onDayClick: (day: Date) => void;
  onEditSubscription?: (subscription: Subscription, date: Date) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

/** One calendar day: number + up to 3 subscription badges, then "+N". */
export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  calendarDay,
  daySubscriptions,
  isCurrentMonth,
  color,
  onDayClick,
  onEditSubscription,
  onTransactionClick,
}) => {
  const isToday = isSameDay(calendarDay, new Date());

  const visibleSubs = daySubscriptions.slice(0, MAX_VISIBLE);
  const overflowCount = daySubscriptions.length - MAX_VISIBLE;

  return (
    <div
      onClick={() => onDayClick(calendarDay)}
      className={`flex flex-col p-1 sm:p-2 rounded-lg sm:rounded-xl border cursor-pointer transition-all min-w-0 overflow-hidden ${
        isCurrentMonth
          ? "bg-app-input/50 border-app-border hover:bg-app-input/80 hover:border-app-border"
          : "bg-app-transparent border-transparent opacity-40"
      }`}
      style={isToday ? { boxShadow: `0 0 0 1px ${color}` } : {}}
    >
      <span
        className={`text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 shrink-0 ${isToday ? "" : "text-app-muted"}`}
        style={isToday ? { color } : {}}
      >
        {format(calendarDay, "d")}
      </span>

      {/* Subscription badges — max 3, then +N */}
      <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 overflow-hidden">
        {visibleSubs.map((sub) => {
          const pastTx = sub.history?.find(
            (tx) => tx.transactionDate === format(calendarDay, "yyyy-MM-dd"),
          );
          const displaySub = pastTx
            ? applyTransactionToSubscription(sub, pastTx)
            : sub;
          return (
            <TagBadge
              tag={displaySub.tag}
              key={sub.id}
              showParent={false}
              compact={true}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (pastTx && onTransactionClick) {
                  onTransactionClick(pastTx);
                } else if (onEditSubscription) {
                  onEditSubscription(sub, calendarDay);
                }
              }}
            />
          );
        })}
        {overflowCount > 0 && (
          <span
            className="text-[10px] sm:text-auto font-bold text-app-muted pl-0.5 shrink-0 ml-auto mr-1"
            style={{ color }}
          >
            +{overflowCount}
          </span>
        )}
      </div>
    </div>
  );
};
