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
import * as walletOps from "../../api/walletOps";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle, isAbortError } from "../../utils/apiError";
import {
  getWalletData,
  refreshWalletData,
  peek,
  invalidate,
} from "../../api/walletDataCache";
import { applyPendingOps } from "../../sync/overlay";
import { listOps, SYNC_QUEUE_CHANGED } from "../../sync/opsQueue";
import type { PendingOp } from "../../utils/offlineDb";
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
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
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

  const filteredTransactions = useMemo(() => {
    // Fallback active-tag set is derived from the OVERLAID tags (not raw `tags`)
    // so a transaction whose category was created offline — a tag that only
    // exists in the overlay — isn't filtered out and made to "vanish".
    const currentActiveTags = selectedTags ?? overlaid.tags.map((t) => t.name);
    // The text search only applies on the Transactions tab. Elsewhere (e.g.
    // Categories) the query is preserved but NOT applied — the charts show all
    // transactions — and it re-applies when the user returns to Transactions.
    const q =
      activeTab === "transactions" ? debouncedQuery.trim().toLowerCase() : "";

    return overlaid.transactions.filter((tx) => {
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
  }, [
    overlaid.transactions,
    overlaid.tags,
    selectedTags,
    dateRange,
    debouncedQuery,
    activeTab,
  ]);

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

  // Load the pending-ops queue for the active wallet and keep it in sync: any
  // enqueue/replay dispatches SYNC_QUEUE_CHANGED, which re-reads the queue.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      listOps(_wallet.id).then((o) => alive && setPendingOps(o));
    refresh();
    window.addEventListener(SYNC_QUEUE_CHANGED, refresh);
    return () => {
      alive = false;
      window.removeEventListener(SYNC_QUEUE_CHANGED, refresh);
    };
  }, [_wallet.id]);

  // When the offline queue finishes replaying, refetch the active wallet so the
  // authoritative server state replaces the optimistic overlay.
  useEffect(() => {
    const onSynced = () => fetchData();
    window.addEventListener("offline-sync-complete", onSynced);
    return () => window.removeEventListener("offline-sync-complete", onSynced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wallet.id]);

  const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
    try {
      const res = await walletOps.createTag(
        wallet.id,
        newTag as Record<string, unknown>,
      );
      // Offline: the overlay renders the queued create (SYNC_QUEUE_CHANGED →
      // pendingOps), so skip the local mutation and flag it as saved offline.
      if (!res.queued) {
        setTags((prev) => [...prev, res.data as Tag]);
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Tag created successfully!",
        true,
      );
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
      const base = tags.find((t) => t.name === oldName);
      const res = await walletOps.updateTag(
        wallet.id,
        oldName,
        updatedTag as Record<string, unknown>,
        base?.updatedAt ?? null,
      );

      if (!res.queued) {
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
      }
      invalidate(wallet.id);
      if (res.queued) {
        triggerToast("Saved offline — will sync when you're back online", true);
      }

      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating tag"), false);
      return false;
    }
  };

  const handleDeleteTag = async (tagName: string): Promise<boolean> => {
    try {
      const base = tags.find((t) => t.name === tagName);
      const res = await walletOps.deleteTag(
        wallet.id,
        tagName,
        base?.updatedAt ?? null,
      );
      if (!res.queued) {
        setTags((prev) =>
          prev.filter(
            (tag) => tag.name !== tagName && tag.parentName !== tagName,
          ),
        );
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Tag deleted!",
        true,
      );
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
      const res = await walletOps.updateWallet(
        wallet.id,
        updatedInfo as Record<string, unknown>,
      );
      if (!res.queued) {
        setWallet(res.data as Wallet);
      }
      invalidate(wallet.id);
      triggerToast(
        res.queued
          ? "Saved offline — will sync when you're back online"
          : "Wallet updated successfully!",
        true,
      );
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
        wallet: overlaid.wallet,
        transactions: overlaid.transactions,
        filteredTransactions,
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
