import { useEffect, useState } from "react";
import type {
  Subscription,
  Tag,
  Transaction,
  Wallet,
  WalletDashboardData,
} from "../../types/domain";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { isAbortError } from "../../utils/apiError";
import {
  getWalletData,
  refreshWalletData,
  peek,
} from "../../api/walletDataCache";
import { syncWalletIfStale } from "../../api/bankApi";
import { listOps, SYNC_QUEUE_CHANGED } from "../../sync/opsQueue";
import type { PendingOp } from "../../utils/offlineDb";

/**
 * Served wallet data (wallet, transactions, subscriptions, tags) plus the
 * pending offline-ops queue for `_wallet`: cache-aware load on wallet switch,
 * forced reload (`fetchData`), queue sync and post-replay refetch.
 */
export function useWalletData(_wallet: Wallet) {
  const [wallet, setWallet] = useState<Wallet>(_wallet);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    showSkeleton = true,
  ) => {
    if (!_wallet?.id) return;
    try {
      if (showSkeleton) setIsLoading(true);
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

  // Forced reload (exposed on context; used by children after a mutation). Runs in
  // the background: data is already on screen, so swapping it for a skeleton would
  // flash the whole list (e.g. after categorising one import).
  const fetchData = (signal?: AbortSignal) =>
    runLoad(() => refreshWalletData(_wallet.id, signal), signal, false);

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

  // On open: pull fresh bank transactions in the background (server throttles via
  // "if stale"), then reload only if something was imported. Errors are ignored.
  useEffect(() => {
    if (navigator.onLine === false) return;
    let cancelled = false;
    syncWalletIfStale(_wallet.id)
      .then((results) => {
        if (!cancelled && results.some((r) => r.imported > 0)) fetchData();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wallet.id]);

  return {
    wallet,
    setWallet,
    transactions,
    subscriptions,
    tags,
    setTags,
    pendingOps,
    isLoading,
    fetchData,
  };
}
