import React, { useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  Subscription,
  Tag,
  Transaction,
  Wallet,
  WalletDashboardData,
} from "../../utils/types";
import type {
  DateRangeValue,
  PresetType,
} from "../../components/DataPicker/CustomDatePicker.tsx";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle, isAbortError } from "../../utils/apiError";
import {
  getWalletData,
  refreshWalletData,
  peek,
  invalidate,
} from "../../api/walletDataCache";
import { WalletContext } from "./WalletContext.tsx";
import { VALID_TABS, type TabType } from "./walletTabs";

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
  const [wallet, setWallet] = useState<Wallet>(_wallet);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedTags, setSelectedTags] = useState<string[] | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });
  const [datePreset, setDatePreset] = useState<PresetType>("month");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // The input stays bound to `searchQuery` (instant); filtering is driven by a
  // debounced copy so typing stays smooth on large transaction lists.
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType;
  const activeTab: TabType = VALID_TABS.includes(urlTab)
    ? urlTab
    : "transactions";

  const filteredTransactions = useMemo(() => {
    const currentActiveTags = selectedTags ?? tags.map((t) => t.name);
    // The text search only applies on the Transactions tab. Elsewhere (e.g.
    // Categories) the query is preserved but NOT applied — the charts show all
    // transactions — and it re-applies when the user returns to Transactions.
    const q =
      activeTab === "transactions" ? debouncedQuery.trim().toLowerCase() : "";

    return transactions.filter((tx) => {
      if (!currentActiveTags.includes(tx.tag.name)) return false;

      // Free-text search over the transaction name, its tag and notes.
      if (q) {
        const haystack =
          `${tx.name ?? ""} ${tx.tag?.name ?? ""} ${tx.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      const txDate = new Date(tx.transactionDate);

      if (dateRange?.start) {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }

      if (dateRange?.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
      return true;
    });
  }, [transactions, tags, selectedTags, dateRange, debouncedQuery, activeTab]);

  useEffect(() => {
    if (!urlTab || !VALID_TABS.includes(urlTab)) {
      setSearchParams({ tab: "transactions" }, { replace: true });
    }
  }, [urlTab, setSearchParams]);

  const setActiveTab = (newTab: TabType) => {
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    const controller = new AbortController();

    setWallet(_wallet);

    const cached = peek(_wallet.id);
    if (cached) {
      // Cache hit: render instantly, no spinner, zero requests. Reset the flag
      // explicitly: a prior aborted load may have left isLoading stuck true
      // (runLoad's finally skips setIsLoading(false) when the signal aborted).
      applyData(cached);
      setIsLoading(false);
      return () => controller.abort();
    }

    // Cache miss: clear stale view, then debounce the fetch so wallets the
    // user quickly skips past never hit the network.
    setTransactions([]);
    setSubscriptions([]);
    setTags([]);

    const timer = setTimeout(() => {
      loadData(controller.signal);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Reset + reload only on wallet change (_wallet.id). Intentionally not
    // re-run on other _wallet fields nor on loadData identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wallet.id]);

  const applyData = (data: WalletDashboardData) => {
    setWallet(data.wallet);
    setTransactions(data.transactions);
    setSubscriptions(data.subscriptions);
    setTags(data.tags);
  };

  const runLoad = async (
    fetcher: () => Promise<WalletDashboardData>,
    signal?: AbortSignal,
  ) => {
    if (!_wallet?.id) return;
    try {
      setIsLoading(true);
      const data = await fetcher();
      applyData(data);
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      triggerToast(`Error loading data for ${_wallet.name}`, false);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Cache-aware load (mount / wallet switch): serves fresh cache, else fetches.
  const loadData = (signal?: AbortSignal) =>
    runLoad(() => getWalletData(_wallet.id, signal), signal);

  // Forced reload (exposed on context; used by children after a mutation).
  const fetchData = (signal?: AbortSignal) =>
    runLoad(() => refreshWalletData(_wallet.id, signal), signal);

  const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
    try {
      const response = await api.post(`/tags/${wallet.id}`, newTag);
      setTags((prev) => [...prev, response.data]);
      invalidate(wallet.id);
      triggerToast("Tag created successfully!", true);
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error creating tag"), false);
      return false;
    }
  };

  const handleUpdateTag = async (
    oldName: string,
    updatedTag: Partial<Tag>,
  ): Promise<boolean> => {
    try {
      await api.put(
        `/tags/${wallet.id}/${encodeURIComponent(oldName)}`,
        updatedTag,
      );

      setTags((prev) =>
        prev.map((tag) => {
          if (tag.name === oldName) {
            return { ...tag, ...updatedTag } as Tag;
          }
          if (
            tag.parentName === oldName &&
            updatedTag.name &&
            updatedTag.name !== oldName
          ) {
            return { ...tag, parentName: updatedTag.name };
          }
          return tag;
        }),
      );
      invalidate(wallet.id);

      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating tag"), false);
      return false;
    }
  };

  const handleDeleteTag = async (tagName: string): Promise<boolean> => {
    try {
      await api.delete(`/tags/${wallet.id}/${encodeURIComponent(tagName)}`);
      setTags((prev) =>
        prev.filter(
          (tag) => tag.name !== tagName && tag.parentName !== tagName,
        ),
      );
      invalidate(wallet.id);
      triggerToast("Tag deleted!", true);
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting tag"), false);
      return false;
    }
  };

  const handleUpdateWallet = async (
    updatedInfo: Partial<Wallet>,
  ): Promise<boolean> => {
    try {
      const res = await api.put(`/wallets/${wallet.id}`, updatedInfo);
      setWallet(res.data);
      invalidate(wallet.id);
      triggerToast("Wallet updated successfully!", true);
      onWalletUpdate();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating wallet"), false);
      return false;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        filteredTransactions,
        subscriptions,
        tags,
        isLoading,
        activeTab,
        setActiveTab,
        fetchData,
        selectedTags,
        setSelectedTags,
        dateRange,
        setDateRange,
        datePreset,
        setDatePreset,
        searchQuery,
        setSearchQuery,
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
