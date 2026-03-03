import React, {useRef, useState} from 'react';
import type {Tag, Transaction, Wallet} from '../../utils/types.ts';
import {
    CreateTransactionModal,
    type CreateTransactionModalHandle
} from "../../modals/TransactionModal/CreateTransactionModal.tsx";
import type {CurrencyCode} from "../../utils/currencies.ts";
import {TransactionsTable} from "./TransactionsTable.tsx";
import {TransactionsFilter} from "./TransactionsFilter.tsx";

interface TransactionsTabProps {
    transactions: Transaction[],
    wallet: Wallet,
    baseCurrency: CurrencyCode,
    onRefresh: () => void,
    isLoading: boolean,
    tags: Tag[]
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
                                                                    transactions,
                                                                    wallet,
                                                                    baseCurrency,
                                                                    onRefresh,
                                                                    isLoading,
                                                                    tags
                                                                }) => {
    const transactionModalRef = useRef<CreateTransactionModalHandle>(null);

    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);

    return (
        <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-6">
                <CreateTransactionModal
                    ref={transactionModalRef}
                    wallet={wallet}
                    tags={tags}
                    baseCurrency={baseCurrency}
                    onSuccess={onRefresh}
                />
            </div>

            <TransactionsFilter
                transactions={transactions}
                onFilterChange={setFilteredTransactions}
            />

            {/*<PeriodStats transactions={filteredTransactions} isLoading={isLoading}/>*/}

            <TransactionsTable
                wallet={wallet}
                tags={tags}
                transactions={filteredTransactions}
                onRefresh={onRefresh}
                isLoading={isLoading}
            />
        </div>
    );
};