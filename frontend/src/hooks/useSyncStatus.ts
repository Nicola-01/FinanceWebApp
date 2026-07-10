import { useCallback, useEffect, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  listOps,
  countByStatus,
  updateOp,
  removeOp,
  SYNC_QUEUE_CHANGED,
} from "../sync/opsQueue";
import { replaySync, OFFLINE_SYNC_COMPLETE } from "../sync/replay";
import { invalidate } from "../api/walletDataCache";
import type { OpStatus, PendingOp } from "../utils/offlineDb";

const EMPTY_COUNTS: Record<OpStatus, number> = {
  pending: 0,
  syncing: 0,
  failed: 0,
  conflict: 0,
};

export interface SyncStatus {
  /** Live browser connectivity. */
  online: boolean;
  /** True while a replay pass is in flight (drives the badge pulse). */
  syncing: boolean;
  counts: Record<OpStatus, number>;
  ops: PendingOp[];
  /** Drain the queue now (replaySync). */
  syncNow: () => Promise<void>;
  /** Reset a failed op to pending and replay. */
  retryOp: (op: PendingOp) => Promise<void>;
  /** Drop an op and let the provider refetch the server truth. */
  discardOp: (op: PendingOp) => Promise<void>;
  /** Resolve a conflict op: keep the local edit ("mine") or the server's ("theirs"). */
  resolveConflict: (op: PendingOp, choice: "mine" | "theirs") => Promise<void>;
}

/**
 * Reads the offline mutation queue and exposes the actions the sync UI needs.
 * Refreshes on `SYNC_QUEUE_CHANGED` (a mutation touched the queue) and on
 * `OFFLINE_SYNC_COMPLETE` (a replay pass finished — also clears `syncing`).
 */
export function useSyncStatus(): SyncStatus {
  const online = useOnlineStatus();
  const [counts, setCounts] = useState<Record<OpStatus, number>>(EMPTY_COUNTS);
  const [ops, setOps] = useState<PendingOp[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [nextOps, nextCounts] = await Promise.all([
      listOps(),
      countByStatus(),
    ]);
    setOps(nextOps);
    setCounts(nextCounts);
  }, []);

  useEffect(() => {
    void refresh();
    const onQueueChanged = () => void refresh();
    const onComplete = () => {
      setSyncing(false);
      void refresh();
    };
    window.addEventListener(SYNC_QUEUE_CHANGED, onQueueChanged);
    window.addEventListener(OFFLINE_SYNC_COMPLETE, onComplete);
    return () => {
      window.removeEventListener(SYNC_QUEUE_CHANGED, onQueueChanged);
      window.removeEventListener(OFFLINE_SYNC_COMPLETE, onComplete);
    };
  }, [refresh]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await replaySync();
    } finally {
      // Safety net: replaySync no-ops (without dispatching OFFLINE_SYNC_COMPLETE)
      // when offline or already running, so clear the flag ourselves too.
      setSyncing(false);
    }
  }, []);

  const retryOp = useCallback(
    async (op: PendingOp) => {
      if (op.id === undefined) return;
      await updateOp(op.id, { status: "pending" });
      await syncNow();
    },
    [syncNow],
  );

  const discardOp = useCallback(async (op: PendingOp) => {
    if (op.id === undefined) return;
    await removeOp(op.id);
    // Drop the stale cache and nudge WalletProvider to refetch the server truth.
    invalidate(op.walletId);
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_COMPLETE, {
        detail: { synced: 0, failed: 0, conflicts: 0 },
      }),
    );
  }, []);

  const resolveConflict = useCallback(
    async (op: PendingOp, choice: "mine" | "theirs") => {
      if (op.id === undefined) return;
      if (choice === "theirs") {
        // Server version wins; the provider refetch restores it.
        await discardOp(op);
        return;
      }
      // "mine" — the user's explicit choice overrides the server.
      if (op.conflictKind === "missing") {
        // The row was deleted remotely: recreate it (payload keeps the client id).
        await updateOp(op.id, {
          op: "create",
          status: "pending",
          conflictKind: undefined,
        });
      } else {
        // stale — drop the precondition so the write applies unconditionally.
        await updateOp(op.id, {
          baseUpdatedAt: null,
          status: "pending",
          conflictKind: undefined,
        });
      }
      await syncNow();
    },
    [discardOp, syncNow],
  );

  return {
    online,
    syncing,
    counts,
    ops,
    syncNow,
    retryOp,
    discardOp,
    resolveConflict,
  };
}

export default useSyncStatus;
