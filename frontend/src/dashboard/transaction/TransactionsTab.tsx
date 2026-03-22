import React, { useRef, useState } from 'react';
import type { Transaction } from '../../utils/types.ts';
import {
    TransactionModal,
    type TransactionModalHandle
} from "../../modals/TransactionModal/TransactionModal.tsx";
import type { CurrencyCode } from "../../utils/currencies.ts";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { TransactionsFilter } from "./TransactionsFilter.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

export const TransactionsTab: React.FC = () => {
    const { transactions, wallet, isLoading, tags, fetchData } = useWalletContext();
    const baseCurrency = wallet.currency as CurrencyCode;
    const onRefresh = () => fetchData();

    const transactionModalRef = useRef<TransactionModalHandle>(null);

    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);

    return (
        <div className="flex flex-col flex-1 h-full xl:overflow-hidden animate-[fadeIn_0.3s_ease-out]">

            <div className="flex items-center justify-between mb-6">
                <TransactionModal
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

            <div className="w-full xl:flex-1 xl:overflow-y-auto custom-scrollbar xl:pr-2">
                <TransactionsTable
                    wallet={wallet}
                    tags={tags}
                    transactions={filteredTransactions}
                    onRefresh={onRefresh}
                    isLoading={isLoading}
                />
            </div>

        </div>
    );
};