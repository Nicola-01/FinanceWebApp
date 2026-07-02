// src/api/walletDataCache.ts
// In-memory TTL cache for the unified per-wallet dashboard payload.
// Fronts GET /api/wallets/{id}/dashboard so rapid wallet switching does not
// burst the rate limit. Cache is lost on full page reload (offlineDb covers that).
import api from "./axiosConfig";
import type { WalletDashboardData } from "../utils/types";

export type { WalletDashboardData };

const TTL = 60_000; // 1 minute

interface Entry {
  data: WalletDashboardData;
  ts: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<WalletDashboardData>>();

/** Synchronous fresh-read: returns cached data if younger than the TTL, else null. */
export function peek(walletId: string): WalletDashboardData | null {
  const entry = cache.get(walletId);
  if (!entry) return null;
  if (Date.now() - entry.ts >= TTL) {
    cache.delete(walletId);
    return null;
  }
  return entry.data;
}

async function fetchFromApi(
  walletId: string,
  signal?: AbortSignal,
): Promise<WalletDashboardData> {
  const res = await api.get<WalletDashboardData>(
    `/wallets/${walletId}/dashboard`,
    { signal },
  );
  cache.set(walletId, { data: res.data, ts: Date.now() });
  return res.data;
}

/** Cache-aware read: fresh cache → no network; in-flight → shared promise; else fetch. */
export function getWalletData(
  walletId: string,
  signal?: AbortSignal,
): Promise<WalletDashboardData> {
  const fresh = peek(walletId);
  if (fresh) return Promise.resolve(fresh);

  const existing = inflight.get(walletId);
  if (existing) return existing;

  const p = fetchFromApi(walletId, signal).finally(() => {
    inflight.delete(walletId);
  });
  inflight.set(walletId, p);
  return p;
}

/** Force a network refresh (bypass TTL) and update the cache — used after mutations. */
export function refreshWalletData(
  walletId: string,
  signal?: AbortSignal,
): Promise<WalletDashboardData> {
  cache.delete(walletId);
  inflight.delete(walletId);
  return fetchFromApi(walletId, signal);
}

/** Drop a wallet's cached entry so its next read refetches. */
export function invalidate(walletId: string): void {
  cache.delete(walletId);
  inflight.delete(walletId);
}
