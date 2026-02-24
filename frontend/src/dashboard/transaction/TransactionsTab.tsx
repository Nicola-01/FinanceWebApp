import React, {useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import type {Transaction, Wallet} from '../../utils/types.ts';
import {CreateTransactionModal, type CreateTransactionModalHandle} from "../../modals/TransactionDetailsModal/CreateTransactionModal.tsx";
import type {CurrencyCode} from "../../utils/currencies.ts";
import {TransactionsTable} from "./TransactionsTable.tsx";
import {PeriodStats} from "./PeriodStats.tsx";
import {TransactionsFilter} from "./TransactionsFilter.tsx"; // <-- IMPORTA IL NUOVO COMPONENTE

interface TransactionsTabProps {
    transactions: Transaction[];
    wallet: Wallet;
    baseCurrency: CurrencyCode;
    onRefresh: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({transactions, wallet, baseCurrency, onRefresh}) => {
    const transactionModalRef = useRef<CreateTransactionModalHandle>(null);

    // Stato per salvare le transazioni filtrate restituite dal componente TransactionsFilter
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            {/* Header / Pulsante Aggiungi */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Transactions</h2>
                <button
                    onClick={() => transactionModalRef.current?.openModal()}
                    className="btn-dynamic-hover flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-black shadow-lg transition-all hover:-translate-y-0.5"
                    style={{
                        backgroundColor: wallet.color,
                        boxShadow: `0 0 20px ${wallet.color}26`
                    }}

                >
                    <FontAwesomeIcon icon={faPlus}/>
                    New Transaction
                </button>
                <CreateTransactionModal
                    ref={transactionModalRef}
                    walletId={wallet.id}
                    baseCurrency={baseCurrency}
                    onSuccess={onRefresh}
                />
            </div>

            {/* Nuovo Elemento Filtro Separato */}
            <TransactionsFilter
                transactions={transactions}
                onFilterChange={setFilteredTransactions}
            />

            {/* Statistiche del Periodo Filtrato */}
            <PeriodStats transactions={filteredTransactions}/>

            {/* Tabella con Dati Filtrati */}
            <TransactionsTable
                transactions={filteredTransactions}
                wallet={wallet}
                onRefresh={onRefresh}
            />
        </div>
    );
};