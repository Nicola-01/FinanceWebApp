import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, setMonth } from 'date-fns';
import { it } from 'date-fns/locale';

export interface MonthSelectorProps {
    currentDate: Date;
    onSelectMonth: (date: Date) => void;
    onYearClick: () => void;
    onPrevYear: () => void;
    onNextYear: () => void;
    direction: 'next' | 'prev';
    isYearPreset?: boolean;
    isAllPreset?: boolean;
    color?: string;
    isDark: boolean;
}

export default function MonthSelector({ currentDate, onSelectMonth, onYearClick, onPrevYear, onNextYear, direction, isYearPreset, isAllPreset, color = '#ef4444', isDark }: MonthSelectorProps) {
    const months = Array.from({ length: 12 }, (_, i) => ({ date: setMonth(new Date(), i), label: format(setMonth(new Date(), i), 'MMM', { locale: it }) }));
    const currentMonthIndex = currentDate.getMonth();
    const yearKey = currentDate.getFullYear();
    const btnNav = `p-2 rounded-md transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`;

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={onPrevYear} className={btnNav}><ChevronLeft className="w-4 h-4" /></button>
                <div className="overflow-hidden">
                    <button key={yearKey + '-title'} onClick={onYearClick} className={`font-semibold px-4 py-1 rounded-md transition-colors ${isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'} ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}>
                        {yearKey}
                    </button>
                </div>
                <button onClick={onNextYear} className={btnNav}><ChevronRight className="w-4 h-4" /></button>
            </div>

            <div key={yearKey + '-grid'} className={`grid grid-cols-4 gap-2 flex-1 ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}>
                {months.map((month, idx) => {
                    const isSelected = isYearPreset || isAllPreset || currentMonthIndex === idx;
                    const defaultStyle = isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100';
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelectMonth(month.date)}
                            className={`flex items-center justify-center rounded-lg capitalize text-sm transition-colors ${isSelected ? 'text-white font-medium shadow-sm' : defaultStyle}`}
                            style={isSelected ? { backgroundColor: color } : {}}
                        >
                            {month.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}