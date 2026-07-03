import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./axiosConfig", () => ({
  default: { get: vi.fn() },
}));

import api from "./axiosConfig";
import {
  getWalletData,
  refreshWalletData,
  peek,
  invalidate,
} from "./walletDataCache";
import type { WalletDashboardData } from "../utils/types";

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;

const sampleData = {
  wallet: { id: "w1", name: "W1" },
  transactions: [],
  subscriptions: [],
  tags: [],
} as unknown as WalletDashboardData;

describe("walletDataCache", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    invalidate("w1");
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches on cache miss and serves from cache within TTL", async () => {
    mockedGet.mockResolvedValue({ data: sampleData });

    const first = await getWalletData("w1");
    expect(first).toEqual(sampleData);
    expect(mockedGet).toHaveBeenCalledWith("/wallets/w1/dashboard", {
      signal: undefined,
    });
    expect(mockedGet).toHaveBeenCalledTimes(1);

    const second = await getWalletData("w1");
    expect(second).toEqual(sampleData);
    expect(mockedGet).toHaveBeenCalledTimes(1); // served from cache
  });

  it("refetches after the 60s TTL expires", async () => {
    mockedGet.mockResolvedValue({ data: sampleData });
    await getWalletData("w1");
    expect(mockedGet).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_001);
    await getWalletData("w1");
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent in-flight requests", async () => {
    let resolve!: (v: unknown) => void;
    mockedGet.mockReturnValue(new Promise((r) => (resolve = r)));

    const p1 = getWalletData("w1");
    const p2 = getWalletData("w1");
    resolve({ data: sampleData });
    await Promise.all([p1, p2]);

    expect(mockedGet).toHaveBeenCalledTimes(1); // one shared request
  });

  it("dedupes a concurrent getWalletData onto an in-flight refreshWalletData", async () => {
    let resolve!: (v: unknown) => void;
    mockedGet.mockReturnValue(new Promise((r) => (resolve = r)));

    const refresh = refreshWalletData("w1");
    const get = getWalletData("w1");
    resolve({ data: sampleData });
    await Promise.all([refresh, get]);

    expect(mockedGet).toHaveBeenCalledTimes(1); // one shared request
  });

  it("refreshWalletData bypasses the TTL and updates the cache", async () => {
    mockedGet.mockResolvedValue({ data: sampleData });
    await getWalletData("w1");
    expect(mockedGet).toHaveBeenCalledTimes(1);

    await refreshWalletData("w1");
    expect(mockedGet).toHaveBeenCalledTimes(2); // forced despite fresh cache

    expect(peek("w1")).toEqual(sampleData); // refreshed value cached
  });

  it("invalidate drops the cached entry", async () => {
    mockedGet.mockResolvedValue({ data: sampleData });
    await getWalletData("w1");
    invalidate("w1");
    expect(peek("w1")).toBeNull();
  });

  it("does not cache on a failed/aborted request", async () => {
    mockedGet.mockRejectedValue(new Error("boom"));
    await expect(getWalletData("w1")).rejects.toThrow("boom");
    expect(peek("w1")).toBeNull();
  });

  it("isolates cache entries per wallet", async () => {
    const d1 = { ...sampleData, wallet: { id: "w1", name: "W1" } };
    const d2 = { ...sampleData, wallet: { id: "w2", name: "W2" } };
    mockedGet.mockImplementation((url: string) =>
      Promise.resolve({ data: url.includes("/w1/") ? d1 : d2 }),
    );

    await getWalletData("w1");
    await getWalletData("w2");

    expect(peek("w1")).toEqual(d1);
    expect(peek("w2")).toEqual(d2);
    expect(mockedGet).toHaveBeenCalledTimes(2);
    invalidate("w2");
  });

  it("propagates the abort signal to the underlying request", async () => {
    mockedGet.mockResolvedValue({ data: sampleData });
    const controller = new AbortController();
    await getWalletData("w1", controller.signal);
    expect(mockedGet).toHaveBeenCalledWith("/wallets/w1/dashboard", {
      signal: controller.signal,
    });
  });

  it("invalidate clears an in-flight request so the next read refetches", async () => {
    let resolve!: (v: unknown) => void;
    mockedGet.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const p1 = getWalletData("w1"); // in-flight

    invalidate("w1");
    mockedGet.mockResolvedValueOnce({ data: sampleData });
    const p2 = getWalletData("w1"); // must start a fresh fetch, not dedupe

    resolve({ data: sampleData });
    await Promise.all([p1, p2]);
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});
