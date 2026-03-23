import React from 'react';
import { format, isSameMonth, isSameDay, isAfter, isBefore } from 'date-fns';

export interface DayCellProps {
    day: Date;
    monthStart: Date;
    startDate: Date | null;
    endDate: Date | null;
    onClick: () => void;
    isRange: boolean;
    color: string;
}

export default function DayCell({ day, monthStart, startDate, endDate, onClick, isRange, color }: DayCellProps) {
    const isCurrentMonth = isSameMonth(day, monthStart);
    const isStart = startDate && isSameDay(day, startDate);
    const isEnd = endDate && isSameDay(day, endDate);
    const isSelected = isStart || isEnd;
    const isBetween = startDate && endDate && isAfter(day, startDate) && isBefore(day, endDate);

    // Logica per range "Infinito" sfumato
    const isInfiniteRangeFading = isRange && startDate && !endDate && isAfter(day, startDate) && isCurrentMonth;

    let cellStyles = "relative flex items-center justify-center h-10 w-full text-sm transition-all cursor-pointer ";
    let textStyles = "z-10 ";
    let inlineStyles: React.CSSProperties = {};

    if (!isCurrentMonth) {
        cellStyles += "text-gray-300 pointer-events-none ";
    } else {
        textStyles += "text-gray-700 hover:text-white ";

        if (isSelected) {
            textStyles += "font-bold text-white ";
            inlineStyles.backgroundColor = color;

            if (isRange && isStart && endDate) {
                cellStyles += "rounded-l-full ";
            } else if (isRange && isEnd && startDate) {
                cellStyles += "rounded-r-full ";
            } else {
                cellStyles += "rounded-full ";
            }
        } else if (isBetween) {
            inlineStyles.backgroundColor = `${color}33`; // 20% opacità
        } else if (isInfiniteRangeFading && startDate) {
            const distance = day.getDate() - startDate.getDate();
            const opacity = Math.max(0, 0.4 - (distance * 0.05));

            inlineStyles.background = `linear-gradient(to right, ${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}, transparent)`;
            inlineStyles.borderTop = `1px dashed ${color}`;
            inlineStyles.borderBottom = `1px dashed ${color}`;

            if (distance === 1) cellStyles += "border-l-0 ";
        } else {
            cellStyles += "hover:bg-gray-100 rounded-full ";
        }
    }

    return (
        <div className={cellStyles} style={inlineStyles} onClick={onClick}>
            {isSelected && <div className="absolute inset-2 rounded-full" style={{ backgroundColor: color, zIndex: 0 }}></div>}
            <span className={textStyles} style={{ zIndex: 10, position: 'relative' }}>
        {format(day, 'd')}
      </span>
        </div>
    );
}