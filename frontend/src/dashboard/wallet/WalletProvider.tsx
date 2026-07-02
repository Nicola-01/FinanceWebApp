import React, { useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { Subscription, Tag, Transaction, Wallet } from "../../utils/types";
import type {
  DateRangeValue,
  PresetType,
} from "../../components/DataPicker/CustomDatePicker.tsx";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle, isAbortError } from "../../utils/apiError";
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

  const filteredTransactions = useMemo(() => {
    const currentActiveTags = selectedTags ?? tags.map((t) => t.name);

    return transactions.filter((tx) => {
      if (!currentActiveTags.includes(tx.tag.name)) return false;

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
  }, [transactions, tags, selectedTags, dateRange]);

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

  useEffect(() => {
    const controller = new AbortController();

    setWallet(_wallet);
    setTransactions([]);
    setSubscriptions([]);
    setTags([]);

    fetchData(controller.signal);

    return () => {
      controller.abort();
    };
    // Reset + reload solo al cambio di wallet (_wallet.id). Intenzionalmente NON
    // ri-eseguito su altri campi di _wallet né sull'identità di fetchData (che
    // dipende solo da _wallet.id/name), per evitare refetch spurii.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wallet.id]);

  const fetchData = async (signal?: AbortSignal) => {
    if (!_wallet?.id) return;
    try {
      setIsLoading(true);

      const [walletRes, transactionRes, subscriptionRes, tagRes] =
        await Promise.all([
          api.get(`/wallets/${_wallet.id}`, { signal }),
          api.get(`/transactions/${_wallet.id}`, { signal }),
          api.get(`/subscription/${_wallet.id}`, { signal }),
          api.get(`/tags/${_wallet.id}`, { signal }),
        ]);

      setWallet(walletRes.data);
      setTransactions(transactionRes.data);
      setSubscriptions(subscriptionRes.data);
      setTags(tagRes.data);
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

  const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
    try {
      const response = await api.post(`/tags/${wallet.id}`, newTag);
      setTags((prev) => [...prev, response.data]);
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
