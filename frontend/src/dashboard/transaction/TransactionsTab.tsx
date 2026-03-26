import React, { useRef } from 'react';
import {
    TransactionModal,
    type TransactionModalHandle
} from "../../modals/TransactionModal/TransactionModal.tsx";
import type { CurrencyCode } from "../../utils/currencies.ts";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

export const TransactionsTab: React.FC = () => {
    const { wallet, isLoading, tags, fetchData, filteredTransactions } = useWalletContext();
    const baseCurrency = wallet.currency as CurrencyCode;
    const onRefresh = () => fetchData();

    const transactionModalRef = useRef<TransactionModalHandle>(null);

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