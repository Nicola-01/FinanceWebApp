import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";
import type { Subscription, Transaction } from "../../utils/types";
import { buildYearsMap } from "../../utils/subscriptionHelper";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import CustomDatePicker from "../../components/DataPicker/CustomDatePicker.tsx";
import {
  CalendarDayDetailPanel,
  type DayDetailModalHandle,
} from "../../modals/Calendar/CalendarDayDetailModal.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

interface SubscriptionCalendarProps {
  subscriptions: Subscription[];
  onEditSubscription?: (subscription: Subscription, date: Date) => void;
  onAddSubscription?: (date: Date) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

export const SubscriptionCalendar: React.FC<SubscriptionCalendarProps> = ({
  subscriptions,
  onEditSubscription,
  onAddSubscription,
  onTransactionClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dayDetailRef = useRef<DayDetailModalHandle>(null);

  const currentYear = currentDate.getFullYear();

  const { wallet } = useWalletContext();

  // Mappa anno → giorno "yyyy-MM-dd" → sottoscrizioni, memoizzata sui 3 anni
  // visibili. Sostituisce la vecchia cache stateful in useEffect: nessuno stato
  // né setState-in-effect, e la logica è coperta da test unitari (buildYearsMap).
  const yearsMap = useMemo(
    () =>
      buildYearsMap(subscriptions, [
        currentYear - 1,
        currentYear,
        currentYear + 1,
      ]),
    [subscriptions, currentYear],
  );

  // Generazione della griglia del calendario
  const weekStartsOn = 1; // Lunedì come default variabile
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const calendarDays = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }
  // Always render exactly 6 rows (42 cells) for consistent calendar height
  while (calendarDays.length < 42) {
    calendarDays.push(addDays(calendarDays[calendarDays.length - 1], 1));
  }

  const baseDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDays = [
    ...baseDays.slice(weekStartsOn),
    ...baseDays.slice(0, weekStartsOn),
  ];

  // Helper to resolve subscriptions for any date (used by CalendarDayDetailPanel for navigation)
  const getSubscriptionsForDate = useCallback(
    (date: Date): Subscription[] => {
      const dayStr = format(date, "yyyy-MM-dd");
      const yearData = yearsMap[date.getFullYear()];
      return yearData ? yearData[dayStr] || [] : [];
    },
    [yearsMap],
  );

  const handleDayClick = (clickedDay: Date) => {
    const subs = getSubscriptionsForDate(clickedDay);
    dayDetailRef.current?.openModal(clickedDay, subs);
  };

  return (
    <div className="flex flex-col h-full bg-[rgb(var(--bg-card-dark))] border border-app-border rounded-[2rem] p-4 sm:p-6 md:p-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header Calendario */}
      <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-6 w-full">
        <div className="w-full sm:max-w-xs m-auto">
          <CustomDatePicker
            isRange={true}
            hideSidebar={true}
            disableDaySelection={true}
            initialPreset="month"
            initialStartDate={monthStart}
            initialEndDate={monthEnd}
            onChange={(val) => {
              if (val && "start" in val && val.start) {
                setCurrentDate(val.start);
              }
            }}
            weekStartsOn={weekStartsOn}
            color={wallet.color || "var(--color-app-sky)"}
          />
        </div>
      </div>

      {/* Intestazione Giorni (Lun, Mar, Mer...) */}
      <div className="grid grid-cols-7 mb-1 sm:mb-2">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] sm:text-xs font-bold text-app-muted uppercase tracking-wider py-1 sm:py-2"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Griglia dei Giorni */}
      <div className="grid grid-cols-7 grid-rows-6 gap-px sm:gap-1 md:gap-2 flex-1">
        {calendarDays.map((calendarDay, index) => {
          const dayStr = format(calendarDay, "yyyy-MM-dd");
          const calendarDayYear = calendarDay.getFullYear();
          const yearData = yearsMap[calendarDayYear];
          const daySubscriptions = yearData ? yearData[dayStr] || [] : [];

          const isCurrentMonth = isSameMonth(calendarDay, monthStart);
          const isToday = isSameDay(calendarDay, new Date());

          const MAX_VISIBLE = 3;
          const visibleSubs = daySubscriptions.slice(0, MAX_VISIBLE);
          const overflowCount = daySubscriptions.length - MAX_VISIBLE;

          return (
            <div
              key={index}
              onClick={() => handleDayClick(calendarDay)}
              className={`flex flex-col p-1 sm:p-2 rounded-lg sm:rounded-xl border cursor-pointer transition-all min-w-0 overflow-hidden ${
                isCurrentMonth
                  ? "bg-app-input/50 border-app-border hover:bg-app-input/80 hover:border-app-border"
                  : "bg-app-transparent border-transparent opacity-40"
              }`}
              style={isToday ? { boxShadow: `0 0 0 1px ${wallet.color}` } : {}}
            >
              <span
                className={`text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 shrink-0 ${isToday ? "" : "text-app-muted"}`}
                style={isToday ? { color: wallet.color } : {}}
              >
                {format(calendarDay, "d")}
              </span>

              {/* Subscription badges — max 3, then +N */}
              <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 overflow-hidden">
                {visibleSubs.map((sub) => {
                  const pastTx = sub.history?.find(
                    (tx) =>
                      tx.transactionDate === format(calendarDay, "yyyy-MM-dd"),
                  );
                  const displaySub = pastTx
                    ? {
                        ...sub,
                        amount: pastTx.amount,
                        originalAmount:
                          pastTx.originalAmount ?? sub.originalAmount,
                        originalCurrency:
                          pastTx.originalCurrency ?? sub.originalCurrency,
                        exchangeValue:
                          pastTx.exchangeValue ?? sub.exchangeValue,
                      }
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
                    style={{ color: wallet.color }}
                  >
                    +{overflowCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <CalendarDayDetailPanel
        ref={dayDetailRef}
        getSubscriptionsForDate={getSubscriptionsForDate}
        onEditSubscription={onEditSubscription}
        onAddSubscription={onAddSubscription}
        onTransactionClick={onTransactionClick}
      />
    </div>
  );
};
