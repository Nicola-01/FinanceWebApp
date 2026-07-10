// Typed offline mutation queue (domain ops), aligned with the future e2ee sync plane
// (walletEncryptionPlan §8.3). At most one op per (entityType, entityKey).
import { offlineDb, type PendingOp, type OpStatus } from "../utils/offlineDb";

export const SYNC_QUEUE_CHANGED = "sync-queue-changed";

const notify = () => window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGED));

export async function enqueueOp(
  op: Omit<PendingOp, "id" | "status" | "attempts" | "createdAt">,
): Promise<void> {
  await offlineDb.transaction("rw", offlineDb.ops, async () => {
    const existing = await offlineDb.ops
      .where("walletId")
      .equals(op.walletId)
      .filter((o) => o.entityType === op.entityType && o.entityKey === op.entityKey)
      .first();

    if (!existing) {
      await offlineDb.ops.add({ ...op, status: "pending", attempts: 0, createdAt: Date.now() });
      return;
    }
    if (existing.op === "create" && op.op === "update") {
      await offlineDb.ops.update(existing.id!, {
        payload: { ...existing.payload, ...op.payload },
        status: "pending",
      });
      return;
    }
    if (existing.op === "create" && op.op === "delete") {
      await offlineDb.ops.delete(existing.id!);
      return;
    }
    if (existing.op === "update" && op.op === "update") {
      await offlineDb.ops.update(existing.id!, { payload: op.payload, status: "pending" });
      return;
    }
    if (existing.op === "update" && op.op === "delete") {
      await offlineDb.ops.update(existing.id!, { op: "delete", payload: {}, status: "pending" });
      return;
    }
    // delete + anything, or unexpected combos: append defensively.
    await offlineDb.ops.add({ ...op, status: "pending", attempts: 0, createdAt: Date.now() });
  });
  notify();
}

export async function listOps(walletId?: string): Promise<PendingOp[]> {
  const all = await offlineDb.ops.orderBy("id").toArray();
  return walletId ? all.filter((o) => o.walletId === walletId) : all;
}

export async function countByStatus(): Promise<Record<OpStatus, number>> {
  const counts: Record<OpStatus, number> = { pending: 0, syncing: 0, failed: 0, conflict: 0 };
  for (const op of await offlineDb.ops.toArray()) counts[op.status]++;
  return counts;
}

export async function updateOp(id: number, patch: Partial<PendingOp>): Promise<void> {
  await offlineDb.ops.update(id, patch);
  notify();
}

export async function removeOp(id: number): Promise<void> {
  await offlineDb.ops.delete(id);
  notify();
}
