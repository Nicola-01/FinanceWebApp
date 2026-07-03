import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { offlineDb } from "./offlineDb";

describe("offlineDb (FinanceDb)", () => {
  beforeEach(async () => {
    await offlineDb.cache.clear();
    await offlineDb.syncQueue.clear();
  });
  afterAll(() => {
    offlineDb.close();
  });

  it("declares the expected schema", () => {
    expect(offlineDb.cache.schema.primKey.keyPath).toBe("url");
    expect(offlineDb.syncQueue.schema.primKey.name).toBe("id");
    expect(offlineDb.syncQueue.schema.primKey.auto).toBe(true);
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

  it("auto-increments syncQueue ids and orders by createdAt", async () => {
    const id2 = await offlineDb.syncQueue.add({
      url: "/b",
      method: "POST",
      payload: null,
      headers: {},
      createdAt: 200,
    });
    const id1 = await offlineDb.syncQueue.add({
      url: "/a",
      method: "POST",
      payload: null,
      headers: {},
      createdAt: 100,
    });

    expect(typeof id1).toBe("number");
    expect(id1).not.toBe(id2);

    const ordered = await offlineDb.syncQueue.orderBy("createdAt").toArray();
    expect(ordered.map((i) => i.url)).toEqual(["/a", "/b"]);
  });

  it("deletes a queued item by id", async () => {
    const id = await offlineDb.syncQueue.add({
      url: "/c",
      method: "DELETE",
      payload: null,
      headers: {},
      createdAt: 1,
    });
    await offlineDb.syncQueue.delete(id);
    expect(await offlineDb.syncQueue.count()).toBe(0);
  });
});
