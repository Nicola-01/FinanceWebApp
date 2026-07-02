# Wallet data unifier + client cache — Design

**Date:** 2026-07-03
**Branch:** release/v2.8.2
**Status:** Approved (design)

## Problem

Switching wallet in the dashboard fully remounts the data provider, and each mount
fires **4 parallel API calls**. Rapidly skipping between wallets produces bursts of
`4 × N` requests that trip an external (proxy/Cloudflare) rate limit → `429`.

Evidence in the current code:

- `frontend/src/dashboard/UserDashboard.tsx:138` — `WalletDashboard` is mounted with
  `key={selectedWallet.id}`, so every wallet switch remounts `WalletProvider` from scratch.
- `frontend/src/dashboard/wallet/WalletProvider.tsx:99-110` — on mount, `fetchData` runs
  a `Promise.all` of four GETs: `/wallets/{id}`, `/transactions/{id}`,
  `/subscription/{id}`, `/tags/{id}`.
- The rate limit is **not** in the backend Java nor in `frontend/nginx.conf`; it lives at
  an external proxy/Cloudflare layer. The fix must therefore **reduce the number of
  requests the client emits**, not change the limit.

## Goals

1. Collapse the per-wallet load from 4 requests into **1 unified request**, **without
   removing** the existing 4 endpoints (the `mcp-server` and other callers depend on them).
2. Add a **client-side cache with ~60s TTL** so revisiting a recently seen wallet emits
   **zero** requests, and skipping fast across wallets does not burst.

## Non-goals

- No changes to the existing granular endpoints (`/wallets/{id}`, `/transactions/{id}`,
  `/subscription/{id}`, `/tags/{id}`) or to the MCP server.
- No server-side cache in this iteration (client cache already prevents the bursts before
  they leave the browser). Can be added later if multiple devices hammer the same wallet.
- No new data-fetching library (the app deliberately uses React Context, not Redux/React
  Query). The cache is a small dependency-free module.
- The wallet **list** fetch (`UserDashboard` → `GET /wallets`, once on mount) is left
  unchanged; it is not part of the burst.

## Design decisions (agreed)

- **Cache mechanism:** in-memory module-level `Map` + TTL, with in-flight promise dedup.
  Chosen over Dexie/IndexedDB-TTL and TanStack Query for minimal weight and maximum
  control. Cache is lost on full page reload, which is acceptable — the existing
  `offlineDb` (Dexie) GET cache already covers reload/offline.
- **Fast-skip handling:** ~250 ms **debounce** on the network fetch. The wallet you fly
  past is unmounted before the timer fires, so it never fetches. A cache **hit** renders
  instantly with no debounce.
- **Server-side cache:** none for now (client-only).

## Architecture

Two **additive** layers. Existing endpoints untouched.

### A. Backend — aggregate endpoint (new)

- **Endpoint:** `GET /api/wallets/{walletID}/dashboard`
- **Response DTO** `dto/WalletDashboardResponse.java`:
  ```
  {
    "wallet":        WalletResponse,
    "transactions":  TransactionResponse[],
    "subscriptions": SubscriptionResponse[],
    "tags":          TagResponse[]
  }
  ```
- **Orchestration** `service/WalletDashboardService.java`: injects the four existing
  services (`WalletService`, `TransactionService`, `SubscriptionService`, `TagService`)
  and calls their **public** methods. Because the calls cross Spring proxy boundaries,
  each method's `@PreAuthorize("@walletSecurity.…")` still fires → **authorization is
  preserved** and a caller without access to the wallet gets the same 403 as today. No
  business logic is duplicated; existing mappers are reused.
- **Controller:** new `@GetMapping("/{walletID}/dashboard")` method in
  `controller/WalletController.java` (already `@RequestMapping("/api/wallets")`).
- **Tests (mandatory backend discipline):** add `WalletDashboardServiceTest` and a
  controller test (happy path + 403 on no-access). Run `./gradlew test` and
  `./gradlew spotlessApply`; keep line coverage ≥ 90% (`./gradlew check`).

### B. Frontend — unified fetch + TTL cache

- **New module** `src/api/walletDataCache.ts`:
  - `const TTL = 60_000`
  - `const cache = new Map<string, { data: WalletDashboardData; ts: number }>()`
  - `const inflight = new Map<string, Promise<WalletDashboardData>>()`
  - `peek(id): WalletDashboardData | null` — synchronous fresh-check (`now - ts < TTL`),
    for instant render on cache hit.
  - `getWalletData(id, signal): Promise<WalletDashboardData>` — fresh cache → resolved
    with cached data (no network); in-flight → reuse that promise; else
    `GET /wallets/{id}/dashboard`, store `{data, ts}`, return.
  - `refreshWalletData(id, signal): Promise<WalletDashboardData>` — **force** GET,
    bypass TTL, update cache. Used after mutations.
  - `invalidate(id): void` — drop the cache entry.
  - `WalletDashboardData` type (`{ wallet, transactions, subscriptions, tags }`, mirroring
    the backend `WalletDashboardResponse`) is declared in `src/utils/types.ts` next to the
    existing `Wallet`/`Transaction`/`Subscription`/`Tag` types, and imported by the module.

  Note on `Date.now()`: used only at runtime in the browser for TTL timestamps — fine
  (the `Date.now()` restriction applies to workflow scripts, not app code).

- **`WalletProvider.tsx` changes:**
  - **Mount/switch effect** (keyed on `_wallet.id`): call `peek(_wallet.id)`.
    - **Hit:** set `wallet/transactions/subscriptions/tags` from the cached snapshot
      immediately, no spinner, **0 requests**.
    - **Miss:** `setTimeout(…, 250)` → `getWalletData(_wallet.id, signal)` then set state.
      Cleanup on unmount/switch clears the timer **and** calls `controller.abort()`, so a
      skipped wallet never fetches.
  - **`fetchData(signal)`** (the context-exposed reload used by children after mutations)
    → `refreshWalletData(_wallet.id, signal)` (force refresh + cache update), then set
    state. This preserves the existing contract where `TransactionsTab`, `SubscriptionTab`
    and `WalletMenu` call `fetchData()` to reload fresh data after a change.
  - **Local mutation handlers** `handleAddTag` / `handleUpdateTag` / `handleDeleteTag` /
    `handleUpdateWallet`: after success, call `invalidate(wallet.id)` so a revisit within
    60 s reloads fresh data (one request) rather than serving a stale snapshot.

- **Unchanged:** `UserDashboard` `GET /wallets` list fetch; `axiosConfig` response
  interceptor still caches the new `/wallets/{id}/dashboard` GET into `offlineDb` for
  offline/reload.

## Data flow

```
Switch wallet
  └─ WalletProvider remounts (key = walletId)
       └─ peek(cache)
            ├─ HIT (fresh <60s) ─► set state instantly ─► 0 requests
            └─ MISS ─► wait 250ms (debounce)
                         ├─ still mounted ─► GET /wallets/{id}/dashboard ─► render + cache
                         └─ unmounted first (skipped) ─► timer cleared + abort ─► 0 requests

Mutation in a tab
  └─ child calls context fetchData()
       └─ refreshWalletData(id) ─► force GET ─► update cache + state
```

## Expected result

| Scenario                          | Before      | After     |
|-----------------------------------|-------------|-----------|
| Settled wallet visit              | 4 requests  | **1**     |
| Repeat visit within 60 s          | 4 requests  | **0**     |
| Fast skip across N new wallets    | up to 4·N   | **~1–2**  |

## Testing

- **Backend:** JUnit tests for `WalletDashboardService` (composition + authorization
  delegation) and `WalletController` (`200` happy path, `403` no-access). Coverage ≥ 90%.
- **Frontend:** Vitest unit tests for `walletDataCache` — TTL hit/miss, in-flight dedup,
  `refresh` bypasses TTL, `invalidate` drops entry. (CI gates on lint/build only, but
  tests live next to sources per repo convention.)

## Risks / edge cases

- **Stale after mutation:** mitigated by `invalidate(id)` on local mutations and
  `refreshWalletData` on context `fetchData()`.
- **In-flight abort:** aborting a shared in-flight promise (dedup) must not poison the
  cache — on abort/error, remove the `inflight` entry and do not write `cache`.
- **Authorization parity:** the aggregate must return exactly the same 403 as the
  granular endpoints; guaranteed by delegating to the `@PreAuthorize`-guarded service
  methods rather than reimplementing access checks.
```
