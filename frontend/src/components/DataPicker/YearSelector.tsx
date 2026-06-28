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
    const btnNav = `p-2 rounded-md transition-colors ${isDark ? 'theme-bg-neutral-dark hover:theme-bg-neutral theme-text-muted' : 'theme-bg-inverse-muted hover:theme-bg-inverse-muted theme-text-subtle'}`;
    const textMain = isDark ? 'theme-text-muted' : 'theme-text-subtle';

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
                    const defaultStyle = isDark ? 'theme-text-muted hover:theme-bg-neutral-dark' : 'theme-text-subtle hover:theme-bg-inverse-muted';

                    return (
                        <button
                            key={year}
                            onClick={() => onSelectYear(setYear(currentDate, year))}
                            className={`flex items-center justify-center rounded-lg text-sm transition-colors ${
                                isSelected ? 'theme-text-default font-medium shadow-sm' : defaultStyle
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