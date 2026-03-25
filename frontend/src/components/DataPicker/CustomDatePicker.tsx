import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, addMonths, subYears, addYears } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarContainer from './CalendarContainer';

export type DateRangeValue = { start: Date | null; end: Date | null };
export type DatePickerValue = DateRangeValue | Date | null;
export type PresetType = 'last30' | 'month' | 'year' | 'all' | 'custom' | 'today';

export interface CustomDatePickerProps {
    isRange?: boolean;
    color?: string;
    isDark?: boolean;
    onChange?: (value: DatePickerValue) => void;
}

export default function CustomDatePicker({
                                             isRange = true,
                                             color = '#00ff7f',
                                             isDark = true,
                                             onChange
                                         }: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [preset, setPreset] = useState<PresetType>('month');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const popoverRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

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
        if (onChangeRef.current) {
            onChangeRef.current(isRange ? { start: startDate, end: endDate } : startDate);
        }
    }, [startDate, endDate, isRange]);

    useEffect(() => {
        const today = new Date();
        const jumpToToday = () => {
            if (currentDate.getMonth() !== today.getMonth() || currentDate.getFullYear() !== today.getFullYear()) {
                setCurrentDate(today);
            }
        };

        switch (preset) {
            case 'today':
                setStartDate(today);
                setEndDate(null);
                jumpToToday();
                break;
            case 'last30':
                setStartDate(subDays(today, 30));
                setEndDate(today);
                jumpToToday();
                break;
            case 'month':
                setStartDate(startOfMonth(currentDate));
                setEndDate(endOfMonth(currentDate));
                break;
            case 'year':
                setStartDate(startOfYear(currentDate));
                setEndDate(endOfYear(currentDate));
                break;
            case 'all':
                setStartDate(null);
                setEndDate(null);
                jumpToToday();
                break;
            case 'custom':
                break;
        }
    }, [preset, currentDate]);

    const formatDateLabel = (date: Date | null) => date ? format(date, 'MMM d, yyyy', { locale: it }) : '-';

    const mainPresets: { id: PresetType; label: string }[] = [
        { id: 'last30', label: 'Last 30 Days' },
        { id: 'month', label: 'Month' },
        { id: 'year', label: 'Year' },
        { id: 'all', label: 'All' },
        { id: 'custom', label: 'Custom' }
    ];

    const bgMain = isDark ? 'bg-gray-900' : 'bg-white';
    const textMain = isDark ? 'text-gray-100' : 'text-gray-700';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-400';
    const borderMain = isDark ? 'border-gray-700' : 'border-gray-200';
    const bgHover = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
    const bgInput = isDark ? 'bg-gray-800' : 'bg-gray-50';
    const borderInput = isDark ? 'border-gray-600' : 'border-gray-100';

    const renderTriggerContent = () => {
        if (preset === 'all') return <span className={`${textMain} font-medium text-sm flex-1 text-center`}>All transactions</span>;

        // Aggiunta la visualizzazione del testo statico per "Last 30 Days"
        if (preset === 'last30') return <span className={`${textMain} font-medium text-sm flex-1 text-center`}>Last 30 Days</span>;

        if (preset === 'month') {
            return (
                <div className="flex items-center justify-between w-full flex-1">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(prev => subMonths(prev, 1)); }} className={`p-1 rounded ${bgHover} ${textMuted}`}><ChevronLeft className="w-4 h-4" /></button>
                    <span className={`${textMain} font-medium text-sm capitalize`}>{format(currentDate, 'MMMM yyyy', { locale: it })}</span>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(prev => addMonths(prev, 1)); }} className={`p-1 rounded ${bgHover} ${textMuted}`}><ChevronRight className="w-4 h-4" /></button>
                </div>
            );
        }
        if (preset === 'year') {
            return (
                <div className="flex items-center justify-between w-full flex-1">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(prev => subYears(prev, 1)); }} className={`p-1 rounded ${bgHover} ${textMuted}`}><ChevronLeft className="w-4 h-4" /></button>
                    <span className={`${textMain} font-medium text-sm`}>{format(currentDate, 'yyyy')}</span>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentDate(prev => addYears(prev, 1)); }} className={`p-1 rounded ${bgHover} ${textMuted}`}><ChevronRight className="w-4 h-4" /></button>
                </div>
            );
        }

        return (
            <div className={`flex items-center gap-2 flex-1 font-medium text-sm w-full ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className={`flex-1 text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}>{formatDateLabel(startDate)}</span>
                <span className={textMuted}>→</span>
                <span className={`flex-1 text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}>{formatDateLabel(endDate)}</span>
            </div>
        );
    };

    return (
        // Contenitore principale flessibile per posizionare l'icona all'esterno
        <div className="relative w-full max-w-sm font-sans flex items-center gap-3" ref={popoverRef}>

            {/* Icona del Calendario fissa a sinistra */}
            <CalendarIcon className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />

            {/* Box Cliccabile */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex-1 flex items-center justify-between p-3 border rounded-lg shadow-sm cursor-pointer transition-colors h-12 ${bgMain} ${borderMain} hover:border-opacity-70`}
            >
                <div className="flex items-center w-full">
                    {renderTriggerContent()}
                </div>
            </div>

            {/* Popover del Calendario */}
            {isOpen && (
                <div className={`absolute top-full mt-2 rounded-xl shadow-xl border overflow-hidden flex flex-col md:flex-row z-50 w-[calc(100vw-2rem)] sm:w-auto left-0 sm:-left-4 md:left-0 md:min-w-[550px] ${bgMain} ${borderMain}`}>

                    {/* SIDEBAR PRESET */}
                    <div className={`flex flex-row md:flex-col p-2 overflow-x-auto no-scrollbar md:w-36 flex-shrink-0 border-b md:border-b-0 md:border-r ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>

                        <div className="flex flex-row md:flex-col gap-1 flex-1">
                            {mainPresets.map((p) => {
                                const isSelected = preset === p.id;
                                const btnBg = isSelected
                                    ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm')
                                    : (isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-200/50');
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setPreset(p.id)}
                                        className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${btnBg}`}
                                        style={isSelected ? { color } : {}}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={`hidden md:block h-px w-full my-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <div className={`md:hidden w-px h-auto mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

                        <div className="flex flex-row md:flex-col gap-1">
                            <button
                                onClick={() => setPreset('today')}
                                className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal ${
                                    preset === 'today'
                                        ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm')
                                        : (isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-200/50')
                                }`}
                                style={preset === 'today' ? { color } : {}}
                            >
                                Today
                            </button>
                        </div>

                    </div>

                    {/* CALENDARIO */}
                    <div className="flex-1 p-4 overflow-hidden">
                        <CalendarContainer
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
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
                </div>
            )}
        </div>
    );
}