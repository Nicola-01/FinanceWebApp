import React, { useState, useMemo, useRef, useCallback } from "react";
import { format, isSameMonth } from "date-fns";
import type { Subscription, Transaction } from "../../types/domain";
import { buildYearsMap } from "../../utils/subscriptionHelper";
import CustomDatePicker from "../../components/datePicker/CustomDatePicker.tsx";
import {
  CalendarDayDetailPanel,
  type DayDetailModalHandle,
} from "../../modals/calendar/CalendarDayDetailPanel.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { buildCalendarGrid } from "./buildCalendarGrid";
import { CalendarDayCell } from "./CalendarDayCell";

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

  // year → day "yyyy-MM-dd" → subscriptions, memoized over the 3 visible years.
  // Pure derivation (no state / setState-in-effect); covered by buildYearsMap tests.
  const yearsMap = useMemo(
    () =>
      buildYearsMap(subscriptions, [
        currentYear - 1,
        currentYear,
        currentYear + 1,
      ]),
    [subscriptions, currentYear],
  );

  // Calendar grid generation
  const weekStartsOn = 1; // Monday
  const { monthStart, monthEnd, calendarDays, weekDays } = buildCalendarGrid(
    currentDate,
    weekStartsOn,
  );

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
      {/* Calendar header */}
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

      {/* Weekday header (Mon, Tue, Wed...) */}
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

      {/* Day grid */}
      <div className="grid grid-cols-7 grid-rows-6 gap-px sm:gap-1 md:gap-2 flex-1">
        {calendarDays.map((calendarDay, index) => {
          const dayStr = format(calendarDay, "yyyy-MM-dd");
          const calendarDayYear = calendarDay.getFullYear();
          const yearData = yearsMap[calendarDayYear];
          const daySubscriptions = yearData ? yearData[dayStr] || [] : [];

          return (
            <CalendarDayCell
              key={index}
              calendarDay={calendarDay}
              daySubscriptions={daySubscriptions}
              isCurrentMonth={isSameMonth(calendarDay, monthStart)}
              color={wallet.color}
              onDayClick={handleDayClick}
              onEditSubscription={onEditSubscription}
              onTransactionClick={onTransactionClick}
            />
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
