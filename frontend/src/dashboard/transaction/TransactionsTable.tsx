import {
    TransactionDetailsModal,
    type TransactionDetailsModalHandle
} from "../../modals/TransactionModal/TransactionDetailsModal.tsx";
import {
    TransactionModal,
    type TransactionModalHandle
} from "../../modals/TransactionModal/TransactionModal.tsx";
import React, {useRef} from 'react';
import type {Tag, Transaction, Wallet} from '../../utils/types.ts';
import TransactionRow from "./TransactionRow.tsx";
import api from "../../api/axiosConfig.ts";
import {triggerToast} from "../../components/ToastNotification.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus, faReceipt} from "@fortawesome/free-solid-svg-icons"; // Aggiunta icona per l'empty state
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

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
                                                                        wallet,
                                                                        tags,
                                                                        transactions,
                                                                        isLoading,
                                                                        onRefresh
                                                                    }) => {

    const detailsModalRef = useRef<TransactionDetailsModalHandle>(null);
    const transactionModalRef = useRef<TransactionModalHandle>(null);

    // Raggruppamento per Data
    const groupedTransactions = transactions.reduce((acc, tx) => {
        if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
        acc[tx.transactionDate].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    // Ordiniamo le date in ordine decrescente
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

    const onSuccessDelete = async (id: string) => {
        try {
            await api.delete(`/transactions/${wallet.id}/${id}`);
            onRefresh(); // Più sicuro chiamare il refresh dal padre che mutare l'array localmente
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error deleting transaction", false);
            return false;
        }
    }

    // @ ts-ignore
    // const onSuccessUpdate = async (updatedTransaction: Transaction) => {
    //     onRefresh(); // Come sopra, ricarichiamo i dati aggiornati
    // }

    return (
        <div className="flex flex-col h-full">

            {/* AZIONE PRINCIPALE: Ora è isolata, allineata a destra come da design */}
            {!isLoading && (
                <div className="my-4 mt-2 w-full">
                    <button
                        onClick={() => transactionModalRef.current?.openModal()}
                        className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-transparent p-4 text-white/50 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
                    >
                        {/* Icona circolare che simula la categoria della transazione */}
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition-all group-hover:bg-white/10 group-hover:scale-105"
                            style={{color: wallet.color}}>
                            <FontAwesomeIcon icon={faPlus}/>
                        </div>

                        {/* Testo allineato come il nome della transazione */}
                        <div className="flex-1 text-left font-bold tracking-wide">
                            Add New Transaction
                        </div>
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">

                {/* 1. STATO DI CARICAMENTO */}
                {isLoading ? (
                        <>
                            <div className="mb-6">
                                <SkeletonDateHeader/>
                                <div>
                                    <SkeletonRow/>
                                    <SkeletonRow/>
                                    <SkeletonRow/>
                                </div>
                            </div>
                        </>
                    ) :

                    /* 2. STATO VUOTO (Nessuna transazione) - Migliorato visivamente */
                    transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-white/40">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                    <FontAwesomeIcon icon={faReceipt} className="text-2xl opacity-50"/>
                                </div>
                                <p className="text-sm font-medium">No transactions found for this period.</p>
                                <p className="mt-1 text-xs opacity-60">Click "New Transaction" to add your first one.</p>
                            </div>
                        ) :

                        /* 3. STATO CON DATI */
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

                                    {/* RIMOSSO IL GAP-2 PER ATTACCARE GLI ELEMENTI */}
                                    <div className="flex flex-col">
                                        {groupedTransactions[date].map((tx, index, array) => (
                                            <TransactionRow
                                                key={tx.id}
                                                transaction={tx}
                                                onClick={(tx) => detailsModalRef.current?.openModal(tx)}
                                                isFirst={index === 0}
                                                isLast={index === array.length - 1}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )
                }

                {/* MODALS */}
                <TransactionDetailsModal
                    ref={detailsModalRef}
                    wallet={wallet}
                    handleDeleteSuccess={onSuccessDelete}
                    onEditRequest={(tx) => {
                        transactionModalRef.current?.openModal(tx);
                    }}
                />

                <TransactionModal
                    ref={transactionModalRef}
                    wallet={wallet}
                    tags={tags}
                    baseCurrency={wallet.currency as CurrencyCode}
                    onSuccess={onRefresh}
                />

            </div>
        </div>
    );
};