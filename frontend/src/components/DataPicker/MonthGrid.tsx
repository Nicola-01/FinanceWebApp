import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isBefore } from 'date-fns';
import DayCell from './DayCell';

export interface MonthGridProps {
    monthDate: Date;
    startDate: Date | null;
    endDate: Date | null;
    setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    isRange: boolean;
    color: string;
}

export default function MonthGrid({ monthDate, startDate, endDate, setStartDate, setEndDate, isRange, color }: MonthGridProps) {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDateGrid = startOfWeek(monthStart);
    const endDateGrid = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDateGrid, end: endDateGrid });

    const handleDateClick = (day: Date) => {
        if (!isRange) {
            setStartDate(day);
            setEndDate(null);
            return;
        }

        if (!startDate || (startDate && endDate)) {
            setStartDate(day);
            setEndDate(null);
        } else if (isBefore(day, startDate)) {
            setStartDate(day);
        } else {
            setEndDate(day);
        }
    };

    return (
        <div className="month-block snap-start mb-6" data-month={monthStart.toISOString()}>
            <div className="grid grid-cols-7 gap-y-1">
                {days.map((day, idx) => (
                    <DayCell
                        key={idx}
                        day={day}
                        monthStart={monthStart}
                        startDate={startDate}
                        endDate={endDate}
                        onClick={() => handleDateClick(day)}
                        isRange={isRange}
                        color={color}
                    />
                ))}
            </div>
        </div>
    );
}