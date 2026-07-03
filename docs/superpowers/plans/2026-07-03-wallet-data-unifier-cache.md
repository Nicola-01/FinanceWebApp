# Wallet Data Unifier + Client Cache — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the 4 per-wallet API calls into one aggregate endpoint and add a 60s client-side cache so rapid wallet switching stops tripping the rate limit.

**Architecture:** A new additive backend endpoint `GET /api/wallets/{id}/dashboard` composes the four existing (unchanged) service methods into one response. A dependency-free frontend cache module (`Map` + TTL + in-flight dedup) fronts that endpoint; `WalletProvider` renders cache hits instantly and debounces cache-miss fetches by 250ms.

**Tech Stack:** Spring Boot 3.5 / Java 21 / Lombok / JUnit 5 + Mockito (backend); React 19 + TypeScript + Vite + Vitest (frontend). No new dependencies on either side.

## Global Constraints

- **Backend test discipline (hooks-enforced):** after any change under `backend/`, run `./gradlew test`, add/update covering tests, re-run until green. Then `./gradlew spotlessApply` (Google Java Format) and keep line coverage ≥ 90% (`./gradlew check`).
- **All REST endpoints live under `/api/...`.**
- **Existing endpoints must stay untouched** (`/wallets/{id}`, `/transactions/{id}`, `/subscription/{id}`, `/tags/{id}`) — the `mcp-server` depends on them.
- **No new frontend dependencies.** App uses React Context, not a data-fetching library.
- **Service method parameter order is inconsistent — copy exactly:**
  - `walletService.getWallet(userId, walletId)` → `WalletResponse`
  - `transactionService.getTransactionsByWalletID(walletId, userId)` → `List<TransactionResponse>`
  - `subscriptionService.getSubscriptionsByWalletID(walletId, userId)` → `List<SubscriptionResponse>`
  - `tagService.getTags(walletId, userId)` → `List<TagResponse>`
- **Cache tuning:** `TTL = 60_000` ms, debounce `250` ms.

---

## File Structure

**Backend (create):**
- `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/WalletDashboardResponse.java` — aggregate response DTO.
- `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardService.java` — orchestrates the 4 existing services.
- `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardServiceTest.java` — unit test for delegation + assembly.

**Backend (modify):**
- `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/WalletController.java` — add the `GET /{walletID}/dashboard` method.
- `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/WalletControllerTest.java` — mock the new service + add endpoint test.

**Frontend (create):**
- `frontend/src/api/walletDataCache.ts` — TTL cache + in-flight dedup around the aggregate endpoint.
- `frontend/src/api/walletDataCache.test.ts` — Vitest unit tests.

**Frontend (modify):**
- `frontend/src/utils/types.ts` — add `WalletDashboardData` interface.
- `frontend/src/dashboard/wallet/WalletProvider.tsx` — use the cache, cache-aware mount, debounce, force-refresh `fetchData`, invalidate on mutations.

---

## Task 1: Backend — aggregate DTO + service

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/WalletDashboardResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardServiceTest.java`

**Interfaces:**
- Consumes: the four existing service methods listed in Global Constraints.
- Produces: `WalletDashboardService.getDashboard(UUID walletId, UUID userId)` → `WalletDashboardResponse`; DTO `WalletDashboardResponse` with fields `wallet` (`WalletResponse`), `transactions` (`List<TransactionResponse>`), `subscriptions` (`List<SubscriptionResponse>`), `tags` (`List<TagResponse>`) and a Lombok `builder()`.

**Authorization note:** `WalletDashboardService` carries **no** `@PreAuthorize`. It calls the four services as injected Spring beans, so each delegate's own `@PreAuthorize("@walletSecurity…")` fires across the proxy boundary — a caller lacking access gets the same 403 as today. Do **not** re-implement access checks here.

- [ ] **Step 1: Create the DTO**

`backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/WalletDashboardResponse.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletDashboardResponse {
  private WalletResponse wallet;
  private List<TransactionResponse> transactions;
  private List<SubscriptionResponse> subscriptions;
  private List<TagResponse> tags;
}
```

- [ ] **Step 2: Write the failing service test**

`backend/src/test/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardServiceTest.java`:

```java
package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WalletDashboardServiceTest {

  @Mock private WalletService walletService;
  @Mock private TransactionService transactionService;
  @Mock private SubscriptionService subscriptionService;
  @Mock private TagService tagService;

  @InjectMocks private WalletDashboardService walletDashboardService;

  @Test
  void getDashboard_composesAllFourSources_withCorrectParamOrder() {
    UUID walletId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    WalletResponse wallet = WalletResponse.builder().name("Main").build();
    List<TransactionResponse> txs = List.of(TransactionResponse.builder().name("tx").build());
    List<SubscriptionResponse> subs =
        List.of(SubscriptionResponse.builder().name("sub").build());
    List<TagResponse> tags = List.of(TagResponse.builder().name("tag").build());

    when(walletService.getWallet(userId, walletId)).thenReturn(wallet);
    when(transactionService.getTransactionsByWalletID(walletId, userId)).thenReturn(txs);
    when(subscriptionService.getSubscriptionsByWalletID(walletId, userId)).thenReturn(subs);
    when(tagService.getTags(walletId, userId)).thenReturn(tags);

    WalletDashboardResponse result = walletDashboardService.getDashboard(walletId, userId);

    assertSame(wallet, result.getWallet());
    assertSame(txs, result.getTransactions());
    assertSame(subs, result.getSubscriptions());
    assertSame(tags, result.getTags());
    assertEquals("Main", result.getWallet().getName());

    // Param order is intentionally inconsistent across services — verify exactly.
    verify(walletService).getWallet(userId, walletId);
    verify(transactionService).getTransactionsByWalletID(walletId, userId);
    verify(subscriptionService).getSubscriptionsByWalletID(walletId, userId);
    verify(tagService).getTags(walletId, userId);
  }
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd backend && ./gradlew test --tests "*.WalletDashboardServiceTest"`
Expected: FAIL — `WalletDashboardService` / `WalletDashboardResponse` do not exist yet (compilation error).

- [ ] **Step 4: Create the service**

`backend/src/main/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardService.java`:

```java
package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WalletDashboardService {

  private final WalletService walletService;
  private final TransactionService transactionService;
  private final SubscriptionService subscriptionService;
  private final TagService tagService;

  /**
   * Aggregates the wallet, its transactions, subscriptions and tags into a single response.
   * Delegates to the existing per-resource services so their {@code @PreAuthorize} checks still
   * apply — this class performs no authorization of its own.
   */
  public WalletDashboardResponse getDashboard(UUID walletId, UUID userId) {
    return WalletDashboardResponse.builder()
        .wallet(walletService.getWallet(userId, walletId))
        .transactions(transactionService.getTransactionsByWalletID(walletId, userId))
        .subscriptions(subscriptionService.getSubscriptionsByWalletID(walletId, userId))
        .tags(tagService.getTags(walletId, userId))
        .build();
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && ./gradlew test --tests "*.WalletDashboardServiceTest"`
Expected: PASS.

- [ ] **Step 6: Format**

Run: `cd backend && ./gradlew spotlessApply`
Expected: BUILD SUCCESSFUL, files reformatted if needed.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/WalletDashboardResponse.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardService.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/service/WalletDashboardServiceTest.java
git commit -m "feat(backend): add WalletDashboardService aggregating wallet data"
```

---

## Task 2: Backend — controller endpoint

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/WalletController.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/WalletControllerTest.java`

**Interfaces:**
- Consumes: `WalletDashboardService.getDashboard(UUID walletId, UUID userId)` (Task 1).
- Produces: HTTP `GET /api/wallets/{walletID}/dashboard` → `200` with a `WalletDashboardResponse` body.

- [ ] **Step 1: Add the failing controller test**

In `WalletControllerTest.java`, add the new service as a mocked bean (next to the existing `walletService` field):

```java
  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private dev.busato.FinanceWebApp.backend.service.WalletDashboardService walletDashboardService;
```

And add this test method inside the class:

```java
  @Test
  void getWalletDashboard_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse mockResponse =
        dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse.builder()
            .wallet(WalletResponse.builder().name("Main Wallet").build())
            .transactions(List.of())
            .subscriptions(List.of())
            .tags(List.of())
            .build();

    when(walletDashboardService.getDashboard(eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(get("/api/wallets/{walletID}/dashboard", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.wallet.name").value("Main Wallet"))
        .andExpect(jsonPath("$.transactions").isArray())
        .andExpect(jsonPath("$.subscriptions").isArray())
        .andExpect(jsonPath("$.tags").isArray());
  }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && ./gradlew test --tests "*.WalletControllerTest.getWalletDashboard_ShouldReturn200"`
Expected: FAIL — endpoint not mapped (404), the controller does not yet inject `WalletDashboardService`.

- [ ] **Step 3: Wire the service into the controller**

In `WalletController.java`, add the dependency field below the existing `walletService`:

```java
  private final WalletService walletService;
  private final dev.busato.FinanceWebApp.backend.service.WalletDashboardService walletDashboardService;
```

(`@RequiredArgsConstructor` picks it up automatically — no constructor edit needed.)

- [ ] **Step 4: Add the endpoint method**

In `WalletController.java`, add this method (place it right after `getWalletById`, so the aggregate sits next to the granular getter). Import `WalletDashboardResponse` at the top:

```java
import dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse;
```

```java
  @GetMapping("/{walletID}/dashboard")
  public ResponseEntity<WalletDashboardResponse> getWalletDashboard(
      @PathVariable UUID walletID, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(walletDashboardService.getDashboard(walletID, user.getId()));
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd backend && ./gradlew test --tests "*.WalletControllerTest"`
Expected: PASS (all existing WalletController tests + the new one).

- [ ] **Step 6: Run the full suite + coverage gate**

Run: `cd backend && ./gradlew spotlessApply && ./gradlew check`
Expected: BUILD SUCCESSFUL, line coverage ≥ 90%. (The new endpoint is one delegating line; the service test + controller test cover it.)

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/WalletController.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/WalletControllerTest.java
git commit -m "feat(backend): expose GET /api/wallets/{id}/dashboard aggregate endpoint"
```

---

## Task 3: Frontend — cache module + type

**Files:**
- Modify: `frontend/src/utils/types.ts`
- Create: `frontend/src/api/walletDataCache.ts`
- Test: `frontend/src/api/walletDataCache.test.ts`

**Interfaces:**
- Consumes: `api` default export from `frontend/src/api/axiosConfig.ts`; existing `Wallet`/`Transaction`/`Subscription`/`Tag` interfaces from `utils/types`.
- Produces (all from `walletDataCache.ts`):
  - `WalletDashboardData` (re-exported type; canonical definition in `types.ts`)
  - `peek(walletId: string): WalletDashboardData | null`
  - `getWalletData(walletId: string, signal?: AbortSignal): Promise<WalletDashboardData>`
  - `refreshWalletData(walletId: string, signal?: AbortSignal): Promise<WalletDashboardData>`
  - `invalidate(walletId: string): void`

- [ ] **Step 1: Add the `WalletDashboardData` type**

In `frontend/src/utils/types.ts`, after the `Subscription` interface add:

```ts
export interface WalletDashboardData {
  wallet: Wallet;
  transactions: Transaction[];
  subscriptions: Subscription[];
  tags: Tag[];
}
```

- [ ] **Step 2: Write the failing cache tests**

`frontend/src/api/walletDataCache.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/api/walletDataCache.test.ts`
Expected: FAIL — `./walletDataCache` module does not exist.

- [ ] **Step 4: Implement the cache module**

`frontend/src/api/walletDataCache.ts`:

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/api/walletDataCache.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Lint**

Run: `cd frontend && npm run lint`
Expected: no errors on the new files.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/utils/types.ts \
        frontend/src/api/walletDataCache.ts \
        frontend/src/api/walletDataCache.test.ts
git commit -m "feat(frontend): add walletDataCache (60s TTL + in-flight dedup)"
```

---

## Task 4: Frontend — wire WalletProvider to the cache

**Files:**
- Modify: `frontend/src/dashboard/wallet/WalletProvider.tsx`

**Interfaces:**
- Consumes: `getWalletData`, `refreshWalletData`, `peek`, `invalidate` from `../../api/walletDataCache`; `WalletDashboardData` from `../../utils/types`.
- Produces: unchanged `WalletContext` shape — `fetchData: (signal?: AbortSignal) => Promise<void>` still exposed (now a forced refresh); all other context values identical.

**Behavior after this task:** on wallet switch, a fresh cache entry renders instantly with **zero** requests; a cache miss fetches the unified endpoint after a 250ms debounce (skipped wallets never fetch); mutations invalidate the wallet's cache entry; children calling `fetchData()` force a fresh reload.

- [ ] **Step 1: Add imports**

At the top of `WalletProvider.tsx`, alongside the existing imports, add:

```tsx
import type { WalletDashboardData } from "../../utils/types";
import {
  getWalletData,
  refreshWalletData,
  peek,
  invalidate,
} from "../../api/walletDataCache";
```

- [ ] **Step 2: Add an `applyData` helper + shared loader**

Inside the `WalletProvider` component, replace the existing `fetchData` function (WalletProvider.tsx:99-126) with the following. `applyData` fans a unified payload into the four state setters; `runLoad` centralises the try/catch; `loadData` is cache-aware (mount path) and `fetchData` forces a refresh (context path):

```tsx
  const applyData = (data: WalletDashboardData) => {
    setWallet(data.wallet);
    setTransactions(data.transactions);
    setSubscriptions(data.subscriptions);
    setTags(data.tags);
  };

  const runLoad = async (
    fetcher: () => Promise<WalletDashboardData>,
    signal?: AbortSignal,
  ) => {
    if (!_wallet?.id) return;
    try {
      setIsLoading(true);
      const data = await fetcher();
      applyData(data);
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      triggerToast(`Error loading data for ${_wallet.name}`, false);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Cache-aware load (mount / wallet switch): serves fresh cache, else fetches.
  const loadData = (signal?: AbortSignal) =>
    runLoad(() => getWalletData(_wallet.id, signal), signal);

  // Forced reload (exposed on context; used by children after a mutation).
  const fetchData = (signal?: AbortSignal) =>
    runLoad(() => refreshWalletData(_wallet.id, signal), signal);
```

- [ ] **Step 3: Rewrite the mount effect with cache-hit + debounce**

Replace the existing mount effect (WalletProvider.tsx:80-97) with:

```tsx
  useEffect(() => {
    const controller = new AbortController();

    setWallet(_wallet);

    const cached = peek(_wallet.id);
    if (cached) {
      // Cache hit: render instantly, no spinner, zero requests.
      applyData(cached);
      return () => controller.abort();
    }

    // Cache miss: clear stale view, then debounce the fetch so wallets the
    // user quickly skips past never hit the network.
    setTransactions([]);
    setSubscriptions([]);
    setTags([]);

    const timer = setTimeout(() => {
      loadData(controller.signal);
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // Reset + reload only on wallet change (_wallet.id). Intentionally not
    // re-run on other _wallet fields nor on loadData identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_wallet.id]);
```

- [ ] **Step 4: Invalidate the cache after local mutations**

In each of the four mutation handlers, after the local state update succeeds, drop the cache entry so a revisit within 60s reloads fresh data. Add `invalidate(wallet.id);` at these points:

- `handleAddTag` — after `setTags((prev) => [...prev, response.data]);`
- `handleUpdateTag` — after the `setTags((prev) => prev.map(...))` block
- `handleDeleteTag` — after the `setTags((prev) => prev.filter(...))` call
- `handleUpdateWallet` — after `setWallet(res.data);`

Example for `handleAddTag`:

```tsx
      const response = await api.post(`/tags/${wallet.id}`, newTag);
      setTags((prev) => [...prev, response.data]);
      invalidate(wallet.id);
      triggerToast("Tag created successfully!", true);
```

- [ ] **Step 5: Type-check + build**

Run: `cd frontend && npm run build`
Expected: `tsc -b && vite build` succeeds with no type errors. (`fetchData` still returns `Promise<void>`, matching the `WalletContext` type; `applyData`/`loadData`/`runLoad` are inferred.)

- [ ] **Step 6: Lint + full frontend test run**

Run: `cd frontend && npm run lint && npx vitest run`
Expected: lint clean; all tests pass (including `walletDataCache.test.ts`).

- [ ] **Step 7: Manual smoke test**

Run: `cd frontend && npm run dev` (backend must be up on :8080). In the browser, open DevTools → Network, filtered to `/api/`. Verify:
1. Selecting a wallet fires **one** `GET /api/wallets/{id}/dashboard` (not four separate calls) after ~250ms.
2. Switching to another wallet and back **within 60s** fires **no** new request (served from cache).
3. Rapidly clicking through several never-visited wallets fires only the request(s) for the wallet you land on — skipped ones are aborted (look for canceled/aborted requests, not completed ones).
4. Adding/editing/deleting a tag, then switching away and back, triggers **one** fresh `dashboard` request (cache invalidated).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/dashboard/wallet/WalletProvider.tsx
git commit -m "feat(frontend): load wallet data via unified cached endpoint with debounce"
```

- [ ] **Step 9: Update the knowledge graph**

Run: `graphify update .`
(Per CLAUDE.md: keep `graphify-out/` current after code changes in a session.)

---

## Self-Review

**Spec coverage:**
- Aggregate endpoint `GET /api/wallets/{id}/dashboard` → Task 1 (service+DTO) + Task 2 (controller). ✔
- Existing endpoints untouched / MCP unaffected → no edits to Transaction/Subscription/Tag controllers or services. ✔
- Authorization parity (same 403) → delegation to `@PreAuthorize`-guarded methods, verified by param-order test (Task 1) + endpoint test (Task 2). ✔
- Client cache: Map + TTL 60s + in-flight dedup, `peek`/`getWalletData`/`refreshWalletData`/`invalidate` → Task 3. ✔
- 250ms debounce + instant cache-hit render + skip-abort → Task 4 Step 3. ✔
- Force refresh on context `fetchData()` (mutation reload contract) → Task 4 Step 2. ✔
- Invalidate on local mutations → Task 4 Step 4. ✔
- `WalletDashboardData` in `types.ts` → Task 3 Step 1. ✔
- No server-side cache, wallet-list fetch unchanged → out of scope, no tasks (correct). ✔
- Backend test discipline (test + spotless + coverage) → Task 1 Steps 3/5/6, Task 2 Step 6. ✔

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step contains full code. ✔

**Type consistency:** `WalletDashboardData` fields (`wallet`, `transactions`, `subscriptions`, `tags`) identical across `types.ts`, cache module, backend DTO. `getDashboard(walletId, userId)` signature identical in service (Task 1) and controller call (Task 2). Cache exports (`peek`, `getWalletData`, `refreshWalletData`, `invalidate`) consumed with matching names/arity in Task 4. ✔
