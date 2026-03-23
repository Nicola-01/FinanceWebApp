import React, { useState, useRef, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthGrid from './MonthGrid';

export interface CalendarContainerProps {
    startDate: Date | null;
    endDate: Date | null;
    setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    isRange: boolean;
    color: string;
}

export default function CalendarContainer({ startDate, endDate, setStartDate, setEndDate, isRange, color }: CalendarContainerProps) {
    const [currentDate, setCurrentDate] = useState<Date>(startDate || new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const monthsToRender = useMemo(() => {
        const months: Date[] = [];
        for (let i = -12; i <= 12; i++) {
            months.push(addMonths(new Date(), i));
        }
        return months;
    }, []);

    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const dateStr = entry.target.getAttribute('data-month');
                        if (dateStr) {
                            setCurrentDate(new Date(dateStr));
                        }
                    }
                });
            },
            { root: scrollContainerRef.current, threshold: 0.5 }
        );

        const monthElements = scrollContainerRef.current.querySelectorAll('.month-block');
        monthElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [monthsToRender]);

    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const dateIso = startOfMonth(currentDate).toISOString();
        const currentMonthEl = scrollContainerRef.current.querySelector(`[data-month="${dateIso}"]`);

        if (currentMonthEl) {
            currentMonthEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));

    return (
        <div className="flex flex-col h-100">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={handlePrevMonth} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <span className="capitalize">{format(currentDate, 'MMMM', { locale: it })}</span>
                    <span>{format(currentDate, 'yyyy')}</span>
                </div>

                <button onClick={handleNextMonth} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-400">{day}</div>
                ))}
            </div>

            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory pr-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {monthsToRender.map((monthDate, index) => (
                    <MonthGrid
                        key={index}
                        monthDate={monthDate}
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        isRange={isRange}
                        color={color}
                    />
                ))}
            </div>
        </div>
    );
}