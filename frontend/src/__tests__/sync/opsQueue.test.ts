import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { offlineDb } from "../../utils/offlineDb";
import { enqueueOp, listOps, removeOp, updateOp, countByStatus } from "../../sync/opsQueue";

const base = {
  walletId: "w1",
  entityType: "transaction" as const,
  entityKey: "tx-1",
  payload: { name: "a", amount: 1 },
  baseUpdatedAt: null,
};

beforeEach(async () => {
  await offlineDb.ops.clear();
});

describe("opsQueue coalescing", () => {
  it("merges update into a pending create", async () => {
    await enqueueOp({ ...base, op: "create" });
    await enqueueOp({ ...base, op: "update", payload: { amount: 2 } });
    const ops = await listOps();
    expect(ops).toHaveLength(1);
    expect(ops[0].op).toBe("create");
    expect(ops[0].payload).toEqual({ name: "a", amount: 2 });
  });

  it("cancels a pending create on delete", async () => {
    await enqueueOp({ ...base, op: "create" });
    await enqueueOp({ ...base, op: "delete", payload: {} });
    expect(await listOps()).toHaveLength(0);
  });

  it("keeps the first baseUpdatedAt across update+update", async () => {
    await enqueueOp({ ...base, op: "update", baseUpdatedAt: "2026-07-08T10:00:00Z" });
    await enqueueOp({
      ...base,
      op: "update",
      baseUpdatedAt: "2026-07-08T11:00:00Z",
      payload: { amount: 3 },
    });
    const ops = await listOps();
    expect(ops).toHaveLength(1);
    expect(ops[0].baseUpdatedAt).toBe("2026-07-08T10:00:00Z");
    expect(ops[0].payload).toEqual({ amount: 3 });
  });

  it("turns update+delete into a delete keeping baseUpdatedAt", async () => {
    await enqueueOp({ ...base, op: "update", baseUpdatedAt: "2026-07-08T10:00:00Z" });
    await enqueueOp({ ...base, op: "delete", payload: {}, baseUpdatedAt: null });
    const ops = await listOps();
    expect(ops[0].op).toBe("delete");
    expect(ops[0].baseUpdatedAt).toBe("2026-07-08T10:00:00Z");
  });

  it("dispatches sync-queue-changed on every mutation", async () => {
    let fired = 0;
    const h = () => fired++;
    window.addEventListener("sync-queue-changed", h);
    await enqueueOp({ ...base, op: "create" });
    const [op] = await listOps();
    await updateOp(op.id!, { status: "failed" });
    await removeOp(op.id!);
    window.removeEventListener("sync-queue-changed", h);
    expect(fired).toBe(3);
  });

  it("countByStatus buckets ops", async () => {
    await enqueueOp({ ...base, op: "create" });
    await enqueueOp({ ...base, entityKey: "tx-2", op: "update" });
    const [a] = await listOps();
    await updateOp(a.id!, { status: "conflict", conflictKind: "stale" });
    const counts = await countByStatus();
    expect(counts.conflict).toBe(1);
    expect(counts.pending).toBe(1);
  });
});
