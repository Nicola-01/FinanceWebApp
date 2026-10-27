import React from "react";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { selectToCategorize } from "../wallet/toCategorize";

export const TransactionsTab: React.FC = () => {
  const {
    wallet,
    isLoading,
    tags,
    fetchData,
    transactions,
    filteredTransactions,
    pendingTransactions,
  } = useWalletContext();
  const onRefresh = () => fetchData();

  return (
    <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full flex-1 relative flex flex-col">
        <div className="flex-1 flex flex-col">
          <TransactionsTable
            wallet={wallet}
            tags={tags}
            transactions={filteredTransactions}
            pendingTransactions={pendingTransactions}
            toCategorize={selectToCategorize(transactions)}
            onRefresh={onRefresh}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
