import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import type { Transaction } from '../../utils/types.ts';
import CustomDatePicker, { type DateRangeValue } from '../../components/DataPicker/CustomDatePicker.tsx';
import { useWalletContext } from "../wallet/WalletContext.tsx";

interface TransactionsFilterProps {
    transactions: Transaction[];
    onFilterChange: (filtered: Transaction[]) => void;
}

export const TransactionsFilter: React.FC<TransactionsFilterProps> = ({ transactions, onFilterChange }) => {
    const [tagFilter, setTagFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState<DateRangeValue>({ start: null, end: null });

    const { wallet } = useWalletContext();

    const uniqueTags = useMemo(() => {
        return Array.from(new Set(transactions.map(t => t.tag.name)));
    }, [transactions]);

    useEffect(() => {
        const filtered = transactions.filter(tx => {
            if (tagFilter !== 'ALL' && tx.tag.name !== tagFilter)
                return false

            const txDate = new Date(tx.transactionDate);

            if (dateRange?.start) {
                const start = new Date(dateRange.start);
                start.setHours(0, 0, 0, 0); // Assicurati di coprire l'inizio della giornata
                if (txDate < start) return false;
            }

            if (dateRange?.end) {
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999); // Assicurati di coprire la fine della giornata
                if (txDate > end) return false;
            }
            return true;
        });

        onFilterChange(filtered);
    }, [transactions, tagFilter, dateRange]);

    return (
        <div
            className="relative z-50 flex flex-wrap items-center gap-4 mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">

            <div className="flex-1 min-w-[280px] max-w-sm">
                <CustomDatePicker
                    isRange={true}
                    color={wallet.color}
                    isDark={true}
                    onChange={(val) => setDateRange(val as DateRangeValue)}
                />
            </div>

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