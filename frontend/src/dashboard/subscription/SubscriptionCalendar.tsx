import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    format, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays
} from 'date-fns';
import type { Subscription } from '../../utils/types';
import { generateSubscriptionOccurrences } from '../../utils/subscriptionHelper';
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import CustomDatePicker from '../../components/DataPicker/CustomDatePicker.tsx';
import { DayDetailPanel, type DayDetailModalHandle } from '../../modals/day/DayDetailModal.tsx';
import { useWalletContext } from '../wallet/WalletContext.tsx';

interface SubscriptionCalendarProps {
    subscriptions: Subscription[];
    onEditSubscription?: (subscription: Subscription, date: Date) => void;
    onAddSubscription?: (date: Date) => void;
}

export const SubscriptionCalendar: React.FC<SubscriptionCalendarProps> = ({ subscriptions, onEditSubscription, onAddSubscription }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const dayDetailRef = useRef<DayDetailModalHandle>(null);

    const currentYear = currentDate.getFullYear();
    const subsHash = subscriptions.map(s =>
        `${s.id}-${s.status}-${s.frequencyType}-${s.frequencyInterval}-${s.nextExecutionDate}-${s.startDate}-${s.duration}-${s.durationTimes}-${s.durationUntil}`
    ).join('|');

    const [cacheInfo, setCacheInfo] = useState<{
        subsHash: string;
        yearsMap: Record<number, Record<string, Subscription[]>>;
    }>({ subsHash: '', yearsMap: {} });

    const { wallet } = useWalletContext();

    useEffect(() => {
        const neededYears = [currentYear - 1, currentYear, currentYear + 1];

        setCacheInfo(prev => {
            const isHashChanged = prev.subsHash !== subsHash;
            let currentMap = isHashChanged ? {} : { ...prev.yearsMap };
            let hasChanges = isHashChanged;

            for (const y of neededYears) {
                if (!currentMap[y]) {
                    hasChanges = true;
                    const yearOccurrences: Record<string, Subscription[]> = {};

                    subscriptions.forEach(sub => {
                        if (sub.status === 'COMPLETED') return;

                        const dates = generateSubscriptionOccurrences(sub, y, y);
                        dates.forEach(d => {
                            const dateStr = format(d, 'yyyy-MM-dd');
                            if (!yearOccurrences[dateStr]) yearOccurrences[dateStr] = [];
                            yearOccurrences[dateStr].push(sub);
                        });
                    });

                    currentMap[y] = yearOccurrences;
                }
            }

            if (hasChanges) {
                const loadedYears = Object.keys(currentMap).map(Number);
                if (loadedYears.length > 5) {
                    loadedYears.sort((a, b) => Math.abs(a - currentYear) - Math.abs(b - currentYear));
                    const toKeep = loadedYears.slice(0, 5);
                    const finalMap: typeof currentMap = {};
                    toKeep.forEach(y => {
                        finalMap[y] = currentMap[y];
                    });
                    return { subsHash, yearsMap: finalMap };
                }
                return { subsHash, yearsMap: currentMap };
            }

            return prev;
        });
    }, [currentYear, subsHash, subscriptions]);

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

    const baseDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDays = [...baseDays.slice(weekStartsOn), ...baseDays.slice(0, weekStartsOn)];

    // Helper to resolve subscriptions for any date (used by DayDetailPanel for navigation)
    const getSubscriptionsForDate = useCallback((date: Date): Subscription[] => {
        const dayStr = format(date, 'yyyy-MM-dd');
        const yearData = cacheInfo.yearsMap[date.getFullYear()];
        return yearData ? (yearData[dayStr] || []) : [];
    }, [cacheInfo]);

    const handleDayClick = (clickedDay: Date) => {
        const subs = getSubscriptionsForDate(clickedDay);
        dayDetailRef.current?.openModal(clickedDay, subs);
    };

    return (
        <div className="flex flex-col h-full bg-app-card border border-app-border rounded-2xl p-2 sm:p-4 md:p-6 animate-[fadeIn_0.3s_ease-out]">

            {/* Header Calendario */}
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-6 w-full">
                <div className="w-full sm:max-w-xs m-auto">
                    <CustomDatePicker
                        isRange={true}
                        hideSidebar={true}
                        initialPreset="month"
                        initialStartDate={monthStart}
                        initialEndDate={monthEnd}
                        onChange={(val) => {
                            if (val && 'start' in val && val.start) {
                                setCurrentDate(val.start);
                            }
                        }}
                        weekStartsOn={weekStartsOn}
                        color="var(--color-app-sky)"
                    />
                </div>
            </div>

            {/* Intestazione Giorni (Lun, Mar, Mer...) */}
            <div className="grid grid-cols-7 mb-1 sm:mb-2">
                {weekDays.map(wd => (
                    <div key={wd} className="text-center text-[10px] sm:text-xs font-bold text-app-muted uppercase tracking-wider py-1 sm:py-2">
                        {wd}
                    </div>
                ))}
            </div>

            {/* Griglia dei Giorni */}
            <div className="grid grid-cols-7 grid-rows-6 gap-px sm:gap-1 md:gap-2 flex-1">
                {calendarDays.map((calendarDay, index) => {
                    const dayStr = format(calendarDay, 'yyyy-MM-dd');
                    const calendarDayYear = calendarDay.getFullYear();
                    const yearData = cacheInfo.yearsMap[calendarDayYear];
                    const daySubscriptions = yearData ? (yearData[dayStr] || []) : [];

                    const isCurrentMonth = isSameMonth(calendarDay, monthStart);
                    const isToday = isSameDay(calendarDay, new Date());

                    const MAX_VISIBLE = 3;
                    const visibleSubs = daySubscriptions.slice(0, MAX_VISIBLE);
                    const overflowCount = daySubscriptions.length - MAX_VISIBLE;

                    return (
                        <div
                            key={index}
                            onClick={() => handleDayClick(calendarDay)}
                            className={`flex flex-col p-1 sm:p-2 rounded-lg sm:rounded-xl border cursor-pointer transition-all min-w-0 overflow-hidden ${isCurrentMonth
                                ? 'bg-app-input/50 border-app-border hover:bg-app-input/80 hover:border-app-border'
                                : 'bg-transparent border-transparent opacity-40'
                                } ${isToday ? 'ring-1 ring-app-sky' : ''}`}
                        >
                            <span className={`text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 shrink-0 ${isToday ? 'text-app-sky' : 'text-app-muted'}`}>
                                {format(calendarDay, 'd')}
                            </span>

                            {/* Subscription badges — max 3, then +N */}
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 overflow-hidden">
                                {visibleSubs.map(sub => (
                                    <TagBadge tag={sub.tag} key={sub.id} showParent={false} compact={true} onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onEditSubscription && onEditSubscription(sub, calendarDay);
                                    }} />
                                ))}
                                {overflowCount > 0 && (
                                    <span className="text-[10px] sm:text-auto font-bold text-app-muted pl-0.5 shrink-0 ml-auto mr-1"
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
            <DayDetailPanel
                ref={dayDetailRef}
                getSubscriptionsForDate={getSubscriptionsForDate}
                onEditSubscription={onEditSubscription}
                onAddSubscription={onAddSubscription}
            />
        </div>
    );
};