import React, { useState, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays
} from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Subscription } from '../../utils/types';
import { generateSubscriptionOccurrences } from '../../utils/subscriptionHelper';
import {TagBadge} from "../../components/TagBadge.tsx";

interface SubscriptionCalendarProps {
    subscriptions: Subscription[];
    onEditSubscription?: (subscription: Subscription, date: Date) => void;
}

export const SubscriptionCalendar: React.FC<SubscriptionCalendarProps> = ({ subscriptions, onEditSubscription }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const currentYear = currentDate.getFullYear();
    const subsHash = subscriptions.map(s => 
        `${s.id}-${s.status}-${s.frequencyType}-${s.frequencyInterval}-${s.nextExecutionDate}-${s.startDate}-${s.duration}-${s.durationTimes}-${s.durationUntil}`
    ).join('|');

    const [cacheInfo, setCacheInfo] = useState<{
        subsHash: string;
        yearsMap: Record<number, Record<string, Subscription[]>>;
    }>({ subsHash: '', yearsMap: {} });

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
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunedì come primo giorno
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = [];
    let day = startDate;
    while (day <= endDate) {
        calendarDays.push(day);
        day = addDays(day, 1);
    }

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="flex flex-col h-full bg-app-card border border-app-border rounded-2xl p-4 sm:p-6 animate-[fadeIn_0.3s_ease-out]">

            {/* Header Calendario */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white capitalize">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="flex items-center justify-center w-8 h-8 rounded-lg bg-app-input text-app-muted hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button onClick={nextMonth} className="flex items-center justify-center w-8 h-8 rounded-lg bg-app-input text-app-muted hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>

            {/* Intestazione Giorni (Lun, Mar, Mer...) */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map(wd => (
                    <div key={wd} className="text-center text-xs font-bold text-app-muted uppercase tracking-wider py-2">
                        {wd}
                    </div>
                ))}
            </div>

            {/* Griglia dei Giorni */}
            <div className="grid grid-cols-7 auto-rows-[minmax(80px,1fr)] gap-1 md:gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {calendarDays.map((calendarDay, index) => {
                    const dayStr = format(calendarDay, 'yyyy-MM-dd');
                    const calendarDayYear = calendarDay.getFullYear();
                    const yearData = cacheInfo.yearsMap[calendarDayYear];
                    const daySubscriptions = yearData ? (yearData[dayStr] || []) : [];

                    const isCurrentMonth = isSameMonth(calendarDay, monthStart);
                    const isToday = isSameDay(calendarDay, new Date());

                    return (
                        <div
                            key={index}
                            className={`flex flex-col p-2 rounded-xl border ${
                                isCurrentMonth ? 'bg-app-input/50 border-white/5' : 'bg-transparent border-transparent opacity-40'
                            } ${isToday ? 'ring-1 ring-[#00bfff]' : ''} transition-all`}
                        >
                            <span className={`text-xs font-bold mb-1 ${isToday ? 'text-[#00bfff]' : 'text-app-muted'}`}>
                                {format(calendarDay, 'd')}
                            </span>

                            {/* Lista pillole abbonamenti nel giorno */}
                            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                {daySubscriptions.map(sub => (
                                    <TagBadge tag={sub.tag} key={sub.id} showParent={false} onClick={() => onEditSubscription && onEditSubscription(sub, calendarDay)}/>
                                    // <div
                                    //     key={sub.id}
                                    //
                                    //     className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate cursor-pointer transition-opacity hover:opacity-80 ${
                                    //         sub.type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-white/10 text-white'
                                    //     }`}
                                    //     title={`${sub.name} - ${sub.amount}`}
                                    // >
                                    //     {sub.name}
                                    // </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};