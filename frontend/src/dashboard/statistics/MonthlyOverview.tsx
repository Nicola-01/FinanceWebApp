import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Scale, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { Transaction } from '../../utils/types.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ViewMode = 'monthly' | 'yearly';

const formatAmount = (value: number): string => {
    if (value === 0) return '—';
    return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ViewModeDropdown: React.FC<{ value: ViewMode; onChange: (v: ViewMode) => void }> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const labels: Record<ViewMode, string> = {
        monthly: 'Monthly Overview',
        yearly: 'Yearly Overview',
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-xl font-bold text-white uppercase tracking-wider hover:text-white/80 transition-colors"
            >
                {labels[value]}
                <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-2 bg-[#1e1e1e] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[200px]">
                    {(Object.entries(labels) as [ViewMode, string][]).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => { onChange(key); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                key === value ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface MonthlyOverviewProps {
    transactions: Transaction[];
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ transactions }) => {
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
        const data = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
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
        (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
        { income: 0, expense: 0 }
    ), [monthlyData]);

    // --- Yearly data ---
    const yearlyColumns = useMemo(() => {
        const sorted = [...availableYears].sort((a, b) => a - b);
        return sorted.slice(-10);
    }, [availableYears]);

    const yearlyData = useMemo(() => {
        const data = new Map<number, { income: number; expense: number }>();
        yearlyColumns.forEach(y => data.set(y, { income: 0, expense: 0 }));
        transactions.forEach(tx => {
            const year = new Date(tx.transactionDate).getFullYear();
            const entry = data.get(year);
            if (!entry) return;
            if (tx.type === 'INCOME') entry.income += tx.amount;
            else entry.expense += tx.amount;
        });
        return yearlyColumns.map(y => ({ year: y, ...data.get(y)! }));
    }, [transactions, yearlyColumns]);

    const yearlyTotals = useMemo(() => yearlyData.reduce(
        (acc, y) => ({ income: acc.income + y.income, expense: acc.expense + y.expense }),
        { income: 0, expense: 0 }
    ), [yearlyData]);

    const canGoBack = availableYears.includes(selectedYear - 1);
    const canGoForward = availableYears.includes(selectedYear + 1);

    const isMonthly = viewMode === 'monthly';
    const columns = isMonthly
        ? MONTHS.map((m, i) => ({ key: String(i), label: m }))
        : yearlyData.map(y => ({ key: String(y.year), label: String(y.year) }));

    const dataItems = isMonthly
        ? monthlyData
        : yearlyData;

    const totals = isMonthly ? monthlyTotals : yearlyTotals;

    const renderValueCell = (value: number, type: 'income' | 'expense' | 'balance', isBold = false) => {
        const hasData = value !== 0;
        let color = 'text-white/20';
        let prefix = '';

        if (hasData) {
            if (type === 'income') { color = 'text-emerald-400'; prefix = '+'; }
            else if (type === 'expense') { color = 'text-red-400'; prefix = '-'; value = Math.abs(value); }
            else { color = value >= 0 ? 'text-emerald-400' : 'text-red-400'; prefix = value >= 0 ? '+' : '-'; value = Math.abs(value); }
        }

        return (
            <span className={`text-xs md:text-sm whitespace-nowrap ${isBold ? 'font-bold' : 'font-medium'} ${color}`}>
                {hasData ? `${prefix}${formatAmount(value)}` : '—'}
            </span>
        );
    };

    return (
        <div className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10">
                <ViewModeDropdown value={viewMode} onChange={setViewMode} />

                {isMonthly && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => canGoBack && setSelectedYear(y => y - 1)}
                            disabled={!canGoBack}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-lg font-bold text-white min-w-[60px] text-center">{selectedYear}</span>
                        <button
                            onClick={() => canGoForward && setSelectedYear(y => y + 1)}
                            disabled={!canGoForward}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Table with sticky first & last columns */}
            <div className="relative">
                <div className="overflow-x-auto overview-scroll-area">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed', minWidth: `${columns.length * 90 + 100}px` }}>
                        <colgroup>
                            {/* Icon column */}
                            <col style={{ width: '44px' }} className="sticky-col-left" />
                            {/* Data columns: equal width */}
                            {columns.map(c => (
                                <col key={c.key} />
                            ))}
                            {/* Totals column */}
                            <col style={{ width: '100px' }} className="sticky-col-right" />
                        </colgroup>
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="sticky left-0 z-10 bg-[#1a1a1a] px-2 py-3"></th>
                                {columns.map(c => (
                                    <th key={c.key} className="text-center text-xs text-white/50 uppercase tracking-wider px-1 py-3 font-semibold">
                                        {c.label}
                                    </th>
                                ))}
                                <th className="sticky right-0 z-10 bg-[#1a1a1a] text-center text-xs text-white/50 uppercase tracking-wider px-2 py-3 font-bold border-l border-white/10">
                                    Tot
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Income row */}
                            <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="sticky left-0 z-10 bg-[#1a1a1a] px-2 py-3 text-center">
                                    <TrendingUp size={16} className="text-emerald-400 inline-block" />
                                </td>
                                {dataItems.map((m, i) => (
                                    <td key={i} className="text-center px-1 py-3">
                                        {renderValueCell(m.income, 'income')}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-[#1a1a1a] text-center px-2 py-3 border-l border-white/10">
                                    {renderValueCell(totals.income, 'income', true)}
                                </td>
                            </tr>

                            {/* Expense row */}
                            <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="sticky left-0 z-10 bg-[#1a1a1a] px-2 py-3 text-center">
                                    <TrendingDown size={16} className="text-red-400 inline-block" />
                                </td>
                                {dataItems.map((m, i) => (
                                    <td key={i} className="text-center px-1 py-3">
                                        {renderValueCell(m.expense, 'expense')}
                                    </td>
                                ))}
                                <td className="sticky right-0 z-10 bg-[#1a1a1a] text-center px-2 py-3 border-l border-white/10">
                                    {renderValueCell(totals.expense, 'expense', true)}
                                </td>
                            </tr>

                            {/* Balance row */}
                            <tr className="hover:bg-white/[0.02] transition-colors">
                                <td className="sticky left-0 z-10 bg-[#1a1a1a] px-2 py-3 text-center">
                                    <Scale size={16} className="text-blue-400 inline-block" />
                                </td>
                                {dataItems.map((m, i) => {
                                    const balance = m.income - m.expense;
                                    return (
                                        <td key={i} className="text-center px-1 py-3">
                                            {renderValueCell(balance, 'balance')}
                                        </td>
                                    );
                                })}
                                {(() => {
                                    const totalBalance = totals.income - totals.expense;
                                    return (
                                        <td className="sticky right-0 z-10 bg-[#1a1a1a] text-center px-2 py-3 border-l border-white/10">
                                            {renderValueCell(totalBalance, 'balance', true)}
                                        </td>
                                    );
                                })()}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
