import React, { useRef } from 'react';
import {
    TransactionModal,
    type TransactionModalHandle
} from "../../modals/TransactionModal/TransactionModal.tsx";
import type { CurrencyCode } from "../../utils/currencies.ts";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { TransactionsFilter } from "./TransactionsFilter.tsx";

export const TransactionsTab: React.FC = () => {
    const { wallet, isLoading, tags, fetchData, filteredTransactions } = useWalletContext();
    const baseCurrency = wallet.currency as CurrencyCode;
    const onRefresh = () => fetchData();

    const transactionModalRef = useRef<TransactionModalHandle>(null);

    return (
        <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out]">

            {/* Modal hidden element at the top */}
            <div className="hidden">
                <TransactionModal
                    ref={transactionModalRef}
                    wallet={wallet}
                    tags={tags}
                    baseCurrency={baseCurrency}
                    onSuccess={onRefresh}
                />
            </div>

            <div className="w-full flex-1 relative">
                
                {/* 
                  Sticky container INSIDE the scrolling element natively guarantees 
                  that elements scrolling past will simply slide underneath its z-index!
                */}
                <TransactionsFilter />
                
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