import {
    TransactionDetailsModal,
    type TransactionDetailsModalHandle
} from "../../modals/TransactionDetailsModal/TransactionDetailsModal.tsx";
import React, {useRef} from 'react';
import type {Tag, Transaction, Wallet} from '../../utils/types.ts';
import TransactionRow from "./TransactionRow.tsx";
import type {CurrencyCode} from "../../utils/currencies.ts";

interface TransactionsTableProps {
    wallet: Wallet,
    tags: Tag[],
    transactions: Transaction[],
    onRefresh: () => void,
    isLoading: boolean
}

const SkeletonDateHeader = () => (
    <div className="mb-4 mt-2 flex items-center gap-4 animate-pulse">
        <div className="h-px w-8 bg-white/10 rounded-full"></div>
        <div className="h-3 w-24 bg-white/10 rounded-full"></div>
        <div className="h-px flex-1 bg-white/10 rounded-full"></div>
    </div>
);

const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 mb-2 animate-pulse border border-white/5">
        <div className="h-10 w-10 shrink-0 rounded-full bg-white/10"></div>

        <div className="flex-1 flex flex-col gap-2.5">
            <div className="h-3.5 w-1/3 rounded-md bg-white/10"></div>
            <div className="h-2.5 w-1/4 rounded-md bg-white/5"></div>
        </div>

        <div className="h-4 w-16 rounded-md bg-white/10"></div>
    </div>
);
// ---------------------------

export const TransactionsTable: React.FC<TransactionsTableProps> = ({wallet, tags, transactions, isLoading}) => {

    const detailsModalRef = useRef<TransactionDetailsModalHandle>(null);

    // Raggruppamento per Data
    const groupedTransactions = transactions.reduce((acc, tx) => {
        if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
        acc[tx.transactionDate].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    // Ordiniamo le date in ordine decrescente (le più recenti prima)
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const formatedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        if (date.toDateString() === today.toDateString()) return `Today - ${formatedDate}`;
        if (date.toDateString() === yesterday.toDateString()) return `Yesterday - ${formatedDate}`;

        return formatedDate;
    };

    // const handleDeleteTransaction : (id: string) => {
    //     return ()
    // }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">

                {/* 1. STATO DI CARICAMENTO (Skeleton) */}
                {isLoading ? (
                        <>
                            {/* Primo blocco data con 3 transazioni */}
                            <div className="mb-6">
                                <SkeletonDateHeader/>
                                <div>
                                    <SkeletonRow/>
                                    <SkeletonRow/>
                                    <SkeletonRow/>
                                </div>
                            </div>

                            {/* Secondo blocco data con 2 transazioni */}
                            <div className="mb-6">
                                <SkeletonDateHeader/>
                                <div>
                                    <SkeletonRow/>
                                    <SkeletonRow/>
                                </div>
                            </div>
                        </>
                    ) :

                    /* 2. STATO VUOTO (Nessuna transazione) */
                    transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-white/40">
                                <p>No transactions found for this period.</p>
                            </div>
                        ) :

                        /* 3. STATO CON DATI (Transazioni reali) */
                        (
                            sortedDates.map(date => (
                                <div key={date} className="mb-6">
                                    <div className="mb-4 mt-2 flex items-center gap-4">
                                        <div className="h-px w-8 bg-white/10 rounded-full"></div>
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
                                            {formatDateHeader(date)}
                                        </h4>
                                        <div className="h-px flex-1 bg-white/10 rounded-full"></div>
                                    </div>

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

                <TransactionDetailsModal
                    ref={detailsModalRef}
                    walletId={wallet.id}
                    baseCurrency={wallet.currency as CurrencyCode}
                    walletColor={wallet.color}
                    tags={tags} onSuccess={function (): void {
                    throw new Error("Function not implemented.");
                }}                />

            </div>
        </div>
    );
};