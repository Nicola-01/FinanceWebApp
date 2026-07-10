import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { offlineDb } from "../../utils/offlineDb";

describe("offlineDb (FinanceDb)", () => {
  beforeEach(async () => {
    await offlineDb.cache.clear();
    await offlineDb.ops.clear();
  });
  afterAll(() => {
    offlineDb.close();
  });

  it("declares the expected schema", () => {
    expect(offlineDb.cache.schema.primKey.keyPath).toBe("url");
    expect(offlineDb.ops.schema.primKey.name).toBe("id");
    expect(offlineDb.ops.schema.primKey.auto).toBe(true);
    expect(offlineDb.ops.schema.indexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(["walletId", "status", "createdAt"]),
    );
    expect(
      (offlineDb as unknown as { syncQueue?: unknown }).syncQueue,
    ).toBeUndefined();
  });

  it("stores and reads back a cached response by url", async () => {
    await offlineDb.cache.put({
      url: "/wallets",
      data: { a: 1 },
      timestamp: 123,
    });
    const row = await offlineDb.cache.get("/wallets");
    expect(row?.data).toEqual({ a: 1 });
    expect(row?.timestamp).toBe(123);
  });

  it("returns undefined for a missing cache key", async () => {
    expect(await offlineDb.cache.get("/missing")).toBeUndefined();
  });

  it("auto-increments ops ids and orders by createdAt", async () => {
    const id2 = await offlineDb.ops.add({
      walletId: "w1",
      entityType: "transaction",
      entityKey: "tx-b",
      op: "create",
      payload: {},
      baseUpdatedAt: null,
      status: "pending",
      attempts: 0,
      createdAt: 200,
    });
    const id1 = await offlineDb.ops.add({
      walletId: "w1",
      entityType: "transaction",
      entityKey: "tx-a",
      op: "create",
      payload: {},
      baseUpdatedAt: null,
      status: "pending",
      attempts: 0,
      createdAt: 100,
    });

    expect(typeof id1).toBe("number");
    expect(id1).not.toBe(id2);

    const ordered = await offlineDb.ops.orderBy("createdAt").toArray();
    expect(ordered.map((i) => i.entityKey)).toEqual(["tx-a", "tx-b"]);
  });

  it("deletes a queued op by id", async () => {
    const id = await offlineDb.ops.add({
      walletId: "w1",
      entityType: "transaction",
      entityKey: "tx-c",
      op: "delete",
      payload: {},
      baseUpdatedAt: null,
      status: "pending",
      attempts: 0,
      createdAt: 1,
    });
    await offlineDb.ops.delete(id);
    expect(await offlineDb.ops.count()).toBe(0);
  });
});
