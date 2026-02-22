import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faFilter } from '@fortawesome/free-solid-svg-icons';
import type { Transaction } from '../utils/types';
import { CreateTransactionModal, type CreateTransactionModalHandle } from "../modals/CreateTransactionModal.tsx";
import type { CurrencyCode } from "../utils/currencies.ts";
import { TransactionsTable } from "./TransactionsTable.tsx";

interface TransactionsTabProps {
    transactions: Transaction[];
    walletId: string;
    baseCurrency: CurrencyCode;
    onRefresh: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions, walletId, baseCurrency, onRefresh }) => {
    const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR' | 'CUSTOM'>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tagFilter, setTagFilter] = useState('ALL');

    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Extracts unique Tags present in transactions to populate the dropdown menu
    const uniqueTags = Array.from(new Set(transactions.map(t => t.tag.name)));

    const transactionModalRef = useRef<CreateTransactionModalHandle>(null);

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
        return currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    };

    // ACTUAL FILTERING LOGIC
    const filteredTransactions = transactions.filter(tx => {
        // 1. Tag Filter
        if (tagFilter !== 'ALL' && tx.tag.name !== tagFilter) return false;

        // 2. Date Filter
        const txDate = new Date(tx.transactionDate);
        if (viewMode === 'MONTH')
            return txDate.getMonth() === currentDate.getMonth() && txDate.getFullYear() === currentDate.getFullYear();
        if (viewMode === 'YEAR')
            return txDate.getFullYear() === currentDate.getFullYear();
        if (viewMode === 'CUSTOM') {
            if (customStartDate && txDate < new Date(customStartDate)) return false;
            if (customEndDate && txDate > new Date(customEndDate)) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Transactions</h2>
                <button
                    onClick={() => transactionModalRef.current?.openModal()}
                    className="flex items-center gap-2 rounded-xl bg-[#00ff7f] px-4 py-2.5 text-sm font-bold text-black shadow-lg shadow-[#00ff7f]/20 transition-all hover:-translate-y-0.5 hover:bg-[#00e673]">
                    <FontAwesomeIcon icon={faPlus}
                    />
                    New Transaction
                </button>
                <CreateTransactionModal
                    ref={transactionModalRef}
                    walletId={walletId}
                    baseCurrency={baseCurrency}
                    onSuccess={onRefresh}
                />
            </div>


            <div
                className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                {/* Tipo di visualizzazione (Mese, Anno, Custom) */}
                <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 border border-white/5">
                    {['MONTH', 'YEAR', 'CUSTOM'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as any)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === mode ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {/* Selettore Veloce Data (Frecce) - Nascosto se Custom */}
                {viewMode !== 'CUSTOM' && (
                    <div className="flex items-center gap-3 ml-2">
                        <button onClick={handlePrev}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                        </button>
                        <span className="w-32 text-center text-sm font-bold capitalize text-white tracking-wide">
                            {displayDate()}
                        </span>
                        <button onClick={handleNext}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                        </button>
                    </div>
                )}

                {/* Selettori Date Custom - Visibili solo se Custom */}
                {viewMode === 'CUSTOM' && (
                    <div className="flex items-center gap-2 ml-2">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                            className="bg-black/40 border border-white/10 text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff7f]" />
                        <span className="text-white/40">-</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                            className="bg-black/40 border border-white/10 text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff7f]" />
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

            <TransactionsTable transactions={filteredTransactions} />
        </div>
    );
};