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

/**
 * Synchronous fresh-read: returns cached data if younger than the TTL, else null.
 * NOTE: not pure — it lazily deletes an entry that has aged past the TTL as a side effect.
 */
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
    // When concurrent callers dedupe onto one request, the first caller's signal
    // governs the shared request; later callers' signals are ignored.
    { signal },
  );
  cache.set(walletId, { data: res.data, ts: Date.now() });
  return res.data;
}

/** Start a fetch and register it in `inflight` so concurrent callers dedupe onto it. */
function fetchAndTrack(
  walletId: string,
  signal?: AbortSignal,
): Promise<WalletDashboardData> {
  const p = fetchFromApi(walletId, signal).finally(() => {
    // Only clear if still the current in-flight promise (a later refresh may have replaced it).
    if (inflight.get(walletId) === p) inflight.delete(walletId);
  });
  inflight.set(walletId, p);
  return p;
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

  return fetchAndTrack(walletId, signal);
}

/** Force a network refresh (bypass TTL) and update the cache — used after mutations. */
export function refreshWalletData(
  walletId: string,
  signal?: AbortSignal,
): Promise<WalletDashboardData> {
  cache.delete(walletId);
  // Overwrite any existing in-flight entry so concurrent getWalletData() calls dedupe
  // onto this forced refresh instead of firing a second duplicate request.
  return fetchAndTrack(walletId, signal);
}

/** Drop a wallet's cached entry so its next read refetches. */
export function invalidate(walletId: string): void {
  cache.delete(walletId);
  inflight.delete(walletId);
}
