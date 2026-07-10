// Pure overlay: merges the pending offline-ops queue onto a WalletDashboardData
// read payload so unsynced creates/updates/deletes render immediately, flagged
// with syncState. Mirrors WalletProvider's optimistic-update rules (e.g.
// handleDeleteTag's parentName cascade) so the offline view matches what the
// online handlers would have produced.
import type { PendingOp } from "../utils/offlineDb";
import type {
  Subscription,
  SyncState,
  Tag,
  Transaction,
  WalletDashboardData,
} from "../utils/types";

const stateOf = (op: PendingOp): SyncState =>
  op.status === "conflict"
    ? "conflict"
    : op.status === "failed"
      ? "failed"
      : "pending";

const resolveTag = (name: unknown, tags: Tag[]): Tag =>
  tags.find((t) => t.name === name) ?? {
    name: typeof name === "string" ? name : "—",
    icon: "faTags",
    colorHex: "#9ca3af",
  };

export function applyPendingOps(
  data: WalletDashboardData,
  ops: PendingOp[],
): WalletDashboardData {
  if (ops.length === 0) return data;

  let { wallet, transactions, subscriptions, tags } = data;

  for (const op of ops) {
    const payload = op.payload;
    const syncState = stateOf(op);

    switch (op.entityType) {
      case "transaction": {
        if (op.op === "create") {
          const created = {
            ...(payload as Partial<Transaction>),
            id: op.entityKey,
            tag: resolveTag(payload.tag, tags),
            syncState,
          } as Transaction;
          transactions = [...transactions, created];
        } else if (op.op === "update") {
          transactions = transactions.map((t) =>
            t.id === op.entityKey
              ? ({
                  ...t,
                  ...(payload as Partial<Transaction>),
                  tag:
                    payload.tag !== undefined
                      ? resolveTag(payload.tag, tags)
                      : t.tag,
                  syncState,
                } as Transaction)
              : t,
          );
        } else if (op.op === "delete") {
          transactions = transactions.filter((t) => t.id !== op.entityKey);
        }
        break;
      }

      case "subscription": {
        if (op.op === "create") {
          const created = {
            ...(payload as Partial<Subscription>),
            id: op.entityKey,
            tag: resolveTag(payload.tag, tags),
            syncState,
          } as Subscription;
          subscriptions = [...subscriptions, created];
        } else if (op.op === "update") {
          subscriptions = subscriptions.map((s) =>
            s.id === op.entityKey
              ? ({
                  ...s,
                  ...(payload as Partial<Subscription>),
                  tag:
                    payload.tag !== undefined
                      ? resolveTag(payload.tag, tags)
                      : s.tag,
                  syncState,
                } as Subscription)
              : s,
          );
        } else if (op.op === "delete") {
          subscriptions = subscriptions.filter((s) => s.id !== op.entityKey);
        }
        break;
      }

      case "tag": {
        if (op.op === "create") {
          const created = {
            ...(payload as Partial<Tag>),
            name:
              typeof payload.name === "string" ? payload.name : op.entityKey,
            syncState,
          } as Tag;
          tags = [...tags, created];
        } else if (op.op === "update") {
          tags = tags.map((t) =>
            t.name === op.entityKey
              ? ({ ...t, ...(payload as Partial<Tag>), syncState } as Tag)
              : t,
          );
        } else if (op.op === "delete") {
          tags = tags.filter(
            (t) => t.name !== op.entityKey && t.parentName !== op.entityKey,
          );
        }
        break;
      }

      case "wallet": {
        if (op.op === "update") {
          wallet = { ...wallet, ...payload };
        }
        break;
      }
    }
  }

  return { wallet, transactions, subscriptions, tags };
}
