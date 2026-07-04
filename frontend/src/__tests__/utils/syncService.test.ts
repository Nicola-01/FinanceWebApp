import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setOnline } from "../../test/testUtils";

vi.mock("../../utils/offlineDb", () => ({
  offlineDb: {
    syncQueue: {
      orderBy: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));
vi.mock("../../api/axiosConfig", () => ({ default: vi.fn() }));
vi.mock("../../utils/apiError", () => ({
  getApiErrorStatus: (err: { status?: number }) => err?.status,
}));

import { syncOfflineData } from "../../utils/syncService";
import { offlineDb } from "../../utils/offlineDb";
import api from "../../api/axiosConfig";

const orderBy = offlineDb.syncQueue.orderBy as unknown as ReturnType<
  typeof vi.fn
>;
const del = offlineDb.syncQueue.delete as unknown as ReturnType<typeof vi.fn>;
const mockedApi = api as unknown as ReturnType<typeof vi.fn>;

const queueWith = (items: unknown[]) =>
  orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue(items) });

const item = (over: Record<string, unknown> = {}) => ({
  id: 1,
  url: "/transactions",
  method: "POST",
  payload: { a: 1 },
  headers: { "X-H": "1" },
  createdAt: 100,
  ...over,
});

describe("syncOfflineData", () => {
  beforeEach(() => {
    orderBy.mockReset();
    del.mockReset().mockResolvedValue(undefined);
    mockedApi.mockReset().mockResolvedValue({ data: {} });
    setOnline(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is a no-op when offline", async () => {
    setOnline(false);
    await syncOfflineData();
    expect(orderBy).not.toHaveBeenCalled();
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it("is a no-op when the queue is empty", async () => {
    queueWith([]);
    await syncOfflineData();
    expect(mockedApi).not.toHaveBeenCalled();
  });

  it("replays queued items and deletes them on success", async () => {
    queueWith([
      item({ id: 1, createdAt: 100 }),
      item({ id: 2, createdAt: 200 }),
    ]);
    await syncOfflineData();

    expect(mockedApi).toHaveBeenCalledTimes(2);
    expect(mockedApi).toHaveBeenNthCalledWith(1, {
      method: "POST",
      url: "/transactions",
      data: { a: 1 },
      headers: { "X-H": "1" },
      isSyncRequest: true,
    });
    expect(del).toHaveBeenCalledWith(1);
    expect(del).toHaveBeenCalledWith(2);
  });

  it("SECURITY: drops a 4xx item to avoid an infinite replay loop", async () => {
    queueWith([item({ id: 7 })]);
    mockedApi.mockRejectedValue({ status: 404 });
    await syncOfflineData();
    expect(del).toHaveBeenCalledWith(7);
  });

  it.each([500, 408, 429])(
    "keeps the item on retryable status %d",
    async (status) => {
      queueWith([item({ id: 9 })]);
      mockedApi.mockRejectedValue({ status });
      await syncOfflineData();
      expect(del).not.toHaveBeenCalled();
    },
  );

  it("dispatches offline-sync-complete after processing", async () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    queueWith([item({ id: 1 })]);
    await syncOfflineData();
    const types = dispatch.mock.calls.map(([e]) => (e as Event).type);
    expect(types).toContain("offline-sync-complete");
  });
});
