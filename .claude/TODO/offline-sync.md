# Offline Sync Rework — Implementation Plan / TODO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> Branch: `feat/offline-sync` — **base: `main`** (confirmed by the user). House rule: one
> branch per task, never commit to `release/*`/`main`; the user merges manually.
> Companion plan: `.claude/TODO/push-notifications.md` (execute AFTER this one — both
> touch `AppHeader` and the PWA plumbing).
> Alignment: this plan deliberately anticipates the offline/overwrite architecture of
> `.claude/TODO/walletEncryptionPlan.md` §8 (domain-ops queue, client-generated UUIDs,
> dirty guard, no silent overwrite, mine/theirs conflict UI) scoped to today's plaintext
> plane. When the E2EE plan's phase 5 runs, it must REUSE the modules built here.

**Goal:** Fix the half-broken offline layer: offline-created items must survive refetch
and reload (today they vanish), every pending item shows a "not synced" icon, replayed
writes can no longer silently overwrite newer server data (409 + Keep mine / Take theirs),
failed replays are surfaced instead of silently dropped, and the UI gets a sync badge +
sync center in the header, an offline banner, and a "N changes synced" toast.

**Architecture:** The raw-HTTP `syncQueue` is replaced by a typed **domain-ops queue**
(Dexie v2 table `ops`: `{walletId, entityType, entityKey, op, payload, baseUpdatedAt,
status}`) restricted to transaction/subscription/tag CRUD + wallet update — everything
else fails fast offline (this also kills the queued-login bug). Creations generate the
UUID **client-side**; the backend honors it via a new `AssignableUuidV7` id generator and
an optional `id` field on the create DTOs (idempotent replay). Reads are **overlaid**: a
pure `applyPendingOps()` merges the queue onto the (cached or fresh) dashboard payload so
pending items always render, flagged `syncState`. Replayed updates/deletes carry the
`baseUpdatedAt` the edit was based on; the server compares it against a new
`@UpdateTimestamp updatedAt` and answers **409 "Stale Write"** instead of overwriting —
the conflict surfaces in the Sync Center with exactly two actions: **Keep mine** /
**Take theirs** (no per-field merge, per user decision).

**Tech Stack:** Spring Boot 3.5 / Java 21 / Hibernate 6.6 / H2 tests; React 19 + TS +
Tailwind 4 + Dexie 4; Vitest + Testing Library + fake-indexeddb; lucide-react icons.

## Global Constraints (apply to every task)

- **English only** — code, comments, UI copy.
- **All endpoints under `/api/...`**. Subscriptions controller path is `/api/subscription`
  (singular) — do not "fix" it. Tags are addressed **by name** in URLs.
- Backend gates: `./gradlew test` green, **add tests for your change**, then
  `./gradlew spotlessApply` and keep `./gradlew check` (Spotless + **≥90% line coverage**)
  passing. Schema evolves via `ddl-auto=update` — **no migration files**.
- Frontend gates (from `frontend/`, same order as CI): `npm run lint` → `npm test` →
  `npm run build`. Tests live under `src/__tests__/` mirroring the source tree. No path
  aliases — relative imports only. Extracted pure logic ships with a Vitest test.
- **UI:** read `frontend/style.md` first. Reuse `components/ui/` primitives (`Button`,
  `ResponsiveOverlay`, `Toggle`, `Card`) — never hand-rolled `<button>`. Theme-aware
  `app-*` tokens, **no colored glow/halos**. Status colours: soft 400-tints
  (amber `#fbbf24` for pending, red `#f87171` for failed/conflict).
- Do **not** kill the running Vite dev server between turns.
- **Behavior invariant when online:** with an empty ops queue every list renders exactly
  what the server returned (the overlay must be an identity function), and normal online
  PUT/DELETE send **no** `baseUpdatedAt` (no new 409s for online users).
- Commit at the end of every task (`feat(scope): ...` / `fix(scope): ...` style).

---

## Confirmed design decisions (from the interview — do not relitigate)

1. Architecture aligned with `walletEncryptionPlan.md` §8, scoped to the plaintext plane.
2. Client-generated UUIDs on create, honored by the backend (anticipates E2EE TODO 3.6).
3. Queue perimeter: `transaction` / `subscription` / `tag` CRUD + `wallet.update` ONLY.
   Auth, members/invites, PATs, CSV bulk import, profile: **fail fast offline** with a
   clear toast. Wallet **delete** (and any high-friction delete) is never queued.
4. Replay overwrite protection: optimistic precondition (`baseUpdatedAt` → 409
   "Stale Write"), **only** on replayed ops; online mutations unchanged.
5. Conflict resolution is a binary choice: **Keep mine** / **Take theirs**. No per-field
   cherry-pick (the user can re-edit manually afterwards).
6. UI: per-row `CloudOff` amber icon (pending) / red alert icon (failed/conflict, click →
   resolution), header badge pill with count opening a Sync Center (`ResponsiveOverlay`)
   with **Sync now**, toast "N changes synced" on completion, auto-refetch of the active
   wallet, and an **offline banner** under the header while disconnected.

---

## Phase A — Backend

### Task 1: `AssignableUuidV7` id generator (honors pre-assigned ids)

Hibernate's `@UuidGenerator(algorithm = UuidV7Generator.class)` **always** overwrites a
pre-set `@Id`. Replace it on `Transaction` and `Subscription` with a generator that keeps
a client-assigned UUID and only generates (UUIDv7) when the id is null. This is the exact
groundwork `walletEncryptionPlan.md` TODO 3.6 asks for.

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/persistence/AssignableUuidV7.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/persistence/AssignableUuidV7Generator.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Transaction.java` (id annotation)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Subscription.java` (id annotation)
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/persistence/AssignableUuidV7GeneratorTest.java`

**Interfaces (Produces):**
- `@AssignableUuidV7` — id-generator annotation usable on any `@Id UUID` field.
- Contract: `save(entity with id == null)` → UUIDv7 generated; `save(entity with id set)`
  → that exact id persisted.

- [ ] **Step 1: Write the failing pinning test**

```java
package dev.busato.FinanceWebApp.backend.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class AssignableUuidV7GeneratorTest {

  @Autowired private WalletRepository walletRepository;
  @Autowired private TransactionRepository transactionRepository;

  private Wallet wallet;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("W");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);
  }

  private Transaction.TransactionBuilder tx() {
    return Transaction.builder()
        .wallet(wallet)
        .name("t")
        .amount(new BigDecimal("1.00"))
        .originalAmount(new BigDecimal("1.00"))
        .type(Transaction.Type.EXPENSE)
        .transactionDate(LocalDate.of(2026, 7, 8));
  }

  @Test
  void honorsClientAssignedId() {
    UUID clientId = UUID.randomUUID();
    Transaction saved = transactionRepository.saveAndFlush(tx().id(clientId).build());
    assertEquals(clientId, saved.getId());
  }

  @Test
  void generatesUuidV7WhenIdAbsent() {
    Transaction saved = transactionRepository.saveAndFlush(tx().build());
    assertNotNull(saved.getId());
    assertEquals(7, saved.getId().version());
  }
}
```

- [ ] **Step 2: Run it — must fail**

Run: `cd backend && ./gradlew test --tests "*.AssignableUuidV7GeneratorTest"`
Expected: `honorsClientAssignedId` FAILS (generated id != clientId) — this pins today's
broken behavior. (If it unexpectedly passes, stop and report: the generator swap may be
unnecessary — do NOT proceed blindly.)

- [ ] **Step 3: Implement annotation + generator**

`AssignableUuidV7.java`:
```java
package dev.busato.FinanceWebApp.backend.persistence;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.hibernate.annotations.IdGeneratorType;

/** UUIDv7 id generator that keeps a client-assigned id when one is already set. */
@IdGeneratorType(AssignableUuidV7Generator.class)
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
public @interface AssignableUuidV7 {}
```

`AssignableUuidV7Generator.java`:
```java
package dev.busato.FinanceWebApp.backend.persistence;

import com.github.f4b6a3.uuid.UuidCreator;
import java.util.EnumSet;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.generator.BeforeExecutionGenerator;
import org.hibernate.generator.EventType;
import org.hibernate.generator.EventTypeSets;

public class AssignableUuidV7Generator implements BeforeExecutionGenerator {

  @Override
  public Object generate(
      SharedSessionContractImplementor session,
      Object owner,
      Object currentValue,
      EventType eventType) {
    return currentValue != null ? currentValue : UuidCreator.getTimeOrderedEpoch();
  }

  @Override
  public EnumSet<EventType> getEventTypes() {
    return EventTypeSets.INSERT_ONLY;
  }

  @Override
  public boolean allowAssignedIdentifiers() {
    return true;
  }
}
```

In `Transaction.java` and `Subscription.java` replace the id annotations:
```java
// before
@Id
@UuidGenerator(algorithm = UuidV7Generator.class)
private UUID id;
// after
@Id
@AssignableUuidV7
private UUID id;
```
(remove the now-unused `org.hibernate.annotations.UuidGenerator` /
`persistence.UuidV7Generator` imports from these two entities only; `UuidV7Generator`
stays — all other entities keep using it).

- [ ] **Step 4: Run the test — both pass**

Run: `cd backend && ./gradlew test --tests "*.AssignableUuidV7GeneratorTest"`
Expected: PASS ×2.

- [ ] **Step 5: Full backend suite + format, then commit**

Run: `./gradlew spotlessApply test`
Expected: green (existing `UuidV7GeneratorTest`/`UuidV7WiringTest` untouched and green).

```bash
git add backend/src
git commit -m "feat(backend): assignable UUIDv7 id generator for Transaction/Subscription"
```

---

### Task 2: `updatedAt` on Transaction / Subscription / Tag, exposed in responses

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Transaction.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Subscription.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Tag.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TransactionResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/SubscriptionResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TagResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/TransactionMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/SubscriptionMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/TagMapper.java`
- Test: extend `backend/src/test/java/dev/busato/FinanceWebApp/backend/persistence/AssignableUuidV7GeneratorTest.java`
  (repository-level timestamp check) + the three mapper/service tests.

**Interfaces (Produces):**
- Entity field on all three: `@UpdateTimestamp @Column private Instant updatedAt;`
  (`@UpdateTimestamp` also fills it on INSERT, so new rows are never null; pre-existing
  rows stay null until their first write — the precondition in Task 4 must tolerate null).
- DTO field on all three responses: `private Instant updatedAt;` mapped in the mappers.

- [ ] **Step 1: Failing test — updatedAt is set on insert and advances on update**

Add to `AssignableUuidV7GeneratorTest` (same fixture):
```java
@Test
void updatedAtIsSetOnInsertAndAdvancesOnUpdate() throws Exception {
  Transaction saved = transactionRepository.saveAndFlush(tx().build());
  assertNotNull(saved.getUpdatedAt());
  java.time.Instant first = saved.getUpdatedAt();
  Thread.sleep(5); // Instant precision guard
  saved.setName("renamed");
  Transaction updated = transactionRepository.saveAndFlush(saved);
  org.junit.jupiter.api.Assertions.assertTrue(updated.getUpdatedAt().isAfter(first));
}
```
Run: `./gradlew test --tests "*.AssignableUuidV7GeneratorTest"` → compile FAILS
(`getUpdatedAt` undefined).

- [ ] **Step 2: Add the entity fields**

In each of `Transaction.java`, `Subscription.java`, `Tag.java`:
```java
import java.time.Instant;
import org.hibernate.annotations.UpdateTimestamp;
// ...
/** Server-side last-write timestamp; optimistic precondition for offline replays. */
@UpdateTimestamp
@Column
private Instant updatedAt;
```

- [ ] **Step 3: Expose in DTOs + mappers**

Add `private Instant updatedAt;` to `TransactionResponse`, `SubscriptionResponse`,
`TagResponse`. In each mapper's `mapToResponse(...)` builder chain add
`.updatedAt(entity.getUpdatedAt())`.

- [ ] **Step 4: Run affected tests**

Run: `./gradlew test --tests "*.AssignableUuidV7GeneratorTest" --tests "*MapperTest*"`
Expected: PASS. If mapper tests assert exhaustive field equality, update them to include
`updatedAt`.

- [ ] **Step 5: Full suite, format, commit**

```bash
./gradlew spotlessApply test
git add backend/src
git commit -m "feat(backend): updatedAt timestamps on Transaction/Subscription/Tag"
```

---

### Task 3: optional client `id` on create (idempotent replay)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TransactionRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/SubscriptionRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/TransactionService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SubscriptionService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/TransactionServiceTest.java`,
  `.../service/SubscriptionServiceTest.java`

**Interfaces (Produces):**
- `TransactionRequest.id : UUID` (nullable) and `SubscriptionRequest.id : UUID` (nullable).
- `createTransaction` / `createSubscription` semantics: `id == null` → server generates
  (unchanged); `id != null` and unknown → insert with that id; `id != null` and **already
  exists in this wallet** → return the existing row unchanged (idempotent replay), do NOT
  update it.

- [ ] **Step 1: Failing service tests (Mockito style, matching the existing suite)**

Add to `TransactionServiceTest`:
```java
@Test
void createTransaction_withClientId_setsIdOnEntity() {
  UUID clientId = UUID.randomUUID();
  TransactionRequest request =
      TransactionRequest.builder()
          .id(clientId)
          .name("Coffee")
          .amount(new BigDecimal("2.50"))
          .originalAmount(new BigDecimal("2.50"))
          .type("EXPENSE")
          .transactionDate(LocalDate.of(2026, 7, 8))
          .build();
  when(transactionRepository.existsByIdAndWalletId(clientId, walletId)).thenReturn(false);
  // reuse the suite's existing happy-path stubbing for wallet lookup + save + mapper
  transactionService.createTransaction(request, walletId, userId);
  ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
  verify(transactionRepository).save(captor.capture());
  assertEquals(clientId, captor.getValue().getId());
}

@Test
void createTransaction_withExistingClientId_isIdempotentAndDoesNotSave() {
  UUID clientId = UUID.randomUUID();
  TransactionRequest request = TransactionRequest.builder().id(clientId).name("x").build();
  Transaction existing = Transaction.builder().id(clientId).build();
  when(transactionRepository.existsByIdAndWalletId(clientId, walletId)).thenReturn(true);
  when(transactionRepository.findById(clientId)).thenReturn(Optional.of(existing));
  transactionService.createTransaction(request, walletId, userId);
  verify(transactionRepository, never()).save(any());
  verify(transactionMapper).mapToResponse(existing);
}
```
Mirror both tests in `SubscriptionServiceTest` (builder fields per its existing tests).
Run: `./gradlew test --tests "*.TransactionServiceTest"` → FAILS (no `id` on the DTO,
no `existsByIdAndWalletId`).

- [ ] **Step 2: Implement**

DTOs — add as first field:
```java
/** Optional client-generated id (offline-created entities); honored on insert. */
private UUID id;
```

`TransactionRepository` — add:
```java
boolean existsByIdAndWalletId(UUID id, UUID walletId);
```
(same on `SubscriptionRepository`).

`TransactionService.createTransaction(...)` — at the top of the method body:
```java
if (request.getId() != null
    && transactionRepository.existsByIdAndWalletId(request.getId(), walletId)) {
  // Idempotent offline replay: the row already landed in a previous attempt.
  return transactionMapper.mapToResponse(
      transactionRepository.findById(request.getId()).orElseThrow());
}
```
and in the entity `Transaction.builder()` chain add `.id(request.getId())`.
Mirror in `SubscriptionService.createSubscription`. **Ignore `request.getId()` in the
`update*` methods** (updates address the path id).

- [ ] **Step 3: Run tests**

Run: `./gradlew test --tests "*.TransactionServiceTest" --tests "*.SubscriptionServiceTest"`
Expected: PASS.

- [ ] **Step 4: Full suite, format, commit**

```bash
./gradlew spotlessApply test
git add backend/src
git commit -m "feat(backend): honor optional client-generated id on create (idempotent offline replay)"
```

---

### Task 4: `baseUpdatedAt` precondition → 409 "Stale Write"

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/exceptions/StaleWriteException.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TransactionRequest.java`,
  `.../dto/SubscriptionRequest.java`, `.../dto/TagRequest.java` (add `baseUpdatedAt`)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/TransactionService.java`,
  `.../service/SubscriptionService.java`, `.../service/TagService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/TransactionController.java`,
  `.../controller/SubscriptionController.java`, `.../controller/TagController.java`
  (delete endpoints gain optional `baseUpdatedAt` query param)
- Test: the three service test classes.

**Interfaces (Produces):**
- Request DTO field (all three): `private Instant baseUpdatedAt;` — nullable; **only sent
  by the offline replay engine**, never by regular online mutations.
- Delete endpoints: `@RequestParam(required = false) Instant baseUpdatedAt`, threaded to
  the service; service delete signatures gain a trailing `Instant baseUpdatedAt` param:
  `deleteTransaction(UUID transactionId, UUID walletId, UUID userId, Instant baseUpdatedAt)`,
  `deleteSubscription(UUID subscriptionId, UUID walletId, UUID userId, Instant baseUpdatedAt)`,
  `deleteTag(String tagName, UUID walletId, UUID userId, Instant baseUpdatedAt)`.
- Rule (identical in all update/delete paths), evaluated AFTER loading the entity and
  BEFORE mutating:
  `baseUpdatedAt != null && entity.updatedAt != null && entity.updatedAt.isAfter(baseUpdatedAt)`
  → `throw new StaleWriteException(...)` → HTTP **409**, ProblemDetail **title
  `"Stale Write"`** (the frontend matches on this exact title).

- [ ] **Step 1: Failing tests (one per service; transaction shown, mirror the others)**

```java
@Test
void updateTransaction_staleBaseUpdatedAt_throwsStaleWrite() {
  UUID txId = UUID.randomUUID();
  Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
  Transaction existing = Transaction.builder().id(txId).updatedAt(serverTime).build();
  // reuse the suite's existing stubbing that makes updateTransaction reach the entity
  when(transactionRepository.findById(txId)).thenReturn(Optional.of(existing));
  TransactionRequest request =
      TransactionRequest.builder()
          .name("x")
          .baseUpdatedAt(serverTime.minusSeconds(60)) // older than the server row
          .build();
  assertThrows(
      StaleWriteException.class,
      () -> transactionService.updateTransaction(txId, request, walletId, userId));
  verify(transactionRepository, never()).save(any());
}

@Test
void updateTransaction_nullBaseUpdatedAt_skipsPrecondition() {
  // same stubbing, request WITHOUT baseUpdatedAt → must update normally (LWW like today)
}

@Test
void deleteTransaction_staleBaseUpdatedAt_throwsStaleWrite() {
  // findById → entity with updatedAt = now; delete with baseUpdatedAt = now-60s
  // → StaleWriteException, repository.delete never called
}
```
Run → compile FAILS.

- [ ] **Step 2: Exception + handler**

`StaleWriteException.java`:
```java
package dev.busato.FinanceWebApp.backend.exceptions;

public class StaleWriteException extends RuntimeException {
  public StaleWriteException(String entityKind) {
    super("This " + entityKind + " changed on the server after your offline edit was made.");
  }
}
```

`GlobalExceptionHandler.java` — add next to the other 409 handlers:
```java
@ExceptionHandler(StaleWriteException.class)
public ResponseEntity<ProblemDetail> handleStaleWriteException(
    StaleWriteException ex, HttpServletRequest request) {
  return buildErrorResponse(ex, HttpStatus.CONFLICT, "Stale Write", request);
}
```

- [ ] **Step 3: DTO fields + service checks + controller params**

DTOs (all three requests):
```java
/** updatedAt the offline edit was based on; server rejects with 409 if newer. */
private Instant baseUpdatedAt;
```

Shared check, pasted after the entity is loaded in `updateTransaction`,
`deleteTransaction`, `updateSubscription`, `deleteSubscription`, `updateTag`,
`deleteTag` (for deletes the value comes from the new method param, for updates from
`request.getBaseUpdatedAt()`):
```java
if (baseUpdatedAt != null
    && entity.getUpdatedAt() != null
    && entity.getUpdatedAt().isAfter(baseUpdatedAt)) {
  throw new StaleWriteException("transaction"); // "subscription" / "tag" respectively
}
```

Controllers — delete mappings gain the optional param and forward it, e.g.
`TransactionController`:
```java
@DeleteMapping("/{walletID}/{transactionID}")
public ResponseEntity<Void> deleteTransaction(
    @PathVariable UUID walletID,
    @PathVariable UUID transactionID,
    @RequestParam(required = false) Instant baseUpdatedAt,
    @AuthenticationPrincipal User user) {
  transactionService.deleteTransaction(transactionID, walletID, user.getId(), baseUpdatedAt);
  return ResponseEntity.noContent().build();
}
```
(Spring parses ISO-8601 strings into `Instant` query params out of the box.)
Existing service callers/tests of the old 3-arg delete signatures: update them to pass
`null`.

- [ ] **Step 4: Run the three service test classes**

Run: `./gradlew test --tests "*.TransactionServiceTest" --tests "*.SubscriptionServiceTest" --tests "*.TagServiceTest"`
Expected: PASS (new + pre-existing).

- [ ] **Step 5: Full suite + coverage gate, format, commit**

```bash
./gradlew spotlessApply check
git add backend/src
git commit -m "feat(backend): 409 Stale Write precondition for offline replays (baseUpdatedAt)"
```

---

## Phase B — Frontend: queue + overlay foundations

### Task 5: Dexie v2 — typed domain-ops table + `opsQueue` module with coalescing

**Files:**
- Modify: `frontend/src/utils/offlineDb.ts`
- Create: `frontend/src/sync/opsQueue.ts`
- Test: `frontend/src/__tests__/sync/opsQueue.test.ts` (real Dexie via `fake-indexeddb`,
  same pattern as `src/__tests__/utils/offlineDb.test.ts`)

**Interfaces (Produces — everything later tasks import):**

```ts
// offlineDb.ts additions
export type OpEntityType = "transaction" | "subscription" | "tag" | "wallet";
export type OpKind = "create" | "update" | "delete";
export type OpStatus = "pending" | "syncing" | "failed" | "conflict";
export type ConflictKind = "stale" | "missing";

export interface PendingOp {
  id?: number;
  walletId: string;
  entityType: OpEntityType;
  /** UUID for transaction/subscription, tag NAME for tags, walletId for wallet ops. */
  entityKey: string;
  op: OpKind;
  payload: Record<string, unknown>;
  /** Server updatedAt the edit was based on (ISO string) — precondition on replay. */
  baseUpdatedAt: string | null;
  status: OpStatus;
  conflictKind?: ConflictKind;
  lastError?: string;
  attempts: number;
  createdAt: number;
}

// opsQueue.ts
export const SYNC_QUEUE_CHANGED = "sync-queue-changed"; // window CustomEvent, no detail
export async function enqueueOp(op: Omit<PendingOp, "id" | "status" | "attempts" | "createdAt">): Promise<void>;
export async function listOps(walletId?: string): Promise<PendingOp[]>;       // FIFO by id
export async function countByStatus(): Promise<Record<OpStatus, number>>;
export async function updateOp(id: number, patch: Partial<PendingOp>): Promise<void>;
export async function removeOp(id: number): Promise<void>;
```

- [ ] **Step 1: Dexie schema v2**

In `offlineDb.ts` (keep `CacheItem`; delete the `SyncQueueItem` interface and the
`syncQueue` table property; add the types above and `ops!: Table<PendingOp, number>`):
```ts
constructor() {
  super("FinanceAppOffline");
  this.version(1).stores({
    cache: "url",
    syncQueue: "++id, createdAt",
  });
  // v2: raw-HTTP syncQueue → typed domain ops. Old raw entries are dropped on
  // upgrade (they cannot be classified retroactively; accepted one-time loss).
  this.version(2).stores({
    cache: "url",
    syncQueue: null,
    ops: "++id, walletId, status, createdAt",
  });
}
```

- [ ] **Step 2: Failing tests for the coalescing rules**

The queue holds AT MOST ONE op per `(entityType, entityKey)` — coalescing on enqueue:

| existing → incoming | result |
|---|---|
| create + update | one `create`, payload `{...create.payload, ...update.payload}` |
| create + delete | **both removed** (net zero — item never reached the server) |
| update + update | one `update`, latest payload, **keeps the FIRST `baseUpdatedAt`** |
| update + delete | one `delete`, keeps the first `baseUpdatedAt` |
| none + anything | plain append |

```ts
// src/__tests__/sync/opsQueue.test.ts
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
    await enqueueOp({ ...base, op: "update", baseUpdatedAt: "2026-07-08T11:00:00Z", payload: { amount: 3 } });
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
```
Run: `npm test -- opsQueue` → FAIL (module missing).

- [ ] **Step 3: Implement `src/sync/opsQueue.ts`**

```ts
// Typed offline mutation queue (domain ops), aligned with the future e2ee sync plane
// (walletEncryptionPlan §8.3). At most one op per (entityType, entityKey).
import { offlineDb, type PendingOp, type OpStatus } from "../utils/offlineDb";

export const SYNC_QUEUE_CHANGED = "sync-queue-changed";

const notify = () => window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGED));

export async function enqueueOp(
  op: Omit<PendingOp, "id" | "status" | "attempts" | "createdAt">,
): Promise<void> {
  await offlineDb.transaction("rw", offlineDb.ops, async () => {
    const existing = await offlineDb.ops
      .where("walletId")
      .equals(op.walletId)
      .filter((o) => o.entityType === op.entityType && o.entityKey === op.entityKey)
      .first();

    if (!existing) {
      await offlineDb.ops.add({ ...op, status: "pending", attempts: 0, createdAt: Date.now() });
      return;
    }
    if (existing.op === "create" && op.op === "update") {
      await offlineDb.ops.update(existing.id!, {
        payload: { ...existing.payload, ...op.payload },
        status: "pending",
      });
      return;
    }
    if (existing.op === "create" && op.op === "delete") {
      await offlineDb.ops.delete(existing.id!);
      return;
    }
    if (existing.op === "update" && op.op === "update") {
      await offlineDb.ops.update(existing.id!, { payload: op.payload, status: "pending" });
      return;
    }
    if (existing.op === "update" && op.op === "delete") {
      await offlineDb.ops.update(existing.id!, { op: "delete", payload: {}, status: "pending" });
      return;
    }
    // delete + anything, or unexpected combos: append defensively.
    await offlineDb.ops.add({ ...op, status: "pending", attempts: 0, createdAt: Date.now() });
  });
  notify();
}

export async function listOps(walletId?: string): Promise<PendingOp[]> {
  const all = await offlineDb.ops.orderBy("id").toArray();
  return walletId ? all.filter((o) => o.walletId === walletId) : all;
}

export async function countByStatus(): Promise<Record<OpStatus, number>> {
  const counts: Record<OpStatus, number> = { pending: 0, syncing: 0, failed: 0, conflict: 0 };
  for (const op of await offlineDb.ops.toArray()) counts[op.status]++;
  return counts;
}

export async function updateOp(id: number, patch: Partial<PendingOp>): Promise<void> {
  await offlineDb.ops.update(id, patch);
  notify();
}

export async function removeOp(id: number): Promise<void> {
  await offlineDb.ops.delete(id);
  notify();
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- opsQueue` → PASS. Also `npm test -- offlineDb` (existing test may
reference `syncQueue` — update it to the v2 schema: assert `ops` exists and `syncQueue`
is gone).

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): Dexie v2 typed domain-ops queue with coalescing"
```

---

### Task 6: strip generic mutation queueing from `axiosConfig` (fixes queued-login bug)

**Files:**
- Modify: `frontend/src/api/axiosConfig.ts`
- Modify: `frontend/src/types/axios.ts`
- Test: `frontend/src/__tests__/api/axiosConfig.test.ts`

**Interfaces:**
- Consumes: nothing new. Produces: offline **GET → Dexie cache fallback stays exactly as
  is**; offline POST/PUT/DELETE now **reject with the network error** (callers decide;
  `walletOps` from Task 7 is the only queueing path). `isOfflineQueueMock`,
  `offline-sync-queued`, `isSyncRequest`, `skipOfflineQueue` all disappear.

- [ ] **Step 1: Update the tests first**

In `axiosConfig.test.ts`: delete/replace the specs that assert POST-queueing and the
mock response (`isOfflineQueueMock`, `syncQueue.add`, `offline-sync-queued`); add:
```ts
it("rejects offline mutations instead of queueing them", async () => {
  // simulate network error on POST via the mocked adapter/onLine=false helper
  await expect(api.post("/auth/login", { u: "x" })).rejects.toBeTruthy();
  expect(offlineDb.syncQueue?.add ?? vi.fn()).not.toHaveBeenCalled();
});
```
Keep (and re-run) the GET-cache fallback specs unchanged.
Run: `npm test -- axiosConfig` → FAIL (queueing still active).

- [ ] **Step 2: Implement**

In `axiosConfig.ts` response-error interceptor: keep the 401-refresh block and the
`isNetworkError` GET-cache block; **delete the whole `else if (["POST","PUT","DELETE"]...)`
branch** (the `syncQueue.add`, mock response, and `offline-sync-queued` dispatch — old
lines ~174-214). Remove the now-unused import if any. In `src/types/axios.ts` drop the
`isSyncRequest`/`skipOfflineQueue` augmentations (grep for remaining usages:
`syncService.ts` still references `isSyncRequest` — it is rewritten in Task 10; leave a
`// removed in offline-sync rework` note there only if the build would break, otherwise
fix it in the same commit by removing the flag from the call).

- [ ] **Step 3: Run**

`npm test -- axiosConfig` → PASS. `npm run build` → must still compile (if
`syncService.ts` breaks on the removed flag, remove the flag usage there now).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "fix(frontend): stop queueing arbitrary offline mutations (kills queued-login bug)"
```

---

### Task 7: `overlay.ts` (pending-ops merge) + type extensions

**Files:**
- Modify: `frontend/src/utils/types.ts`
- Create: `frontend/src/sync/overlay.ts`
- Test: `frontend/src/__tests__/sync/overlay.test.ts`

**Interfaces (Produces):**
```ts
// types.ts additions
export type SyncState = "pending" | "failed" | "conflict";
// Transaction, Subscription, Tag each gain:
//   updatedAt?: string;
//   syncState?: SyncState;

// overlay.ts
export function applyPendingOps(
  data: WalletDashboardData,
  ops: PendingOp[],
): WalletDashboardData;
```
Rules (pure function, ops applied FIFO):
- `transaction`/`subscription` `create` → append an entity built from the payload:
  `{ id: entityKey, ...payload, tag: resolveTagByName(payload.tag, data.tags), syncState }`
  (`resolveTagByName` falls back to `{name: payload.tag ?? "—", icon: "faTags",
  colorHex: "#9ca3af"}` when the tag isn't in the list, e.g. tag itself pending).
- `update` → map over the list, spread payload onto the matching id, set `syncState`,
  re-resolving `tag` when `payload.tag` is present.
- `delete` → filter the matching id out (a deletion pending sync disappears immediately;
  its op stays visible in the Sync Center).
- `tag` ops key on **name** (`entityKey` = original name; renames carry `payload.name`);
  tag delete also drops children (`parentName === entityKey`), mirroring
  `WalletProvider.handleDeleteTag`.
- `wallet` update → spread payload onto `data.wallet`.
- `op.status` maps to `syncState`: `conflict` → `"conflict"`, `failed` → `"failed"`,
  else `"pending"`.
- **Identity invariant:** `applyPendingOps(data, [])` returns the SAME array references
  (`===`) — WalletProvider tests rely on it.

- [ ] **Step 1: Failing tests**

```ts
// src/__tests__/sync/overlay.test.ts — condensed spec list, write them all:
// 1. empty ops → returns identical references (toBe on data.transactions etc.)
// 2. transaction create appends entity with id=entityKey, resolved tag, syncState "pending"
// 3. transaction update merges payload onto matching id and flags syncState
// 4. transaction delete removes the row
// 5. tag create appends; transaction create with that pending tag resolves it
// 6. tag rename (entityKey "Food", payload.name "Meals") renames tag AND leaves
//    transactions' embedded tag objects untouched (server refetch will fix linkage)
// 7. tag delete drops the tag and its children (parentName match)
// 8. wallet update overrides wallet fields
// 9. op with status "conflict" flags syncState "conflict"
```
Write each as a real `it(...)` with explicit fixture objects (a `WalletDashboardData`
with 2 transactions / 1 subscription / 2 tags is enough for all nine).
Run: `npm test -- overlay` → FAIL.

- [ ] **Step 2: Implement `src/sync/overlay.ts`** (pure, no imports beyond types)

Implementation sketch the tests force (final code must satisfy every rule above):
```ts
import type { PendingOp } from "../utils/offlineDb";
import type { SyncState, Tag, Transaction, WalletDashboardData } from "../utils/types";

const stateOf = (op: PendingOp): SyncState =>
  op.status === "conflict" ? "conflict" : op.status === "failed" ? "failed" : "pending";

const resolveTag = (name: unknown, tags: Tag[]): Tag =>
  tags.find((t) => t.name === name) ?? {
    name: typeof name === "string" ? name : "—",
    icon: "faTags",
    colorHex: "#9ca3af",
  };

export function applyPendingOps(data: WalletDashboardData, ops: PendingOp[]): WalletDashboardData {
  if (ops.length === 0) return data;
  let { wallet, transactions, subscriptions, tags } = data;
  for (const op of ops) {
    // ...per-entityType switch implementing the rules table...
  }
  return { wallet, transactions, subscriptions, tags };
}
```

- [ ] **Step 3: Run tests** — `npm test -- overlay` → PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): pending-ops overlay merges offline queue into dashboard reads"
```

---

### Task 8: `walletOps.ts` — typed mutation API with offline fallback

**Files:**
- Create: `frontend/src/api/walletOps.ts`
- Test: `frontend/src/__tests__/api/walletOps.test.ts` (mock `../../api/axiosConfig` and
  `../../sync/opsQueue` with `vi.mock`, same pattern as `WalletProvider.test.tsx`)

**Interfaces (Produces — the ONLY mutation path callers use from Task 9 on):**
```ts
export interface OpResult<T = unknown> { queued: boolean; data: T | null; }

export function createTransaction(walletId: string, payload: Record<string, unknown>): Promise<OpResult>;
export function updateTransaction(walletId: string, id: string, payload: Record<string, unknown>, baseUpdatedAt: string | null): Promise<OpResult>;
export function deleteTransaction(walletId: string, id: string, baseUpdatedAt: string | null): Promise<OpResult>;
export function createSubscription(walletId: string, payload: Record<string, unknown>): Promise<OpResult>;
export function updateSubscription(walletId: string, id: string, payload: Record<string, unknown>, baseUpdatedAt: string | null): Promise<OpResult>;
export function deleteSubscription(walletId: string, id: string, baseUpdatedAt: string | null): Promise<OpResult>;
export function createTag(walletId: string, payload: Record<string, unknown>): Promise<OpResult>;
export function updateTag(walletId: string, tagName: string, payload: Record<string, unknown>, baseUpdatedAt: string | null): Promise<OpResult>;
export function deleteTag(walletId: string, tagName: string, baseUpdatedAt: string | null): Promise<OpResult>;
export function updateWallet(walletId: string, payload: Record<string, unknown>): Promise<OpResult>;
```
Behavior (identical shape in all ten):
1. Try the normal axios call (POST `/transactions/{walletId}`, PUT
   `/transactions/{walletId}/{id}`, DELETE `/transactions/{walletId}/{id}`, PUT/POST
   `/subscription/...` (singular!), `/tags/{walletId}/{encodeURIComponent(name)}`,
   PUT `/wallets/{walletId}`). **Online calls never send `baseUpdatedAt`** (it is only
   stored on the queued op).
2. On success → `{queued: false, data: res.data}`.
3. On **network error only** (`!err.response || code === "ERR_NETWORK" ||
   !navigator.onLine` — export a tiny `isNetworkError(err)` helper) →
   `enqueueOp(...)` and return `{queued: true, data: null}`. Creates generate
   `entityKey = crypto.randomUUID()` for tx/sub and **include it in the queued payload as
   `id`**; tag creates use `payload.name` as entityKey; deletes queue `payload: {}`.
4. Any other error → rethrow (callers keep their existing toast handling).

- [ ] **Step 1: Failing tests** — cover: online create passes through and does NOT
  enqueue; offline create enqueues with a UUID `entityKey` mirrored into `payload.id`;
  offline update stores `baseUpdatedAt`; offline delete of a tag keys on name; a 400
  response rethrows without enqueueing. (5 specs, mock `api.post/put/delete` with
  `mockRejectedValue({code: "ERR_NETWORK"})` for the offline cases.)
  Run: `npm test -- walletOps` → FAIL.

- [ ] **Step 2: Implement** (straight mapping; ~90 lines; every function delegates to two
  private helpers `mutateOnline(...)` + `queueOffline(...)`).

- [ ] **Step 3: Run tests** — PASS. **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): walletOps typed mutation layer with offline enqueue"
```

---

## Phase C — Frontend: wiring, replay, UI

### Task 9: rewire callers + WalletProvider overlay integration

**Files:**
- Modify: `frontend/src/dashboard/wallet/WalletProvider.tsx`
- Modify: `frontend/src/modals/TransactionModal/TransactionModal.tsx`
- Modify: `frontend/src/dashboard/transaction/TransactionsTable.tsx`
- Modify: `frontend/src/dashboard/subscription/SubscriptionTab.tsx` (generated-tx delete)
- Modify: `frontend/src/modals/subscription/SubscriptionModal.tsx`
- Modify: `frontend/src/modals/subscription/SubscriptionDetailsModal.tsx`
- Test: extend `frontend/src/__tests__/dashboard/wallet/WalletProvider.test.tsx` +
  the modal/table test files that exist for the touched components.

**Interfaces:**
- Consumes: `walletOps.*` (Task 8), `applyPendingOps` (Task 7), `listOps` +
  `SYNC_QUEUE_CHANGED` (Task 5).
- Produces: context values `transactions`/`subscriptions`/`tags`/`wallet` are now the
  **overlaid** lists; entities may carry `syncState`. Everything else on the context is
  unchanged (existing tests are the spec).

- [ ] **Step 1: WalletProvider — failing test**

```ts
it("overlays pending ops onto served data and refreshes on queue events", async () => {
  (listOps as Mock).mockResolvedValue([
    { id: 1, walletId: "w1", entityType: "transaction", entityKey: "tmp-1",
      op: "create", payload: { name: "Offline coffee", amount: 2, type: "EXPENSE",
      tag: "Food", transactionDate: "2026-07-08" },
      baseUpdatedAt: null, status: "pending", attempts: 0, createdAt: 1 },
  ]);
  // render provider with mocked getWalletData resolving the usual fixture
  // assert context.transactions contains "Offline coffee" with syncState "pending"
});
it("keeps identical arrays when the queue is empty", async () => { /* toBe check */ });
```
(mock `../../sync/opsQueue` at module level like the other mocks in this file).

- [ ] **Step 2: Implement in WalletProvider**

- New state: `const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);`
- Load + subscribe:
```ts
useEffect(() => {
  let alive = true;
  const refresh = () => listOps(_wallet.id).then((o) => alive && setPendingOps(o));
  refresh();
  window.addEventListener(SYNC_QUEUE_CHANGED, refresh);
  return () => { alive = false; window.removeEventListener(SYNC_QUEUE_CHANGED, refresh); };
}, [_wallet.id]);
```
- Refetch after replay:
```ts
useEffect(() => {
  const onSynced = () => fetchData();
  window.addEventListener("offline-sync-complete", onSynced);
  return () => window.removeEventListener("offline-sync-complete", onSynced);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [_wallet.id]);
```
- Overlay before exposing:
```ts
const overlaid = useMemo(
  () => applyPendingOps({ wallet, transactions, subscriptions, tags }, pendingOps),
  [wallet, transactions, subscriptions, tags, pendingOps],
);
```
Feed `overlaid.transactions` into the existing `filteredTransactions` memo and expose
`overlaid.*` on the context. `handleAddTag`/`handleUpdateTag`/`handleDeleteTag`/
`handleUpdateWallet` switch from raw `api.*` to `walletOps.*`; on `{queued: true}` they
skip the local `setTags`/`setWallet` mutation (the overlay renders the change) and toast
`"Saved offline — will sync when you're back online"` (`triggerToast(..., true)`);
`handleUpdateTag`/`handleDeleteTag` pass `baseUpdatedAt = tag.updatedAt ?? null` looked
up from the current `tags` state; on `{queued: false}` behavior is byte-identical to
today.

- [ ] **Step 3: Modals/table swap to walletOps**

- `TransactionModal.handleSave`: replace the two `api.put/post` calls with
  `walletOps.updateTransaction(wallet.id, editingTxId, payload, editingTx?.updatedAt ?? null)`
  / `walletOps.createTransaction(wallet.id, payload)` (keep a `editingTx` ref when
  `openModal(tx)` is called, to read `updatedAt`). Keep `onSuccess()` + close unchanged.
- `TransactionsTable.onSuccessDelete`: `walletOps.deleteTransaction(wallet.id, id,
  tx.updatedAt ?? null)` (the row object is in scope where the delete is launched).
- `SubscriptionTab` generated-tx delete: same swap.
- `SubscriptionModal.handleSave` / `SubscriptionDetailsModal.handleConfirmDelete`: same
  pattern with the subscription functions.
- CSV bulk import (`DataTab`) is intentionally NOT touched — offline it now surfaces the
  plain network-error toast (decision #3).

- [ ] **Step 4: Run the full frontend gate**

Run: `npm run lint && npm test && npm run build`
Expected: green; pre-existing modal/table/provider tests unchanged and passing (behavior
online is invariant).

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): route wallet mutations through walletOps and overlay pending ops"
```

---

### Task 10: replay engine (`src/sync/replay.ts`, replaces `utils/syncService.ts`)

**Files:**
- Create: `frontend/src/sync/replay.ts`
- Delete: `frontend/src/utils/syncService.ts` (move `initSync` here)
- Modify: `frontend/src/App.tsx` (import `initSync` from `../sync/replay` — actual path
  `./sync/replay`)
- Modify: `frontend/src/api/walletDataCache.ts` — export already has `invalidate`; no
  change unless missing.
- Test: `frontend/src/__tests__/sync/replay.test.ts` (port + extend the specs from
  `src/__tests__/utils/syncService.test.ts`, then delete that file)

**Interfaces (Produces):**
```ts
export const OFFLINE_SYNC_COMPLETE = "offline-sync-complete";
// CustomEvent detail: { synced: number; failed: number; conflicts: number }
export async function replaySync(): Promise<void>;   // no-op if offline or already running
export function initSync(): void;                     // online listener + delayed boot replay
export function classifyReplayError(op: PendingOp, err: unknown):
  | { kind: "offline" } | { kind: "conflict"; conflictKind: ConflictKind }
  | { kind: "failed"; message: string } | { kind: "gone-already" };
```

Replay algorithm (FIFO over `listOps()`, statuses `pending` only — `failed`/`conflict`
wait for user action):
1. Mark op `syncing`. Build the request from the op:
   - `create` → POST with `payload` (which contains the client `id` for tx/sub).
   - `update` → PUT with `{...payload, baseUpdatedAt: op.baseUpdatedAt ?? undefined}`.
   - `delete` → DELETE with `?baseUpdatedAt=` query param when present
     (`params: { baseUpdatedAt: op.baseUpdatedAt ?? undefined }`).
   - URLs identical to `walletOps` (tags URL-encode the name; subscription path singular).
2. Success → `removeOp`, `synced++`, remember `op.walletId` in a `Set` for invalidation.
3. Error → `classifyReplayError`:
   - network error → `{kind:"offline"}`: revert op to `pending`, **stop the whole loop**.
   - ProblemDetail title `"Stale Write"` (via `getApiErrorTitle`) → conflict `"stale"`.
   - `op.op === "update"` and (status 404, or status 409 with detail matching
     `/not found/i`) → conflict `"missing"` (remote deleted what we edited).
   - `op.op === "delete"` and any non-stale 4xx → `{kind:"gone-already"}` → treat as
     success (idempotent delete), `removeOp`.
   - any other 4xx → `{kind:"failed"}` with `getApiErrorDetail` message; 5xx → keep
     `pending` and stop (server trouble; retry next round).
   Conflicts/failed: `updateOp(id, {status, conflictKind?, lastError, attempts: +1})`.
4. After the loop: `invalidate(walletId)` for every touched wallet, dispatch
   `OFFLINE_SYNC_COMPLETE` with the counters, and when `synced > 0` fire
   `triggerToast(\`${synced} offline ${synced === 1 ? "change" : "changes"} synced\`, true)`.
5. Module guard `let running = false` (re-entrancy); `window.addEventListener("online",
  replaySync)` at module scope; `initSync()` keeps the 2 s boot delay.

- [ ] **Step 1: Failing tests** — specs to write (mock `api`, `opsQueue`, `walletDataCache`,
  `ToastNotification`):
  1. replays a create via POST to `/transactions/w1` and removes the op;
  2. update sends `baseUpdatedAt` in the body; delete sends it as query param;
  3. 409 "Stale Write" → op marked `conflict/stale`, loop continues to next op;
  4. update on 404 → `conflict/missing`;
  5. delete on 409 non-stale → op removed (gone-already);
  6. network error mid-loop → current op back to `pending`, later ops untouched, no event... 
     correction: event IS dispatched with the partial counters — assert `synced` count;
  7. toast fired once with "2 offline changes synced";
  8. re-entrancy: second concurrent `replaySync()` returns immediately.
  Run: `npm test -- replay` → FAIL.

- [ ] **Step 2: Implement `replay.ts`** per the algorithm (≈120 lines). Delete
  `utils/syncService.ts`, update `App.tsx` import, delete the old syncService test.

- [ ] **Step 3: Run the full gate** — `npm run lint && npm test && npm run build` → green.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): domain-ops replay engine with stale/missing conflict classification"
```

---

### Task 11: sync UI — row icons, header badge, Sync Center, offline banner

**Files:**
- Create: `frontend/src/hooks/useOnlineStatus.ts`
- Create: `frontend/src/hooks/useSyncStatus.ts`
- Create: `frontend/src/components/ui/OfflineBanner.tsx`
- Create: `frontend/src/header/SyncStatusBadge.tsx`
- Create: `frontend/src/header/SyncCenterOverlay.tsx`
- Modify: `frontend/src/header/AppHeader.tsx`
- Modify: `frontend/src/dashboard/transaction/TransactionRow.tsx`
- Modify: `frontend/src/dashboard/subscription/SubscriptionCard.tsx`
- Modify: `frontend/src/dashboard/tag/CategoryParentRow.tsx` (+ `CategoryChildRow.tsx`)
- Test: `frontend/src/__tests__/hooks/useOnlineStatus.test.tsx`,
  `.../hooks/useSyncStatus.test.tsx`, `.../header/SyncCenterOverlay.test.tsx`,
  `.../components/ui/OfflineBanner.test.tsx`, plus one row-icon assertion in the
  existing `TransactionRow`-covering test (or a new small one).

**Interfaces:**
```ts
// useOnlineStatus.ts
export function useOnlineStatus(): boolean; // navigator.onLine + online/offline listeners

// useSyncStatus.ts
export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  counts: Record<OpStatus, number>;
  ops: PendingOp[];
  syncNow: () => Promise<void>;                        // replaySync()
  retryOp: (op: PendingOp) => Promise<void>;           // status → pending, then replaySync
  discardOp: (op: PendingOp) => Promise<void>;         // removeOp + invalidate + dispatch OFFLINE_SYNC_COMPLETE(detail zeros)
  resolveConflict: (op: PendingOp, choice: "mine" | "theirs") => Promise<void>;
}
export function useSyncStatus(): SyncStatus;
```
`resolveConflict` semantics (the core of the mine/theirs decision):
- `"theirs"` → `discardOp(op)` (server version wins; provider refetch restores it).
- `"mine"` + `conflictKind === "stale"` → `updateOp(id, {baseUpdatedAt: null,
  status: "pending", conflictKind: undefined})` then `replaySync()` (unconditional
  overwrite, explicit user choice).
- `"mine"` + `conflictKind === "missing"` (update on a remotely-deleted row) →
  `updateOp(id, {op: "create", status: "pending", conflictKind: undefined})` then
  `replaySync()` — recreation works because the payload still carries the client `id`
  (tx/sub) or the tag name.

UI specs:
- **Row icons.** In `TransactionRow`, next to the existing `faRepeat` subscription glyph
  slot (the name/badge row): when `transaction.syncState` is set render
  `<CloudOff size={14} className="shrink-0 text-amber-400" aria-label="Not synced yet" />`
  for `"pending"`, and `<CloudAlert size={14} className="shrink-0 text-red-400"
  aria-label="Sync problem" />` for `"failed"`/`"conflict"` (lucide-react imports).
  Same treatment in `SubscriptionCard` (near the status badge) and on the category rows
  (after the name). No glow, no animation.
- **`OfflineBanner`** (rendered by `AppHeader` right under the `<header>` bar, so it
  appears on dashboard AND settings): when `!useOnlineStatus()` show a slim
  `bg-amber-400/15 text-amber-600 dark:text-amber-300 border-b border-amber-400/30`
  strip: `You're offline — changes are saved locally and will sync when you reconnect.`
  (with a `WifiOff size={14}` icon). Nothing when online.
- **`SyncStatusBadge`** (in `AppHeader`, immediately left of the user `<Menu>`): hidden
  when `ops.length === 0`. A pill `<Button variant="ghost" size="sm">` containing
  `CloudOff` (amber) or `CloudAlert` (red when `counts.failed + counts.conflict > 0`) +
  the total op count; `animate-pulse` while `syncing`. Click opens the Sync Center.
- **`SyncCenterOverlay`** (`ResponsiveOverlay`, `title="Sync center"`, width 480):
  - Section **Conflicts** (red heading, only if any): one row per conflict op — entity
    label (`payload.name ?? entityKey`), kind line (`Server changed first` for stale /
    `Deleted on server` for missing), and two `Button size="sm"`: `Keep mine`
    (variant="primary") / `Take theirs` (variant="secondary").
  - Section **Failed** (only if any): label + `lastError` + `Retry` / `Discard` buttons.
  - Section **Waiting to sync**: plain rows (icon + label + op kind).
  - Footer: `Button fullWidth` → `Sync now`, disabled when `!online || syncing`, label
    `Syncing…` while running.
  - Empty state (possible if opened right as ops drain): `All changes are synced.`

- [ ] **Step 1: Failing tests** — `useOnlineStatus` flips on window events (fire
  `new Event("offline")`); `useSyncStatus.resolveConflict("mine", stale)` clears
  `baseUpdatedAt` and calls `replaySync`; `"theirs"` removes the op;
  `SyncCenterOverlay` renders the three sections from a fixture ops array and fires the
  right callbacks on button clicks; `OfflineBanner` visible only when offline;
  `TransactionRow` shows the amber icon when `syncState="pending"`.

- [ ] **Step 2: Implement all six files + the three row edits.** `AppHeader` change:
```tsx
// inside the <header> flex row, before <Menu ...>:
<SyncStatusBadge />
// after </header>, inside a fragment:
<OfflineBanner />
```
(`AppHeader` returns a fragment now — verify both page wrappers still lay out correctly:
`UserDashboard` line ~140 and `SettingsPage` sticky wrapper.)

- [ ] **Step 3: Full gate** — `npm run lint && npm test && npm run build` → green.

- [ ] **Step 4: Manual smoke (dev server is already running — do not restart it):**
  DevTools → Network → Offline: create a transaction → it stays in the list with the
  amber cloud; badge shows `1`; banner visible. Back online → replay fires → toast
  `1 offline change synced`, icon gone. Edit the same row in two tabs (one offline) to
  force a 409 → Sync Center shows the conflict → both resolutions work.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): sync badge, sync center with mine/theirs conflicts, offline banner and row icons"
```

---

### Task 12: docs alignment

**Files:**
- Modify: `CLAUDE.md` (root) — the frontend-architecture bullet that says the PWA
  "queues POST/PUT/DELETE while offline": rewrite to describe the typed domain-ops queue
  (`src/sync/opsQueue.ts`, transaction/subscription/tag + wallet-update only, client
  UUIDs, 409 Stale Write + mine/theirs Sync Center).
- Verify: `.claude/TODO/walletEncryptionPlan.md` already contains the §1.3/§8 notes
  pointing at this plan (they were added when this plan was written — just confirm, do
  not duplicate).

- [ ] **Step 1: Edit CLAUDE.md, run nothing (docs only), commit**

```bash
git add CLAUDE.md
git commit -m "docs: describe the reworked offline domain-ops sync layer"
```

---

## Self-review checklist (run after implementation, before hand-back)

- [ ] Offline-created transaction survives: refetch, full page reload, wallet switch.
- [ ] With an EMPTY queue, context arrays are reference-identical to server data.
- [ ] Online PUT/DELETE carry no `baseUpdatedAt`; replayed ones do.
- [ ] 409 "Stale Write" round-trip: offline edit → remote edit → reconnect → conflict in
      Sync Center → both Keep mine / Take theirs leave a consistent end state.
- [ ] Login attempted offline shows an error (nothing queued).
- [ ] `./gradlew check` (Spotless + ≥90% coverage) and frontend lint/test/build all green.
