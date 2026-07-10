// Single typed mutation path for wallet domain entities (transactions,
// subscriptions, tags, wallet). Tries the normal online call first; on a
// network error only, the mutation is enqueued as a domain op (Task 5,
// ../sync/opsQueue) for later replay instead of being lost. Online behavior
// is byte-identical to the direct api.* calls it replaces.
import api from "./axiosConfig";
import { enqueueOp } from "../sync/opsQueue";
import type { OpEntityType, OpKind, PendingOp } from "../utils/offlineDb";

export interface OpResult<T = unknown> {
  queued: boolean;
  data: T | null;
}

/** True only for errors that mean the request never reached the backend. */
export function isNetworkError(err: unknown): boolean {
  const e = err as { response?: unknown; code?: string } | null | undefined;
  return !e?.response || e?.code === "ERR_NETWORK" || !navigator.onLine;
}

type QueuedOp = Omit<PendingOp, "id" | "status" | "attempts" | "createdAt">;

async function queueOffline(op: QueuedOp): Promise<void> {
  await enqueueOp(op);
}

/** Tries the online call; on network error, queues `op` for replay instead. */
async function mutateOnline<T>(
  request: () => Promise<{ data: T }>,
  buildQueuedOp: () => QueuedOp,
): Promise<OpResult<T>> {
  try {
    const res = await request();
    return { queued: false, data: res.data };
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    await queueOffline(buildQueuedOp());
    return { queued: true, data: null };
  }
}

function createOp(
  entityType: OpEntityType,
  walletId: string,
  entityKey: string,
  payload: Record<string, unknown>,
): QueuedOp {
  return {
    walletId,
    entityType,
    entityKey,
    op: "create",
    payload,
    baseUpdatedAt: null,
  };
}

function mutateOp(
  op: OpKind,
  entityType: OpEntityType,
  walletId: string,
  entityKey: string,
  payload: Record<string, unknown>,
  baseUpdatedAt: string | null,
): QueuedOp {
  return { walletId, entityType, entityKey, op, payload, baseUpdatedAt };
}

// ==================== Transactions ====================

export function createTransaction(
  walletId: string,
  payload: Record<string, unknown>,
): Promise<OpResult> {
  return mutateOnline(
    () => api.post(`/transactions/${walletId}`, payload),
    () => {
      const entityKey = crypto.randomUUID();
      return createOp("transaction", walletId, entityKey, {
        ...payload,
        id: entityKey,
      });
    },
  );
}

export function updateTransaction(
  walletId: string,
  id: string,
  payload: Record<string, unknown>,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.put(`/transactions/${walletId}/${id}`, payload),
    () =>
      mutateOp("update", "transaction", walletId, id, payload, baseUpdatedAt),
  );
}

export function deleteTransaction(
  walletId: string,
  id: string,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.delete(`/transactions/${walletId}/${id}`),
    () => mutateOp("delete", "transaction", walletId, id, {}, baseUpdatedAt),
  );
}

// ==================== Subscriptions ====================

export function createSubscription(
  walletId: string,
  payload: Record<string, unknown>,
): Promise<OpResult> {
  return mutateOnline(
    () => api.post(`/subscription/${walletId}`, payload),
    () => {
      const entityKey = crypto.randomUUID();
      return createOp("subscription", walletId, entityKey, {
        ...payload,
        id: entityKey,
      });
    },
  );
}

export function updateSubscription(
  walletId: string,
  id: string,
  payload: Record<string, unknown>,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.put(`/subscription/${walletId}/${id}`, payload),
    () =>
      mutateOp("update", "subscription", walletId, id, payload, baseUpdatedAt),
  );
}

export function deleteSubscription(
  walletId: string,
  id: string,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.delete(`/subscription/${walletId}/${id}`),
    () => mutateOp("delete", "subscription", walletId, id, {}, baseUpdatedAt),
  );
}

// ==================== Tags ====================

export function createTag(
  walletId: string,
  payload: Record<string, unknown>,
): Promise<OpResult> {
  return mutateOnline(
    () => api.post(`/tags/${walletId}`, payload),
    () => createOp("tag", walletId, String(payload.name), payload),
  );
}

export function updateTag(
  walletId: string,
  tagName: string,
  payload: Record<string, unknown>,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.put(`/tags/${walletId}/${encodeURIComponent(tagName)}`, payload),
    () => mutateOp("update", "tag", walletId, tagName, payload, baseUpdatedAt),
  );
}

export function deleteTag(
  walletId: string,
  tagName: string,
  baseUpdatedAt: string | null,
): Promise<OpResult> {
  return mutateOnline(
    () => api.delete(`/tags/${walletId}/${encodeURIComponent(tagName)}`),
    () => mutateOp("delete", "tag", walletId, tagName, {}, baseUpdatedAt),
  );
}

// ==================== Wallet ====================

export function updateWallet(
  walletId: string,
  payload: Record<string, unknown>,
): Promise<OpResult> {
  return mutateOnline(
    () => api.put(`/wallets/${walletId}`, payload),
    () => mutateOp("update", "wallet", walletId, walletId, payload, null),
  );
}
