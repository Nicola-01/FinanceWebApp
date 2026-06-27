import React, {useMemo, useState, useEffect, useRef} from 'react';
import {TrendingUp, TrendingDown, Scale, ChevronLeft, ChevronRight} from 'lucide-react';
import type {Transaction} from '../../utils/types.ts';
import {SwitchableCard} from "./SwitchableCard.tsx";
import {OverviewRow} from "./OverviewRow.tsx";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ViewMode = 'monthly' | 'yearly';

const TABS = [
    {key: 'monthly', label: 'Monthly', title: 'Monthly Overview'},
    {key: 'yearly', label: 'Yearly', title: 'Yearly Overview'},
];

const formatAmount = (value: number): string => {
    if (value === 0) return '—';
    return value.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2});
};

interface MonthlyOverviewProps {
    transactions: Transaction[];
}

export const OverviewTable: React.FC<MonthlyOverviewProps> = ({transactions}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        transactions.forEach(tx => years.add(new Date(tx.transactionDate).getFullYear()));
        const sorted = Array.from(years).sort((a, b) => b - a);
        return sorted.length > 0 ? sorted : [new Date().getFullYear()];
    }, [transactions]);

    const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

    // --- Monthly data ---
    const monthlyData = useMemo(() => {
        const data = Array.from({length: 12}, () => ({income: 0, expense: 0}));
        transactions.forEach(tx => {
            const d = new Date(tx.transactionDate);
            if (d.getFullYear() !== selectedYear) return;
            const month = d.getMonth();
            if (tx.type === 'INCOME') data[month].income += tx.amount;
            else data[month].expense += tx.amount;
        });
        return data;
    }, [transactions, selectedYear]);

    const monthlyTotals = useMemo(() => monthlyData.reduce(
        (acc, m) => ({income: acc.income + m.income, expense: acc.expense + m.expense}),
        {income: 0, expense: 0}
    ), [monthlyData]);

    // --- Yearly data ---
    const yearlyColumns = useMemo(() => {
        const sorted = [...availableYears].sort((a, b) => a - b);
        return sorted.slice(-10);
    }, [availableYears]);

    const yearlyData = useMemo(() => {
        const data = new Map<number, { income: number; expense: number }>();
        yearlyColumns.forEach(y => data.set(y, {income: 0, expense: 0}));
        transactions.forEach(tx => {
            const year = new Date(tx.transactionDate).getFullYear();
            const entry = data.get(year);
            if (!entry) return;
            if (tx.type === 'INCOME') entry.income += tx.amount;
            else entry.expense += tx.amount;
        });
        return yearlyColumns.map(y => ({year: y, ...data.get(y)!}));
    }, [transactions, yearlyColumns]);

    const yearlyTotals = useMemo(() => yearlyData.reduce(
        (acc, y) => ({income: acc.income + y.income, expense: acc.expense + y.expense}),
        {income: 0, expense: 0}
    ), [yearlyData]);

    const canGoBack = availableYears.includes(selectedYear - 1);
    const canGoForward = availableYears.includes(selectedYear + 1);

    const isMonthly = viewMode === 'monthly';
    const columns = isMonthly
        ? MONTHS.map((m, i) => ({key: String(i), label: m}))
        : yearlyData.map(y => ({key: String(y.year), label: String(y.year)}));

    const dataItems = isMonthly
        ? monthlyData
        : yearlyData;

    const totals = isMonthly ? monthlyTotals : yearlyTotals;

    const rightmostDataIndex = useMemo(() => {
        let lastIndex = 0;
        const data = isMonthly ? monthlyData : yearlyData;
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].income !== 0 || data[i].expense !== 0) {
                lastIndex = i;
                break;
            }
        }
        return lastIndex;
    }, [isMonthly, monthlyData, yearlyData]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const timeoutId = setTimeout(() => {
            const columnWidth = container.scrollWidth / columns.length;
            const targetScrollLeft = (rightmostDataIndex + 1) * columnWidth - container.clientWidth;
            
            container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
            });
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [rightmostDataIndex, viewMode, selectedYear, columns.length]);

    const renderValueCell = (value: number, type: 'income' | 'expense' | 'balance', isBold = false) => {
        const hasData = value !== 0;
        let color = 'text-app-muted/30';
        let prefix = '';

        if (hasData) {
            if (type === 'income') {
                color = 'text-emerald-400';
                prefix = '+';
            } else if (type === 'expense') {
                color = 'text-red-400';
                prefix = '-';
                value = Math.abs(value);
            } else {
                color = value >= 0 ? 'text-emerald-400' : 'text-red-400';
                prefix = value >= 0 ? '+' : '-';
                value = Math.abs(value);
            }
        }

        return (
            <span className={`text-xs md:text-sm whitespace-nowrap ${isBold ? 'font-bold' : 'font-medium'} ${color}`}>
                {hasData ? `${prefix}${formatAmount(value)}` : '—'}
            </span>
        );
    };

    // Year selector as center element
    const yearSelector = isMonthly ? (
        <div className="flex items-center gap-2 md:ml-5">
            <button
                onClick={() => canGoBack && setSelectedYear(y => y - 1)}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg bg-app-input border border-app-border text-app-muted hover:bg-app-surface hover:text-app-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18}/>
            </button>
            <span className="text-lg font-bold text-app-text min-w-[60px] text-center">{selectedYear}</span>
            <button
                onClick={() => canGoForward && setSelectedYear(y => y + 1)}
                disabled={!canGoForward}
                className="p-1.5 rounded-lg bg-app-input border border-app-border text-app-muted hover:bg-app-surface hover:text-app-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight size={18}/>
            </button>
        </div>
    ) : undefined;

    return (
        <SwitchableCard
            tabs={TABS}
            activeTab={viewMode}
            onTabChange={(key) => setViewMode(key as ViewMode)}
            title={TABS.find(t => t.key === viewMode)?.title}
            centerElement={yearSelector}
            noPadding
            className="my-4"
        >
            {/* Table with floating left & right overlay columns */}
            <div className="relative">
                {/* Left floating column (icons) — backdrop blur */}
                <div
                    className="absolute left-0 top-0 bottom-0 z-20 bg-app-card/50 backdrop-blur-2xl border-r border-app-border flex flex-col"
                    style={{width: '44px'}}>
                    <div className="border-b border-app-border px-2 py-3 flex-none h-10.25"></div>
                    <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
                        <TrendingUp size={16} className="text-emerald-400"/>
                    </div>
                    <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
                        <TrendingDown size={16} className="text-red-400"/>
                    </div>
                    <div className="px-2 py-3 flex items-center justify-center flex-1">
                        <Scale size={16} className="text-blue-400"/>
                    </div>
                </div>

                {/* Right floating column (totals) — backdrop blur */}
                <div
                    className="absolute right-0 top-0 bottom-0 z-20 bg-app-card/50 backdrop-blur-2xl border-l border-app-border flex flex-col"
                    style={{width: '100px'}}>
                    <div
                        className="border-b border-app-border px-2 py-3 text-center text-xs text-app-muted uppercase tracking-wider font-bold flex-none">Tot
                    </div>
                    <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
                        {renderValueCell(totals.income, 'income', true)}
                    </div>
                    <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
                        {renderValueCell(totals.expense, 'expense', true)}
                    </div>
                    <div className="px-2 py-3 flex items-center justify-center flex-1">
                        {renderValueCell(totals.income - totals.expense, 'balance', true)}
                    </div>
                </div>

                {/* Scrollable table — offset by overlay widths */}
                <div className="overflow-x-auto overview-scroll-area"
                     ref={scrollContainerRef}
                     style={{marginLeft: '44px', marginRight: '100px'}}>
                    <table className="w-full border-collapse"
                           style={{tableLayout: 'fixed', minWidth: `${columns.length * 90}px`}}>
                        <colgroup>
                            {columns.map(c => (
                                <col key={c.key}/>
                            ))}
                        </colgroup>
                        <thead>
                        <tr className="border-b border-app-border">
                            {columns.map(c => (
                                <th key={c.key}
                                    className="text-center text-xs text-app-muted uppercase tracking-wider px-1 py-3 font-semibold">
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        <OverviewRow dataItems={dataItems} getValue={(m) => m.income} type="income"/>
                        <OverviewRow dataItems={dataItems} getValue={(m) => m.expense} type="expense"/>
                        <OverviewRow dataItems={dataItems} border={false} getValue={(m) => m.income - m.expense} type="balance"/>
                        </tbody>
                    </table>
                </div>
            </div>
        </SwitchableCard>
    );
};
