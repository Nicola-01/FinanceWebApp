// Offline replay engine. Drains the domain-ops queue (Task 5, ./opsQueue) to the
// server FIFO when connectivity returns, sends the optimistic `baseUpdatedAt`
// precondition, and classifies the failures the backend reports (stale write vs.
// the remote entity being gone) so the overlay can surface them for user action.
// Replaces the legacy raw-HTTP syncService.
import api from "../api/axiosConfig";
import { isNetworkError } from "../api/walletOps";
import {
  getApiErrorTitle,
  getApiErrorDetail,
  getApiErrorStatus,
} from "../utils/apiError";
import { invalidate } from "../api/walletDataCache";
import { triggerToast } from "../components/ui/ToastNotification";
import { listOps, updateOp, removeOp } from "./opsQueue";
import type { PendingOp, ConflictKind, OpEntityType } from "../utils/offlineDb";

/** Fired after a replay pass; WalletProvider listens to refetch the active wallet. */
export const OFFLINE_SYNC_COMPLETE = "offline-sync-complete";

/** How a failed replay request is interpreted (see {@link classifyReplayError}). */
export type ReplayClassification =
  | { kind: "offline" }
  | { kind: "conflict"; conflictKind: ConflictKind }
  | { kind: "failed"; message: string }
  | { kind: "gone-already" };

/** REST collection path for an entity type — identical to walletOps (subscription singular). */
function collectionUrl(entityType: OpEntityType, walletId: string): string {
  switch (entityType) {
    case "transaction":
      return `/transactions/${walletId}`;
    case "subscription":
      return `/subscription/${walletId}`;
    case "tag":
      return `/tags/${walletId}`;
    case "wallet":
      return `/wallets/${walletId}`;
  }
}

/** REST resource path for a single entity (update/delete target). */
function resourceUrl(op: PendingOp): string {
  // Wallet ops target the wallet itself; there is no per-entity suffix.
  if (op.entityType === "wallet") return `/wallets/${op.walletId}`;
  const base = collectionUrl(op.entityType, op.walletId);
  const key =
    op.entityType === "tag" ? encodeURIComponent(op.entityKey) : op.entityKey;
  return `${base}/${key}`;
}

/** Replays a single op against the backend. Rejects with the Axios error on failure. */
async function sendOp(op: PendingOp): Promise<void> {
  if (op.op === "create") {
    // Payload already carries the client id for transactions/subscriptions.
    await api.post(collectionUrl(op.entityType, op.walletId), op.payload);
    return;
  }
  if (op.op === "update") {
    await api.put(resourceUrl(op), {
      ...op.payload,
      // Wallet ops carry a null base; `?? undefined` drops the key entirely.
      baseUpdatedAt: op.baseUpdatedAt ?? undefined,
    });
    return;
  }
  // delete — precondition rides as a query param, never a body.
  await api.delete(resourceUrl(op), {
    params: { baseUpdatedAt: op.baseUpdatedAt ?? undefined },
  });
}

/**
 * Interprets a failed replay request.
 * - No response reached the server → `offline` (retry later, stop the pass).
 * - RFC-7807 title "Stale Write" → `conflict/stale` (Task 4 precondition failed).
 * - An update whose target 404s (or 409s "not found") → `conflict/missing`.
 * - A delete rejected with any non-stale 4xx → `gone-already` (idempotent success).
 * - Any other 4xx → `failed`. (5xx is handled by the caller as a retryable pause.)
 */
export function classifyReplayError(
  op: PendingOp,
  err: unknown,
): ReplayClassification {
  if (isNetworkError(err)) return { kind: "offline" };

  const status = getApiErrorStatus(err);

  if (getApiErrorTitle(err, "") === "Stale Write") {
    return { kind: "conflict", conflictKind: "stale" };
  }

  if (
    op.op === "update" &&
    (status === 404 ||
      (status === 409 && /not found/i.test(getApiErrorDetail(err, ""))))
  ) {
    return { kind: "conflict", conflictKind: "missing" };
  }

  if (
    op.op === "delete" &&
    status !== undefined &&
    status >= 400 &&
    status < 500
  ) {
    return { kind: "gone-already" };
  }

  return {
    kind: "failed",
    message: getApiErrorDetail(err, getApiErrorTitle(err, "Sync failed")),
  };
}

// Re-entrancy guard: only one replay pass runs at a time.
let running = false;

/** Drains the queue once. No-op while offline or a pass is already in flight. */
export async function replaySync(): Promise<void> {
  if (!navigator.onLine || running) return;
  running = true;
  try {
    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    const touched = new Set<string>();

    const ops = await listOps();
    for (const op of ops) {
      // Only pending ops replay; failed/conflict wait for explicit user action.
      if (op.status !== "pending" || op.id === undefined) continue;

      await updateOp(op.id, { status: "syncing" });
      try {
        await sendOp(op);
        await removeOp(op.id);
        synced++;
        touched.add(op.walletId);
      } catch (err) {
        // Server trouble: keep the op pending and retry on the next pass.
        const status = getApiErrorStatus(err);
        if (status !== undefined && status >= 500) {
          await updateOp(op.id, { status: "pending" });
          break;
        }

        const result = classifyReplayError(op, err);
        if (result.kind === "offline") {
          await updateOp(op.id, { status: "pending" });
          break;
        }
        if (result.kind === "gone-already") {
          // The remote is already in the state we wanted — treat as success.
          await removeOp(op.id);
          synced++;
          touched.add(op.walletId);
          continue;
        }
        if (result.kind === "conflict") {
          conflicts++;
          await updateOp(op.id, {
            status: "conflict",
            conflictKind: result.conflictKind,
            lastError: getApiErrorDetail(
              err,
              getApiErrorTitle(err, "Conflict"),
            ),
            attempts: op.attempts + 1,
          });
          continue;
        }
        // failed
        failed++;
        await updateOp(op.id, {
          status: "failed",
          lastError: result.message,
          attempts: op.attempts + 1,
        });
      }
    }

    for (const walletId of touched) invalidate(walletId);
    window.dispatchEvent(
      new CustomEvent(OFFLINE_SYNC_COMPLETE, {
        detail: { synced, failed, conflicts },
      }),
    );
    if (synced > 0) {
      triggerToast(
        `${synced} offline ${synced === 1 ? "change" : "changes"} synced`,
        true,
      );
    }
  } finally {
    running = false;
  }
}

// Replay as soon as the browser reports it is back online.
window.addEventListener("online", replaySync);

/** App boot hook: kick off a delayed first replay if we start online. */
export function initSync(): void {
  if (navigator.onLine) setTimeout(replaySync, 2000);
}
