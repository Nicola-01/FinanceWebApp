import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChartPie, faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';
import type {Transaction} from '../../utils/types';
import {type IconKey, ICONS} from '../../utils/icons.ts';

interface PeriodStatsProps {
    transactions: Transaction[],
    isLoading: boolean
}

// --- COMPONENTE SKELETON PER GLI IMPORTI ---
const SkeletonAmount = () => (
    <div className="h-7 w-24 bg-app-surface rounded-md animate-pulse mx-auto mt-0.5"></div>
);

export const PeriodStats: React.FC<PeriodStatsProps> = ({transactions, isLoading}) => {
    const [showDistribution, setShowDistribution] = useState(false);

    // 1. Calcolo Totali
    const totals = transactions.reduce(
        (acc, tx) => {
            if (tx.type === 'INCOME') acc.income += tx.amount;
            else if (tx.type === 'EXPENSE') acc.expense += tx.amount;
            return acc;
        },
        {income: 0, expense: 0}
    );
    const netTotal = totals.income - totals.expense;

    // 2. Raggruppamento per Tag
    const tagStats = transactions.reduce((acc, tx) => {
        if (!acc[tx.tag.name]) {
            acc[tx.tag.name] = {income: 0, expense: 0, color: tx.tag.colorHex, icon: tx.tag.icon};
        }
        if (tx.type === 'INCOME') acc[tx.tag.name].income += tx.amount;
        if (tx.type === 'EXPENSE') acc[tx.tag.name].expense += tx.amount;
        return acc;
    }, {} as Record<string, { income: number; expense: number; color: string; icon: string }>);

    // 3. Divisione e Ordinamento: Entrate da una parte, Uscite dall'altra
    const incomeTags = Object.entries(tagStats)
        .filter(([, stats]) => stats.income > 0)
        .sort(([, a], [, b]) => b.income - a.income);

    const expenseTags = Object.entries(tagStats)
        .filter(([, stats]) => stats.expense > 0)
        .sort(([, a], [, b]) => b.expense - a.expense);

    return (
        <div className="mb-6 flex flex-col gap-3 animate-[fadeIn_0.3s_ease-out]">

            <div className="flex items-center justify-between">
                <h3 className="text-white/80 font-bold text-sm">Period Overview</h3>
                {!isLoading && transactions.length > 0 && (
                    <button
                        onClick={() => setShowDistribution(!showDistribution)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-input border border-app-border text-app-muted hover:text-white hover:bg-app-surface transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <FontAwesomeIcon icon={faChartPie}/>
                        {showDistribution ? 'Hide Details' : 'Show Details'}
                        <FontAwesomeIcon icon={showDistribution ? faChevronUp : faChevronDown}/>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">

                <div className="bg-black/20 border border-app-border rounded-2xl p-4 flex flex-col transition-all">
                    <div className="text-center">
                        <p className="text-app-muted text-xs font-bold uppercase tracking-widest mb-1">Period Income</p>
                        {isLoading ? (
                            <SkeletonAmount />
                        ) : (
                            <p className="text-[#00ff7f] font-bold font-app-mono text-xl">+{totals.income.toFixed(2)}</p>
                        )}
                    </div>

                    {!isLoading && showDistribution && incomeTags.length > 0 && (
                        <div
                            className="mt-4 pt-4 border-t border-app-border flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
                            {incomeTags.map(([tagName, stats]) => {
                                const percentage = totals.income > 0 ? (stats.income / totals.income) * 100 : 0;
                                return (
                                    <div key={tagName} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1.5 font-medium"
                                                 style={{color: stats.color}}>
                                                <FontAwesomeIcon icon={ICONS[stats.icon as IconKey] || 'tag'}/>
                                                <span className="truncate max-w-[100px]">{tagName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-app-mono text-white/80">
                                                {stats.income.toFixed(2)}
                                                <span
                                                    className="text-white/30 text-[10px] w-8 text-right">{percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-app-input rounded-full h-1 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                 style={{width: `${percentage}%`, backgroundColor: stats.color}}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-black/20 border border-app-border rounded-2xl p-4 flex flex-col transition-all">
                    <div className="text-center">
                        <p className="text-app-muted text-xs font-bold uppercase tracking-widest mb-1">Period Expense</p>
                        {isLoading ? (
                            <SkeletonAmount />
                        ) : (
                            <p className="text-[#ff4d4d] font-bold font-app-mono text-xl">-{totals.expense.toFixed(2)}</p>
                        )}
                    </div>

                    {!isLoading && showDistribution && expenseTags.length > 0 && (
                        <div
                            className="mt-4 pt-4 border-t border-app-border flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
                            {expenseTags.map(([tagName, stats]) => {
                                const percentage = totals.expense > 0 ? (stats.expense / totals.expense) * 100 : 0;
                                return (
                                    <div key={tagName} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-1.5 font-medium"
                                                 style={{color: stats.color}}>
                                                <FontAwesomeIcon icon={ICONS[stats.icon as IconKey] || 'tag'}/>
                                                <span className="truncate max-w-[100px]">{tagName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 font-app-mono text-white/80">
                                                {stats.expense.toFixed(2)}
                                                <span
                                                    className="text-white/30 text-[10px] w-8 text-right">{percentage.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-app-input rounded-full h-1 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                 style={{width: `${percentage}%`, backgroundColor: stats.color}}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-app-input border sm:col-span-2 lg:col-auto border-app-border rounded-2xl p-4 flex flex-col text-center justify-center min-h-19">
                    <p className="text-app-muted text-xs font-bold uppercase tracking-widest mb-1">Net Balance</p>
                    {isLoading ? (
                        <SkeletonAmount />
                    ) : (
                        <p className={`font-bold font-app-mono text-xl ${netTotal >= 0 ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                            {netTotal >= 0 ? '+' : ''}{netTotal.toFixed(2)}
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};