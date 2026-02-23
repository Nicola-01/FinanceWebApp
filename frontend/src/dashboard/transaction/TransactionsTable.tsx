import React, { useRef } from 'react';
import type { Transaction } from '../../utils/types.ts';
import TransactionRow from "./TransactionRow.tsx";
import { TransactionDetailsModal, type TransactionDetailsModalHandle } from '../../modals/TransactionDetailsModal.tsx';

interface TransactionsTableProps {
    transactions: Transaction[];
    walletId: string;
    onRefresh: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, walletId, onRefresh }) => {
    const detailsModalRef = useRef<TransactionDetailsModalHandle>(null);

    // Raggruppamento per Data
    const groupedTransactions = transactions.reduce((acc, tx) => {
        if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
        acc[tx.transactionDate].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    // Ordiniamo le date in ordine decrescente (le più recenti prima)
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Funzione per formattare la data (CORRETTA)
    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const formatedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) return `Today - ${formatedDate}`;
        if (date.toDateString() === yesterday.toDateString()) return `Yesterday - ${formatedDate}`;

        // CORREZIONE BUG: Ritorna formatedDate invece di niente!
        return formatedDate;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Lista Raggruppata */}
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/40">
                        <p>No transactions found for this period.</p>
                    </div>
                ) : (
                    sortedDates.map(date => (
                        <div key={date} className="mb-6">
                            {/* Intestazione Data */}
                            <h4 className="sticky top-0 z-10 bg-[#141414]/95 backdrop-blur-md py-2 mb-3 text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                                {formatDateHeader(date)}
                            </h4>

                            {/* Transazioni di quel giorno */}
                            <div>
                                {groupedTransactions[date].map(tx => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        onClick={(tx) => detailsModalRef.current?.openModal(tx)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modale dei Dettagli */}
            <TransactionDetailsModal
                ref={detailsModalRef}
                walletId={walletId}
                onSuccess={onRefresh}
                onEdit={(tx) => {
                    // TODO: Per riutilizzare il CreateModal per l'editing
                    console.log("Edit requested for", tx.name);
                }}
            />
        </div>
    );
};