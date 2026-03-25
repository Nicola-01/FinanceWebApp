import React from 'react';
import {format, isSameMonth, isSameDay, isAfter, isBefore} from 'date-fns';
import type {PresetType} from './CustomDatePicker';

export interface DayCellProps {
    day: Date;
    monthStart: Date;
    startDate: Date | null;
    endDate: Date | null;
    onClick: () => void;
    isRange: boolean;
    preset: PresetType;
    color: string;
    isDark: boolean;
}

export default function DayCell({
                                    day,
                                    monthStart,
                                    startDate,
                                    endDate,
                                    onClick,
                                    isRange,
                                    preset,
                                    color,
                                    isDark
                                }: DayCellProps) {
    const isCurrentMonth = isSameMonth(day, monthStart);
    const isToday = isSameDay(day, new Date());

    const isStart = startDate && isSameDay(day, startDate) && preset !== 'all';
    const isEnd = endDate && isSameDay(day, endDate) && preset !== 'all';
    const isSelected = isStart || isEnd;

    const isBetween = (startDate && endDate && isAfter(day, startDate) && isBefore(day, endDate)) || preset === 'all';

    let cellStyles = "relative flex items-center justify-center h-10 w-full text-sm transition-all ";
    let textStyles = "z-10 ";
    let inlineStyles: React.CSSProperties = {};

    if (!isCurrentMonth) {
        cellStyles += isDark ? "text-gray-600 pointer-events-none " : "text-gray-300 pointer-events-none ";
    } else {
        cellStyles += "cursor-pointer ";
        textStyles += isDark ? "text-gray-300 hover:text-white " : "text-gray-700 hover:text-black ";

        if (isSelected) {
            textStyles += "font-bold text-white ";
            inlineStyles.backgroundColor = color;

            if (isRange && isStart && endDate) cellStyles += "rounded-l-full ";
            else if (isRange && isEnd && startDate) cellStyles += "rounded-r-full ";
            else cellStyles += "rounded-full ";

        } else if (isBetween) {
            inlineStyles.backgroundColor = `${color}33`;
            textStyles += isDark ? "text-white " : "text-gray-800 ";
        } else {
            cellStyles += isDark ? "hover:bg-gray-800 rounded-full " : "hover:bg-gray-100 rounded-full ";
        }

        if (isToday && !isSelected) {
            textStyles += "font-bold ";
            if (!isBetween) inlineStyles.color = color;
        }
    }

    return (
        <div className={cellStyles} style={inlineStyles} onClick={isCurrentMonth ? onClick : undefined}>
            {isSelected &&
                <div className="absolute inset-2 rounded-full" style={{backgroundColor: color, zIndex: 0}}></div>}

            <span className={textStyles} style={{zIndex: 10, position: 'relative'}}>
                {format(day, 'd')}
            </span>

            {isCurrentMonth && isToday && (
                <div
                    className="absolute bottom-1 w-1 h-1 rounded-full"
                    style={{backgroundColor: isSelected ? '#fff' : color, zIndex: 10}}
                ></div>
            )}
        </div>
    );
}