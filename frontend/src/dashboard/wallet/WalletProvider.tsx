import React, { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { Wallet } from "../../types/domain";
import { applyPendingOps } from "../../sync/overlay";
import { WalletContext } from "./WalletContext.tsx";
import { VALID_TABS, type TabType } from "./walletTabs";
import { selectPendingTransactions } from "./pendingTransactions";
import { selectToCategorize } from "./toCategorize";
import {
  filterTransactions,
  useTransactionFilters,
} from "./useTransactionFilters";
import { useWalletData } from "./useWalletData";
import { useWalletMutations } from "./useWalletMutations";

interface WalletProviderProps {
  _wallet: Wallet;
  onWalletDelete: () => void;
  onWalletUpdate: () => void;
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  _wallet,
  onWalletDelete,
  onWalletUpdate,
  children,
}) => {
  // Hook order matters: it fixes the effect order (search debounce → tab
  // redirect → data load → pending-ops queue → post-sync refetch).
  const {
    selectedTags,
    setSelectedTags,
    dateRange,
    setDateRange,
    datePreset,
    setDatePreset,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    onlyToCategorise,
    setOnlyToCategorise,
  } = useTransactionFilters();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType;
  const activeTab: TabType = VALID_TABS.includes(urlTab)
    ? urlTab
    : "transactions";

  useEffect(() => {
    if (!urlTab || !VALID_TABS.includes(urlTab)) {
      setSearchParams({ tab: "transactions" }, { replace: true });
    }
  }, [urlTab, setSearchParams]);

  const setActiveTab = (newTab: TabType) => {
    setSearchParams({ tab: newTab });
  };

  const {
    wallet,
    setWallet,
    transactions,
    subscriptions,
    tags,
    setTags,
    pendingOps,
    isLoading,
    fetchData,
  } = useWalletData(_wallet);

  // Overlay the pending offline-ops queue onto the served data so unsynced
  // creates/updates/deletes render immediately (flagged with syncState). With an
  // empty queue this returns the exact same references (Task 7 identity), so the
  // online view is unchanged.
  const overlaid = useMemo(
    () =>
      applyPendingOps(
        { wallet, transactions, subscriptions, tags },
        pendingOps,
      ),
    [wallet, transactions, subscriptions, tags, pendingOps],
  );

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(overlaid.transactions, overlaid.tags, {
        selectedTags,
        dateRange,
        // The text search only applies on the Transactions tab. Elsewhere (e.g.
        // Categories) the query is preserved but NOT applied — the charts show all
        // transactions — and it re-applies when the user returns to Transactions.
        query: activeTab === "transactions" ? debouncedQuery : "",
      }),
    [
      overlaid.transactions,
      overlaid.tags,
      selectedTags,
      dateRange,
      debouncedQuery,
      activeTab,
    ],
  );

  const pendingTransactions = useMemo(
    () => selectPendingTransactions(transactions),
    [transactions],
  );

  const toCategorise = useMemo(
    () => selectToCategorize(overlaid.transactions),
    [overlaid.transactions],
  );

  const { handleAddTag, handleUpdateTag, handleDeleteTag, handleUpdateWallet } =
    useWalletMutations({ wallet, tags, setWallet, setTags, onWalletUpdate });

  return (
    <WalletContext.Provider
      value={{
        wallet: overlaid.wallet,
        transactions: overlaid.transactions,
        filteredTransactions,
        pendingTransactions,
        toCategorise,
        onlyToCategorise: onlyToCategorise && toCategorise.length > 0,
        setOnlyToCategorise,
        subscriptions: overlaid.subscriptions,
        tags: overlaid.tags,
        isLoading,
        activeTab,
        setActiveTab,
        fetchData,
        selectedTags,
        setSelectedTags,
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,
        datePreset,
        setDatePreset,
        handleAddTag,
        handleUpdateTag,
        handleDeleteTag,
        handleUpdateWallet,
        onWalletDelete,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
