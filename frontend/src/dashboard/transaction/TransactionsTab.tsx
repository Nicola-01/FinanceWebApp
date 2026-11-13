import React from "react";
import { TransactionsTable } from "./TransactionsTable.tsx";
import { ComingUpColumn } from "./ComingUpColumn.tsx";
import { getComingUp } from "./comingUp.ts";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts"; // ui-v2-switch
import type { CurrencyCode } from "../../utils/currencies/meta.ts";

export const TransactionsTab: React.FC = () => {
  const [ui] = useUiVersion(); // ui-v2-switch
  const {
    wallet,
    isLoading,
    tags,
    fetchData,
    filteredTransactions,
    pendingTransactions,
    toCategorise,
    onlyToCategorise,
    subscriptions,
  } = useWalletContext();
  const onRefresh = () => fetchData();

  const table = (
    <TransactionsTable
      wallet={wallet}
      tags={tags}
      // Review mode ignores the period, tag and search filters.
      transactions={onlyToCategorise ? toCategorise : filteredTransactions}
      pendingTransactions={onlyToCategorise ? [] : pendingTransactions}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  );

  // ui-v2-switch: "Coming up" side column, wide screens only (D18); not in review mode.
  const showComingUp = ui === "v2" && !onlyToCategorise;

  return (
    <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full flex-1 relative flex flex-col">
        {showComingUp ? (
          <div className="grid gap-3.5 min-[1280px]:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex-1 flex flex-col min-w-0">{table}</div>
            <div className="hidden min-[1280px]:block">
              <ComingUpColumn
                items={getComingUp(subscriptions)}
                currency={wallet.currency as CurrencyCode}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">{table}</div>
        )}
      </div>
    </div>
  );
};
