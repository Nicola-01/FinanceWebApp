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
});
