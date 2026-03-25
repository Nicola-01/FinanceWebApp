import { ChevronLeft, ChevronRight } from 'lucide-react';
import { setYear } from 'date-fns';

export interface YearSelectorProps {
    currentDate: Date;
    onSelectYear: (date: Date) => void;
    onPrevDecade: () => void;
    onNextDecade: () => void;
    direction: 'next' | 'prev';
    isAllPreset?: boolean;
    color?: string;
    isDark: boolean;
}

export default function YearSelector({ currentDate, onSelectYear, onPrevDecade, onNextDecade, direction, isAllPreset, color = '#ef4444', isDark }: YearSelectorProps) {
    const currentYear = currentDate.getFullYear();
    const startYear = Math.floor(currentYear / 10) * 10 - 1;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    // Stili dinamici per il tema
    const btnNav = `p-2 rounded-md transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'}`;
    const textMain = isDark ? 'text-gray-100' : 'text-gray-700';

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={onPrevDecade} className={btnNav}>
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="overflow-hidden">
                    <div
                        key={startYear + '-title'}
                        className={`font-semibold px-4 py-1 ${textMain} ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}
                    >
                        {years[1]} - {years[10]}
                    </div>
                </div>
                <button onClick={onNextDecade} className={btnNav}>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div key={startYear + '-grid'} className={`grid grid-cols-4 gap-2 flex-1 ${direction === 'next' ? 'anim-next' : 'anim-prev'}`}>
                {years.map((year) => {
                    const isSelected = isAllPreset || currentYear === year;
                    const defaultStyle = isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100';

                    return (
                        <button
                            key={year}
                            onClick={() => onSelectYear(setYear(currentDate, year))}
                            className={`flex items-center justify-center rounded-lg text-sm transition-colors ${
                                isSelected ? 'text-white font-medium shadow-sm' : defaultStyle
                            }`}
                            style={isSelected ? { backgroundColor: color } : {}}
                        >
                            {year}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}