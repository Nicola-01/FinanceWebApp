import React, {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight, faFilter} from '@fortawesome/free-solid-svg-icons';
import type {Transaction} from '../../utils/types.ts';

// Importiamo il nuovo componente CustomDatePicker
import CustomDatePicker, {type DateRangeValue } from '../../components/DataPicker/CustomDatePicker.tsx';

interface TransactionsFilterProps {
    transactions: Transaction[];
    onFilterChange: (filtered: Transaction[]) => void;
}

const VIEW_MODES = [
    { id: 'LAST_30_DAYS', label: '30 DAYS' },
    { id: 'MONTH', label: 'MONTH' },
    { id: 'YEAR', label: 'YEAR' },
    { id: 'ALL', label: 'ALL' },
    { id: 'CUSTOM', label: 'CUSTOM' }
] as const;

type ViewModeType = typeof VIEW_MODES[number]['id'];

export const TransactionsFilter: React.FC<TransactionsFilterProps> = ({ transactions, onFilterChange }) => {
    const [viewMode, setViewMode] = useState<ViewModeType>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tagFilter, setTagFilter] = useState('ALL');

    // Nuovo stato per gestire il CustomDatePicker
    const [customDateRange, setCustomDateRange] = useState<DateRangeValue>({ start: null, end: null });

    // Estrai i Tag unici per la select
    const uniqueTags = Array.from(new Set(transactions.map(t => t.tag.name)));

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        viewMode === 'MONTH' ? newDate.setMonth(newDate.getMonth() - 1) : newDate.setFullYear(newDate.getFullYear() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        viewMode === 'MONTH' ? newDate.setMonth(newDate.getMonth() + 1) : newDate.setFullYear(newDate.getFullYear() + 1);
        setCurrentDate(newDate);
    };

    const displayDate = () => {
        if (viewMode === 'YEAR') return currentDate.getFullYear().toString();
        return currentDate.toLocaleDateString('en-UK', { month: 'long', year: 'numeric' });
    };

    // Applica i filtri ogni volta che cambia uno stato o le transazioni originali
    useEffect(() => {
        const filtered = transactions.filter(tx => {
            // 1. Filtro Tag
            if (tagFilter !== 'ALL' && tx.tag.name !== tagFilter) return false;

            // 2. Filtro Data
            const txDate = new Date(tx.transactionDate);

            if (viewMode === 'MONTH') {
                return txDate.getMonth() === currentDate.getMonth() && txDate.getFullYear() === currentDate.getFullYear();
            }
            if (viewMode === 'YEAR') {
                return txDate.getFullYear() === currentDate.getFullYear();
            }
            if (viewMode === 'LAST_30_DAYS') {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                return txDate >= thirtyDaysAgo && txDate <= today;
            }
            if (viewMode === 'CUSTOM') {
                // Controllo con il nuovo state customDateRange
                if (customDateRange.start) {
                    const start = new Date(customDateRange.start);
                    start.setHours(0, 0, 0, 0); // Inizio della giornata
                    if (txDate < start) return false;
                }
                if (customDateRange.end) {
                    const end = new Date(customDateRange.end);
                    end.setHours(23, 59, 59, 999); // Fine della giornata
                    if (txDate > end) return false;
                }
            }
            return true;
        });

        onFilterChange(filtered);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions, viewMode, currentDate, tagFilter, customDateRange]);

    return (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">

            {/* Tipo di visualizzazione (Mese, Anno, 30 Giorni, Custom) */}
            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 border border-white/5">
                {VIEW_MODES.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => setViewMode(mode.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === mode.id ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* Selettore Veloce Data (Frecce) - Nascosto per CUSTOM e LAST_30_DAYS */}
            {(viewMode === 'MONTH' || viewMode === 'YEAR') && (
                <div className="flex items-center gap-3 ml-2">
                    <button onClick={handlePrev} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    </button>
                    <span className="w-32 text-center text-sm font-bold capitalize text-white tracking-wide">
                        {displayDate()}
                    </span>
                    <button onClick={handleNext} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                    </button>
                </div>
            )}

            {/* Selettori Date Custom (Sostituito con il tuo nuovo componente) */}
            {viewMode === 'CUSTOM' && (
                <div className="flex items-center gap-2 ml-2 min-w-[280px]">
                    <CustomDatePicker
                        isRange={true}
                        color="#00ff7f" // Ho usato il verde fluo dei tuoi input precedenti
                        onChange={(val) => setCustomDateRange(val as DateRangeValue)}
                    />
                </div>
            )}

            {/* Filtro Tag Dinamico */}
            <div className="ml-auto flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-white/40 text-xs" />
                <select
                    className="bg-black/40 border border-white/10 text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff7f] appearance-none cursor-pointer"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                >
                    <option value="ALL">All Tags</option>
                    {uniqueTags.map(tagName => (
                        <option key={tagName} value={tagName}>{tagName}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};