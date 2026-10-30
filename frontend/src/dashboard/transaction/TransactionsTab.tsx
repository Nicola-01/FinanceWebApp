import React from "react";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

export const TransactionsTab: React.FC = () => {
  const {
    wallet,
    isLoading,
    tags,
    fetchData,
    filteredTransactions,
    pendingTransactions,
    toCategorise,
    onlyToCategorise,
  } = useWalletContext();
  const onRefresh = () => fetchData();

  return (
    <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full flex-1 relative flex flex-col">
        <div className="flex-1 flex flex-col">
          <TransactionsTable
            wallet={wallet}
            tags={tags}
            // Review mode ignores the period, tag and search filters.
            transactions={
              onlyToCategorise ? toCategorise : filteredTransactions
            }
            pendingTransactions={onlyToCategorise ? [] : pendingTransactions}
            onRefresh={onRefresh}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
