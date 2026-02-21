import React, {useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus, faChevronLeft, faChevronRight, faFilter} from '@fortawesome/free-solid-svg-icons';
import type {Transaction} from '../utils/types';
import {CreateTransactionModal, type CreateTransactionModalHandle} from "../modals/CreateTransactionModal.tsx";
import type {CurrencyCode} from "../utils/currencies.ts";

interface TransactionsTabProps {
    transactions: Transaction[];
    walletId: string;
    baseCurrency: CurrencyCode;
    onRefresh: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({transactions, walletId, baseCurrency, onRefresh}) => {
    const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR' | 'CUSTOM'>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tagFilter, setTagFilter] = useState('ALL');

    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Estrae i Tag unici presenti nelle transazioni per popolare il menu a tendina
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
        return currentDate.toLocaleDateString('it-IT', {month: 'long', year: 'numeric'});
    };

    // LOGICA DI FILTRAGGIO REALE
    const filteredTransactions = transactions.filter(tx => {
        // 1. Filtro Tag
        if (tagFilter !== 'ALL' && tx.tag.name !== tagFilter) return false;

        // 2. Filtro Data
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
                            <FontAwesomeIcon icon={faChevronLeft} className="text-xs"/>
                        </button>
                        <span className="w-32 text-center text-sm font-bold capitalize text-white tracking-wide">
                            {displayDate()}
                        </span>
                        <button onClick={handleNext}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faChevronRight} className="text-xs"/>
                        </button>
                    </div>
                )}

                {/* Selettori Date Custom - Visibili solo se Custom */}
                {viewMode === 'CUSTOM' && (
                    <div className="flex items-center gap-2 ml-2">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
                               className="bg-black/40 border border-white/10 text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff7f]"/>
                        <span className="text-white/40">-</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                               className="bg-black/40 border border-white/10 text-sm text-white rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff7f]"/>
                    </div>
                )}

                {/* Filtro Tag Dinamico */}
                <div className="ml-auto flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilter} className="text-white/40 text-xs"/>
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

            <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-[#141414]/90 backdrop-blur-md border-b border-white/10">

                    <tr>
                        <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Date</th>
                        <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Name</th>
                        <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Tag</th>
                        <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40 text-right">Amount</th>
                    </tr>

                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="transition-colors hover:bg-white/5 group">
                            <td className="p-4 text-sm text-white/60 font-mono">{tx.transactionDate}</td>
                            <td className="p-4 text-sm font-semibold text-white">{tx.name}</td>
                            <td className="p-4">
                                    <span
                                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold"
                                        style={{
                                            backgroundColor: `${tx.tag.colorHex}15`,
                                            color: tx.tag.colorHex,
                                            border: `1px solid ${tx.tag.colorHex}30`
                                        }}
                                    >
                                        <span>{tx.tag.icon}</span> {tx.tag.name}
                                    </span>
                            </td>
                            <td className={`p-4 text-right text-sm font-bold font-mono ${tx.type === 'INCOME' ? 'text-[#00ff7f]' : 'text-white'}`}>
                                {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-white/40">No transactions found for this
                                period/filter.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};