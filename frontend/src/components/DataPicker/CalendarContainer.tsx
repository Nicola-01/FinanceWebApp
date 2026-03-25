import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthGrid from './MonthGrid';
import MonthSelector from './MonthSelector';
import YearSelector from './YearSelector';
import type {PresetType} from './CustomDatePicker';

export interface CalendarContainerProps {
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
    startDate: Date | null;
    endDate: Date | null;
    setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    preset: PresetType;
    setPreset: React.Dispatch<React.SetStateAction<PresetType>>;
    isRange: boolean;
    color: string;
    isDark: boolean;
}

type ViewState = 'calendar' | 'months' | 'years';

export default function CalendarContainer({ currentDate, setCurrentDate, startDate, endDate, setStartDate, setEndDate, preset, setPreset, isRange, color, isDark }: CalendarContainerProps) {
    const [view, setView] = useState<ViewState>('calendar');
    const [direction, setDirection] = useState<'next' | 'prev'>('next');

    useEffect(() => {
        if (preset === 'year') setView('months');
        else if (preset === 'month' || preset === 'today') setView('calendar');
    }, [preset]);

    const handlePrevMonth = () => { setDirection('prev'); setCurrentDate((prev) => subMonths(prev, 1)); };
    const handleNextMonth = () => { setDirection('next'); setCurrentDate((prev) => addMonths(prev, 1)); };

    const handleSelectMonth = (date: Date) => {
        if (preset === 'year') {
            setPreset('month');
            setCurrentDate(date);
            setView('calendar');
        } else {
            const newDate = new Date(currentDate);
            newDate.setMonth(date.getMonth());
            setCurrentDate(newDate);
            setView('calendar');
        }
    };

    const handlePrevYear = () => { setDirection('prev'); setCurrentDate((prev) => subYears(prev, 1)); };
    const handleNextYear = () => { setDirection('next'); setCurrentDate((prev) => addYears(prev, 1)); };

    const handleSelectYear = (date: Date) => {
        setCurrentDate(date);
        setView('months');
    };
    const handlePrevDecade = () => { setDirection('prev'); setCurrentDate((prev) => subYears(prev, 10)); };
    const handleNextDecade = () => { setDirection('next'); setCurrentDate((prev) => addYears(prev, 10)); };

    const btnNav = `p-2 rounded-md transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`;
    const textMain = isDark ? 'text-gray-100' : 'text-gray-700';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className="flex flex-col w-full h-72">
            <style>{`
                /* Nuove animazioni orizzontali */
                @keyframes slideInNext { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInPrev { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                .anim-next { animation: slideInNext 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .anim-prev { animation: slideInPrev 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>

            {view === 'calendar' && (
                <>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <button onClick={handlePrevMonth} className={btnNav}><ChevronLeft className="w-4 h-4" /></button>
                        <div className="overflow-hidden flex justify-center w-32">
                            <button
                                key={currentDate.toISOString() + '-title'}
                                onClick={() => setView('months')}
                                className={`flex items-center gap-1 font-semibold px-3 py-1 rounded-md transition-colors ${textMain} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}
                            >
                                <span className="capitalize">{format(currentDate, 'MMM', { locale: it })}</span>
                                <span>{format(currentDate, 'yyyy')}</span>
                            </button>
                        </div>
                        <button onClick={handleNextMonth} className={btnNav}><ChevronRight className="w-4 h-4" /></button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className={`text-center text-xs font-medium ${textMuted}`}>{day}</div>
                        ))}
                    </div>

                    <div key={currentDate.toISOString() + '-grid'} className={`flex-1 ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}>
                        <MonthGrid
                            monthDate={currentDate}
                            startDate={startDate}
                            endDate={endDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            preset={preset}
                            setPreset={setPreset}
                            isRange={isRange}
                            color={color}
                            isDark={isDark}
                        />
                    </div>
                </>
            )}

            {view === 'months' && (
                <MonthSelector
                    currentDate={currentDate}
                    onSelectMonth={handleSelectMonth}
                    onYearClick={() => setView('years')}
                    onPrevYear={handlePrevYear}
                    onNextYear={handleNextYear}
                    direction={direction}
                    isYearPreset={preset === 'year'}
                    isAllPreset={preset === 'all'}
                    color={color}
                    isDark={isDark}
                />
            )}

            {view === 'years' && (
                <YearSelector
                    currentDate={currentDate}
                    onSelectYear={handleSelectYear}
                    onPrevDecade={handlePrevDecade}
                    onNextDecade={handleNextDecade}
                    direction={direction}
                    isAllPreset={preset === 'all'}
                    color={color}
                    isDark={isDark}
                />
            )}
        </div>
    );
}