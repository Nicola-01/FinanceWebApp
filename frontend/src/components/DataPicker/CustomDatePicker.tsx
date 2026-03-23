import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import CalendarContainer from './CalendarContainer';

// Definizione dei tipi per i valori di ritorno
export type DateRangeValue = { start: Date | null; end: Date | null };
export type DatePickerValue = DateRangeValue | Date | null;

export interface CustomDatePickerProps {
    isRange?: boolean;
    color?: string;
    onChange?: (value: DatePickerValue) => void;
}

export default function CustomDatePicker({
                                             isRange = true,
                                             color = '#ef4444',
                                             onChange
                                         }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (onChange) {
            onChange(isRange ? { start: startDate, end: endDate } : startDate);
        }
    }, [startDate, endDate, isRange, onChange]);

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setStartDate(null);
        setEndDate(null);
    };

    const formatDateLabel = (date: Date | null) => date ? format(date, 'MMM d, yyyy', { locale: it }) : '-';

    return (
        <div className="relative w-full max-w-md font-sans" ref={popoverRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
            >
                <div className="flex items-center gap-4 w-full">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    {isRange ? (
                        <div className="flex items-center gap-2 flex-1 text-gray-600 font-medium text-sm">
                            <span className="flex-1 text-center bg-gray-50 rounded py-1 px-2 border border-gray-100">{formatDateLabel(startDate)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="flex-1 text-center bg-gray-50 rounded py-1 px-2 border border-gray-100">{formatDateLabel(endDate)}</span>
                        </div>
                    ) : (
                        <span className="text-gray-600 font-medium text-sm">{formatDateLabel(startDate)}</span>
                    )}
                </div>

                {(startDate || endDate) && (
                    <button onClick={handleClear} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-full z-50 overflow-hidden">
                    <CalendarContainer
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        isRange={isRange}
                        color={color}
                    />
                </div>
            )}
        </div>
    );
}