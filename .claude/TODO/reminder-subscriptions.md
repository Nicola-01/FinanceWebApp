# Reminder Subscriptions (Amount-less) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users create subscriptions with no amount ("reminders", e.g. a salary): the cron generates amount-less *pending* transactions that render as pinned, wallet-color-accented rows above the transaction list, with an inline input to fill in the actual amount.

**Architecture:** A boolean `amountPending` flag on both `Subscription` (reminder template) and `Transaction` (awaiting its amount), with `amount`/`originalAmount` kept `NOT NULL` and equal to `0` while pending — no schema-breaking nullability change (`ddl-auto=update` cannot relax NOT NULL; new boolean columns with a default propagate automatically). A dedicated fill endpoint (`PUT /api/transactions/{walletID}/{transactionID}/amount`) sets the amount (resolving foreign-currency rates like the cron does) and clears the flag. Frontend: `WalletProvider` splits pending from regular transactions; a new `PendingTransactionsPanel` renders the pinned rows; `SubscriptionModal` gains a "Reminder" toggle.

**Tech Stack:** Spring Boot 3.5 / Java 21 / JPA (Postgres 16, H2 in tests, JUnit 5 + Mockito) · React 19 / TypeScript / Tailwind 4 / Vitest + Testing Library.

## Global Constraints

- All UI copy and code comments in **English**.
- All REST endpoints under `/api/...`.
- `spring.jpa.hibernate.ddl-auto=update`, **no Flyway**: never alter existing columns; new columns on populated tables MUST carry `@ColumnDefault` so the generated `ALTER TABLE ... ADD COLUMN` succeeds. Do not remove the `@ColumnDefault("false")` annotations added here.
- Backend gates: `./gradlew spotlessApply` before commit; `./gradlew check` enforces Spotless + **90% line coverage** (JaCoCo).
- Frontend gates (same order as CI and the Stop hook): `npm run lint` → `npm test` → `npm run build`. Tests live under `src/__tests__/<mirrored path>`. No path aliases — all imports relative.
- Reuse UI primitives from `src/components/ui/` (`Button`, `Input`, `Toggle`, …) — never hand-roll `<button>`/`<input>` (see `frontend/style.md`). Theme-aware `app-*` tokens only. Wallet-color soft tints via the established hex-alpha pattern (e.g. `` `${wallet.color}0d` ``, `` `${wallet.color}40` `` — see `InviteCard.tsx:27`, `FloatingActionButton.tsx:39`).
- Repo hooks auto-run the backend/frontend test suites at end of every turn that edits `backend/`/`frontend/` — expect them, keep them green.
- Git: work on `feat/reminder-subscriptions` branched from `release/v3.2.0`. Never commit to `release/*`/`main` directly. The user merges manually (no auto-merge/PR without asking).

## Design decisions (agreed in grilling, 2026-07-07)

1. **Scope v1:** only subscription-generated transactions can be pending. Manual transactions, CSV import and MCP keep requiring an amount.
2. **Data model:** `boolean amountPending` on both entities; `amount`/`originalAmount` stay NOT NULL and are `0` while pending. No status enum, no nullable amounts.
3. **Accumulation:** pending transactions pile up (3 ignored months = 3 pinned rows, each with its own scheduled date). Cron logic for date advancement is unchanged.
4. **Fill semantics:** the filled transaction keeps its **scheduled** `transactionDate`. The user enters the amount in the transaction's **original currency**; foreign-currency rate resolution mirrors the cron (fixed stored rate when `autoExchangeRate=false`, else live rate **at fill time**; no historical rates exist). If no rate can be resolved the fill fails with a clear error.
5. **Foreign currency:** supported for reminder subscriptions (currency selection stays in the form).
6. **UI:** pending rows render **only** in a pinned panel above `TransactionsTable` (never inside the normal list), immune to filters/search/pagination, accented with `wallet.color`. Amount entry is **inline** in the row; clicking the rest of the row opens the existing `TransactionDetailsModal`. VIEWERs see the rows but no input.
7. **Creation UI v1:** "Reminder" toggle only in `SubscriptionModal`. Wallet wizard = Phase 2.
8. **Reminder display:** `SubscriptionCard`/`SubscriptionView` show a "Reminder" label instead of `€0.00`; a pending transaction's details view shows "Amount pending".
9. **Conversion:** a subscription can be switched reminder ↔ normal via edit; the switch is **not retroactive** on already-generated transactions. Turning reminder off requires providing an amount.
10. **Cascade:** deleting a subscription already deletes its generated transactions (`cascade = ALL` on `Subscription.history`) — pending ones included; unchanged behavior.
11. **Clearing elsewhere:** any update that supplies an amount (single update or bulk-import overwrite of a matched row) clears `amountPending`.
12. **Balance/analytics:** no special handling — pending rows contribute `0` to every aggregate (correct for an unknown amount).

## Phase map

- **Phase 1 (Tasks 1–9, this plan):** backend flag + cron + fill endpoint + pinned panel + SubscriptionModal toggle + display states.
- **Phase 2 — wallet wizard** (scoped, plan when scheduled): reminder toggle in `SubscriptionCreateMode`, reminder-aware `StagedSubscriptionRow`/`subscriptionSummary`, optional "Salary" reminder preset in `recommendedSubscriptions.ts`. Backend already supports it after Phase 1 (`SubscriptionRequest.amountPending` flows through `/api/wallets/full`).
- **Phase 3 — MCP tools:** `amountPending` already flows through `TransactionResponse`; add a `fill_transaction_amount` tool in `mcp-server/mcp_server.py` forwarding `PUT /api/transactions/{walletId}/{txId}/amount`, and mention pending rows in the list-transactions tool docs.
- **Phase 4 — email/push notification:** when the cron creates a pending transaction, notify wallet members with write access (`SendEmailService` HTML template "Enter the amount for …"); evaluate PWA push separately (no web-push infra today).
- **Phase 5 — CSV bulk import:** allow amount-less subscription rows (empty amount column + reminder marker → `amountPending=true`), extend upsert semantics + preview/recap modal.

---

### Task 1: Entity flags + DTO/mapper plumbing (backend)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Subscription.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Transaction.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/SubscriptionRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/SubscriptionResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TransactionResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/SubscriptionMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/TransactionMapper.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/mappers/SubscriptionMapperTest.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/mappers/TransactionMapperTest.java`

**Interfaces:**
- Produces: `Subscription.isAmountPending()/setAmountPending(boolean)`, `Transaction.isAmountPending()/setAmountPending(boolean)`, `SubscriptionRequest.getAmountPending() : Boolean` (nullable — `null` = "not specified"), `SubscriptionResponse.isAmountPending() : boolean`, `TransactionResponse.isAmountPending() : boolean`. All later tasks rely on these exact names.

- [ ] **Step 1: Create the feature branch**

```bash
cd /home/nicola/Desktop/FinanceWebApp
git checkout release/v3.2.0 && git checkout -b feat/reminder-subscriptions
```

- [ ] **Step 2: Write the failing mapper tests**

Append to `TransactionMapperTest.java` (imports already present):

```java
  @Test
  void mapToResponse_PendingTransaction_MapsAmountPending() {
    Transaction transaction = new Transaction();
    transaction.setId(UUID.randomUUID());
    transaction.setType(Transaction.Type.INCOME);
    transaction.setAmountPending(true);

    TransactionResponse response = transactionMapper.mapToResponse(transaction);

    assertTrue(response.isAmountPending());
  }
```

Append to `SubscriptionMapperTest.java` (add any missing imports following the file's existing ones — `Subscription`, `SubscriptionResponse`, `BigDecimal`, `UUID`, `assertTrue`):

```java
  @Test
  void mapToResponse_ReminderSubscription_MapsAmountPending() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Salary");
    sub.setAmount(BigDecimal.ZERO);
    sub.setOriginalAmount(BigDecimal.ZERO);
    sub.setAmountPending(true);
    sub.setType(Subscription.Type.INCOME);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setDuration(Subscription.Duration.FOREVER);

    SubscriptionResponse response = subscriptionMapper.mapToResponse(sub);

    assertTrue(response.isAmountPending());
  }
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && ./gradlew test --tests "*.TransactionMapperTest" --tests "*.SubscriptionMapperTest"`
Expected: **compilation FAILURE** (`method setAmountPending in class ... cannot be found`) — that is the red state here.

- [ ] **Step 4: Add the entity flags**

In `Subscription.java`, after the `private boolean autoExchangeRate;` field (line ~52), add (plus `import org.hibernate.annotations.ColumnDefault;`):

```java
  /**
   * When true this subscription is a reminder template: it carries no real amount (amount and
   * originalAmount stay 0) and every transaction it generates is created with {@code
   * amountPending = true}, waiting for the user to fill in the actual amount.
   */
  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean amountPending = false;
```

In `Transaction.java`, after `private String encryptedAmount;` (line ~45), add (plus the same import):

```java
  /**
   * When true the real amount is not known yet: amount and originalAmount stay 0 until the user
   * fills them in (rendered as a pinned "awaiting amount" row in the UI). Only
   * subscription-generated transactions are ever created pending.
   */
  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean amountPending = false;
```

`@ColumnDefault` is what makes Hibernate emit `ADD COLUMN ... DEFAULT false NOT NULL`, which succeeds on populated Postgres tables. Do not omit it.

- [ ] **Step 5: Add the DTO fields and mapper lines**

`SubscriptionRequest.java` — after `private BigDecimal amount;`:

```java
  // Reminder subscription (no fixed amount). Boxed on purpose: null = "not specified", so
  // updates that omit it leave the flag unchanged.
  private Boolean amountPending;
```

`SubscriptionResponse.java` — after `private BigDecimal amount;`: `private boolean amountPending;`
`TransactionResponse.java` — after `private BigDecimal amount;`: `private boolean amountPending;`

`SubscriptionMapper.java` — in the builder chain, after `.amount(sub.getAmount())`: `.amountPending(sub.isAmountPending())`
`TransactionMapper.java` — after `.amount(transaction.getAmount())`: `.amountPending(transaction.isAmountPending())`

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && ./gradlew test --tests "*.TransactionMapperTest" --tests "*.SubscriptionMapperTest"`
Expected: PASS.

- [ ] **Step 7: Format and commit**

```bash
cd backend && ./gradlew spotlessApply && cd ..
git add backend/src
git commit -m "feat(subscription): amountPending flag on Subscription/Transaction + DTO plumbing"
```

---

### Task 2: SubscriptionService — create/update reminder subscriptions

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SubscriptionService.java` (`buildAndPersistSubscription` ~line 222, `applySubscriptionUpdate` ~line 357)
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/SubscriptionServiceTest.java`

**Interfaces:**
- Consumes: `SubscriptionRequest.getAmountPending() : Boolean` (Task 1).
- Produces: create accepts `amountPending=true` with null amount (persists `amount = originalAmount = 0`, flag true); update can flip the flag (on → zeroes amounts; off → requires `request.amount != null`). Bulk upsert paths reuse these two methods, so wizard/CSV callers inherit the behavior automatically.

- [ ] **Step 1: Write the failing tests**

Append to `SubscriptionServiceTest.java` (the class already has `walletId`, `userId`, `mockWallet`, fixed clock at **2024-02-15**; add a shared fixture helper):

```java
  private Subscription baseMonthlySub() {
    return Subscription.builder()
        .id(UUID.randomUUID())
        .wallet(mockWallet)
        .name("Salary")
        .amount(new BigDecimal("100.00"))
        .originalAmount(new BigDecimal("100.00"))
        .type(Subscription.Type.INCOME)
        .status(Subscription.Status.ACTIVE)
        .startDate(LocalDate.of(2024, 1, 1))
        .nextExecutionDate(LocalDate.of(2024, 3, 1))
        .frequencyType(Subscription.Frequency.MONTHLY)
        .frequencyInterval(1)
        .duration(Subscription.Duration.FOREVER)
        .build();
  }

  @Test
  void createSubscription_Reminder_AllowsNullAmountAndZeroesStoredAmounts() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Salary reminder");
    request.setAmountPending(true);
    request.setType("INCOME");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 3, 1)); // future → no immediate execution
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());
    Subscription saved = captor.getValue();
    assertTrue(saved.isAmountPending());
    assertEquals(0, BigDecimal.ZERO.compareTo(saved.getAmount()));
    assertEquals(0, BigDecimal.ZERO.compareTo(saved.getOriginalAmount()));
  }

  @Test
  void createSubscription_NoAmountAndNotReminder_Throws() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 3, 1));
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  @Test
  void updateSubscription_TurnReminderOn_ZeroesStoredAmounts() {
    Subscription existing = baseMonthlySub();
    when(subscriptionRepository.findByIdAndWalletId(existing.getId(), walletId))
        .thenReturn(Optional.of(existing));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setAmountPending(true);

    subscriptionService.updateSubscription(existing.getId(), request, walletId, userId);

    assertTrue(existing.isAmountPending());
    assertEquals(0, BigDecimal.ZERO.compareTo(existing.getAmount()));
    assertEquals(0, BigDecimal.ZERO.compareTo(existing.getOriginalAmount()));
  }

  @Test
  void updateSubscription_TurnReminderOffWithoutAmount_Throws() {
    Subscription existing = baseMonthlySub();
    existing.setAmountPending(true);
    existing.setAmount(BigDecimal.ZERO);
    existing.setOriginalAmount(BigDecimal.ZERO);
    when(subscriptionRepository.findByIdAndWalletId(existing.getId(), walletId))
        .thenReturn(Optional.of(existing));

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setAmountPending(false);

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.updateSubscription(existing.getId(), request, walletId, userId));
  }

  @Test
  void updateSubscription_StillReminder_IgnoresIncomingAmounts() {
    Subscription existing = baseMonthlySub();
    existing.setAmountPending(true);
    existing.setAmount(BigDecimal.ZERO);
    existing.setOriginalAmount(BigDecimal.ZERO);
    when(subscriptionRepository.findByIdAndWalletId(existing.getId(), walletId))
        .thenReturn(Optional.of(existing));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setAmount(new BigDecimal("50.00")); // must NOT stick while still a reminder

    subscriptionService.updateSubscription(existing.getId(), request, walletId, userId);

    assertTrue(existing.isAmountPending());
    assertEquals(0, BigDecimal.ZERO.compareTo(existing.getAmount()));
  }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./gradlew test --tests "*.SubscriptionServiceTest"`
Expected: the 5 new tests FAIL (`The amount is required.` on create; amounts not zeroed / no exception on update).

- [ ] **Step 3: Implement in `buildAndPersistSubscription`**

Replace the two validation lines at the top of the method:

```java
    validateSubscriptionNameForCreate(request.getName());
    requireNonNegativeAmountForCreate(request.getAmount());
```

with:

```java
    boolean amountPending = Boolean.TRUE.equals(request.getAmountPending());
    validateSubscriptionNameForCreate(request.getName());
    // Reminder templates deliberately have no amount; everything else still requires one.
    if (!amountPending) requireNonNegativeAmountForCreate(request.getAmount());
```

and in the builder chain replace `.amount(request.getAmount())` and the `.originalAmount(...)` block with:

```java
            .amountPending(amountPending)
            .amount(amountPending ? BigDecimal.ZERO : request.getAmount())
            // originalAmount is required (NOT NULL) and equals the amount when no
            // currency conversion is involved. Callers that omit it — e.g. the wallet
            // wizard staging simple, single-currency subscriptions — would otherwise
            // persist null and break both the subscription and the transactions it
            // generates, so default it to the amount here (before executeSubscription
            // copies it onto the first generated transaction). Reminders store 0.
            .originalAmount(
                amountPending
                    ? BigDecimal.ZERO
                    : request.getOriginalAmount() != null
                        ? request.getOriginalAmount()
                        : request.getAmount())
```

- [ ] **Step 4: Implement in `applySubscriptionUpdate`**

Immediately after the negative-amount validation (`if (request.getAmount() != null && ... < 0) throw ...` — currently at ~line 364) and **before** `sub.setTag(tag);`, insert:

```java
    // Reminder flag first: turning it on zeroes the stored amounts; turning it off requires a
    // real amount to take their place. Not retroactive on already-generated transactions.
    if (request.getAmountPending() != null
        && request.getAmountPending() != sub.isAmountPending()) {
      if (request.getAmountPending()) {
        sub.setAmountPending(true);
        sub.setAmount(BigDecimal.ZERO);
        sub.setOriginalAmount(BigDecimal.ZERO);
      } else {
        if (request.getAmount() == null)
          throw new IllegalArgumentException(
              "An amount is required to turn a reminder subscription into a regular one.");
        sub.setAmountPending(false);
      }
    }
```

Then replace the two amount setters:

```java
    if (request.getAmount() != null) sub.setAmount(request.getAmount());
    if (request.getOriginalAmount() != null) sub.setOriginalAmount(request.getOriginalAmount());
```

with:

```java
    // While the subscription is a reminder its stored amounts stay 0 — incoming values are
    // metadata noise from stale clients, not a real amount change.
    if (!sub.isAmountPending()) {
      if (request.getAmount() != null) sub.setAmount(request.getAmount());
      if (request.getOriginalAmount() != null) sub.setOriginalAmount(request.getOriginalAmount());
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && ./gradlew test --tests "*.SubscriptionServiceTest"`
Expected: PASS (all, including pre-existing tests).

- [ ] **Step 6: Format and commit**

```bash
cd backend && ./gradlew spotlessApply && cd ..
git add backend/src
git commit -m "feat(subscription): create/update reminder (amount-less) subscriptions"
```

---

### Task 3: Cron — generate pending transactions

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SubscriptionService.java` (`executeSubscription`, ~line 466)
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/SubscriptionServiceTest.java`

**Interfaces:**
- Consumes: `Subscription.isAmountPending()` (Task 1), `baseMonthlySub()` fixture (Task 2).
- Produces: cron-generated transactions for reminder subscriptions carry `amountPending=true`, `amount=0`, `originalAmount=0`, `exchangeValue=null`, `originalCurrency` copied from the subscription; the live-rate fetch is skipped. Date advancement, notes, `executedTimes`, completion checks: unchanged.

- [ ] **Step 1: Write the failing test**

Append to `SubscriptionServiceTest.java`:

```java
  @Test
  void processDueSubscriptions_ReminderSubscription_GeneratesPendingTransaction() {
    Subscription sub = baseMonthlySub();
    sub.setAmountPending(true);
    sub.setAmount(BigDecimal.ZERO);
    sub.setOriginalAmount(BigDecimal.ZERO);
    // Foreign-currency reminder: the flag must short-circuit rate resolution too.
    sub.setOriginalCurrency("USD");
    sub.setAutoExchangeRate(true);
    mockWallet.setCurrency("EUR");
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15)); // due at the fixed clock date

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            List.of(Subscription.Status.ACTIVE, Subscription.Status.PAUSED),
            LocalDate.of(2024, 2, 15)))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    Transaction generated = txCaptor.getValue();
    assertTrue(generated.isAmountPending());
    assertEquals(0, BigDecimal.ZERO.compareTo(generated.getAmount()));
    assertEquals(0, BigDecimal.ZERO.compareTo(generated.getOriginalAmount()));
    assertNull(generated.getExchangeValue());
    assertEquals("USD", generated.getOriginalCurrency());
    assertEquals(LocalDate.of(2024, 2, 15), generated.getTransactionDate());
    verify(exchangeRateService, never()).getRate(any(), any());
  }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./gradlew test --tests "*.SubscriptionServiceTest.processDueSubscriptions_ReminderSubscription*"`
Expected: FAIL (`generated.isAmountPending()` is false; live rate fetched).

- [ ] **Step 3: Implement in `executeSubscription`**

Inside the `if (sub.getStatus() == Subscription.Status.ACTIVE) {` block, replace the rate-resolution prologue:

```java
      BigDecimal resolvedAmount = sub.getAmount();
      BigDecimal resolvedExchange = sub.getExchangeValue();
```

with:

```java
      // Reminder subscriptions generate amount-less transactions: skip rate resolution
      // entirely — the amount is unknown until the user fills it in (fill endpoint).
      boolean pending = sub.isAmountPending();
      BigDecimal resolvedAmount = pending ? BigDecimal.ZERO : sub.getAmount();
      BigDecimal resolvedExchange = pending ? null : sub.getExchangeValue();
```

change the live-rate guard from `if (foreign && sub.isAutoExchangeRate() && ...)` to `if (!pending && foreign && sub.isAutoExchangeRate() && ...)`, and in the `Transaction.builder()` chain replace `.amount(resolvedAmount)` and the `.originalAmount(...)` block with:

```java
              .amountPending(pending)
              .amount(resolvedAmount)
              // Transactions.original_amount is NOT NULL. Guard here (not just at
              // subscription build) so the daily cron never fails on a subscription
              // that somehow carries a null original amount — fall back to the
              // resolved amount, which equals it when no conversion is involved.
              .originalAmount(
                  pending
                      ? BigDecimal.ZERO
                      : sub.getOriginalAmount() != null ? sub.getOriginalAmount() : resolvedAmount)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && ./gradlew test --tests "*.SubscriptionServiceTest"`
Expected: PASS.

- [ ] **Step 5: Format and commit**

```bash
cd backend && ./gradlew spotlessApply && cd ..
git add backend/src
git commit -m "feat(subscription): cron materializes reminder subscriptions as pending transactions"
```

---

### Task 4: Fill endpoint + pending-clearing on update/bulk (backend)

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TransactionFillRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/TransactionService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/TransactionController.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/TransactionServiceTest.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/TransactionControllerTest.java`

**Interfaces:**
- Consumes: `Transaction.isAmountPending()` (Task 1), `ExchangeRateService.getRate(String base, String quote) : Optional<BigDecimal>`.
- Produces: `PUT /api/transactions/{walletID}/{transactionID}/amount` with body `{"originalAmount": <decimal>}` → `TransactionResponse`; service method `fillTransactionAmount(UUID transactionId, TransactionFillRequest request, UUID walletId, UUID userId)`. The frontend (Task 6) calls this exact route.

- [ ] **Step 1: Write the failing service tests**

Add `@Mock private ExchangeRateService exchangeRateService;` to `TransactionServiceTest`'s mock list (it becomes a constructor dep in Step 3). Add imports for `Subscription`, `TransactionFillRequest`, `Optional`, `assertFalse`, `assertNull`, `assertTrue`, `never` as needed, then append:

```java
  private Transaction pendingTx(UUID txId, Wallet wallet, String originalCurrency) {
    Transaction tx = new Transaction();
    tx.setId(txId);
    tx.setWallet(wallet);
    tx.setName("Salary");
    tx.setAmountPending(true);
    tx.setAmount(BigDecimal.ZERO);
    tx.setOriginalAmount(BigDecimal.ZERO);
    tx.setOriginalCurrency(originalCurrency);
    tx.setType(Transaction.Type.INCOME);
    tx.setTransactionDate(LocalDate.of(2026, 6, 27));
    return tx;
  }

  @Test
  void fillTransactionAmount_SameCurrency_SetsAmountsAndClearsPending() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any()))
        .thenReturn(TransactionResponse.builder().build());

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("2450.00")).build(),
        walletId,
        userId);

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("2450.00").compareTo(tx.getAmount()));
    assertEquals(0, new BigDecimal("2450.00").compareTo(tx.getOriginalAmount()));
    assertNull(tx.getExchangeValue());
    assertEquals(LocalDate.of(2026, 6, 27), tx.getTransactionDate()); // keeps scheduled date
    verify(exchangeRateService, never()).getRate(any(), any());
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyAutoRate_UsesLiveRateAtFillTime() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(true);
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any()))
        .thenReturn(TransactionResponse.builder().build());
    when(exchangeRateService.getRate("USD", "EUR"))
        .thenReturn(Optional.of(new BigDecimal("0.90")));

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
        walletId,
        UUID.randomUUID());

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("100.00").compareTo(tx.getOriginalAmount()));
    assertEquals(0, new BigDecimal("90.00").compareTo(tx.getAmount()));
    assertEquals(0, new BigDecimal("0.90").compareTo(tx.getExchangeValue()));
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyFixedRate_UsesStoredSubscriptionRate() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(false);
    sub.setExchangeValue(new BigDecimal("0.85"));
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any()))
        .thenReturn(TransactionResponse.builder().build());

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
        walletId,
        UUID.randomUUID());

    assertEquals(0, new BigDecimal("85.00").compareTo(tx.getAmount()));
    verify(exchangeRateService, never()).getRate(any(), any());
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyNoRateAvailable_ThrowsAndStaysPending() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(true); // and no stored fallback rate
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () ->
            transactionService.fillTransactionAmount(
                txId,
                TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
                walletId,
                UUID.randomUUID()));
    assertTrue(tx.isAmountPending());
  }

  @Test
  void fillTransactionAmount_NotPending_Throws() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    tx.setAmountPending(false);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            transactionService.fillTransactionAmount(
                txId,
                TransactionFillRequest.builder().originalAmount(BigDecimal.TEN).build(),
                walletId,
                UUID.randomUUID()));
  }

  @Test
  void updateTransaction_ProvidingAmount_ClearsPendingFlag() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any()))
        .thenReturn(TransactionResponse.builder().build());

    TransactionRequest request = TransactionRequest.builder().build();
    request.setAmount(new BigDecimal("50.00"));

    transactionService.updateTransaction(txId, request, walletId, UUID.randomUUID());

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("50.00").compareTo(tx.getAmount()));
  }
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./gradlew test --tests "*.TransactionServiceTest"`
Expected: compilation FAILURE (`fillTransactionAmount`/`TransactionFillRequest` not defined) — the red state.

- [ ] **Step 3: Implement the DTO and the service method**

Create `TransactionFillRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

/** Body of the fill-amount call for a pending transaction ({@code amountPending = true}). */
@Data
@Builder
public class TransactionFillRequest {
  /** Amount in the transaction's original currency (wallet currency when none is set). */
  private BigDecimal originalAmount;
}
```

In `TransactionService.java`: add `private final ExchangeRateService exchangeRateService;` to the injected fields, `import java.math.RoundingMode;` and `import dev.busato.FinanceWebApp.backend.dto.TransactionFillRequest;`, then add after `updateTransaction`:

```java
  /**
   * Fills the amount of a pending (amount-less) transaction and clears its pending flag.
   *
   * <p>The caller provides the amount in the transaction's original currency; the transaction
   * keeps its scheduled date. For a foreign-currency transaction the wallet-currency amount is
   * computed like the subscription cron does: the stored fixed rate wins when the originating
   * subscription uses manual rates, otherwise the live rate at fill time (falling back to the
   * stored rate). When no rate can be resolved the fill fails and the transaction stays pending.
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public TransactionResponse fillTransactionAmount(
      UUID transactionId, TransactionFillRequest request, UUID walletId, UUID userId) {
    Transaction transaction =
        transactionRepository
            .findByIdAndWalletId(transactionId, walletId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Transaction not found or does not belong to this wallet"));

    if (!transaction.isAmountPending())
      throw new IllegalArgumentException("Transaction is not awaiting an amount.");
    requireNonNegativeAmount(request.getOriginalAmount());

    BigDecimal originalAmount = request.getOriginalAmount();
    String walletCurrency =
        transaction.getWallet() != null ? transaction.getWallet().getCurrency() : null;
    boolean foreign =
        transaction.getOriginalCurrency() != null
            && walletCurrency != null
            && !transaction.getOriginalCurrency().equals(walletCurrency);

    BigDecimal amount = originalAmount;
    BigDecimal exchangeValue = null;
    if (foreign) {
      Subscription sub = transaction.getSubscription();
      BigDecimal storedRate = sub != null ? sub.getExchangeValue() : null;
      boolean useLiveRate = sub == null || sub.isAutoExchangeRate() || storedRate == null;
      exchangeValue =
          useLiveRate
              ? exchangeRateService
                  .getRate(transaction.getOriginalCurrency(), walletCurrency)
                  .orElse(storedRate)
              : storedRate;
      if (exchangeValue == null)
        throw new IllegalArgumentException(
            "Exchange rate unavailable for "
                + transaction.getOriginalCurrency()
                + " — try again later.");
      amount = originalAmount.multiply(exchangeValue).setScale(2, RoundingMode.HALF_UP);
    }

    transaction.setOriginalAmount(originalAmount);
    transaction.setAmount(amount);
    transaction.setExchangeValue(exchangeValue);
    transaction.setAmountPending(false);
    return transactionMapper.mapToResponse(transaction);
  }
```

- [ ] **Step 4: Clear the flag on regular updates and bulk overwrites**

In `updateTransaction` (~line 329) fix the latent NPE and clear the flag — replace:

```java
    if (request.getAmount().compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");
```

with:

```java
    if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");
```

and replace `if (request.getAmount() != null) transaction.setAmount(request.getAmount());` with:

```java
    if (request.getAmount() != null) {
      transaction.setAmount(request.getAmount());
      // Any explicit amount resolves a pending transaction (full-edit fill path).
      transaction.setAmountPending(false);
    }
```

In `applyMutableTransactionFields` (bulk upsert; rows always carry an amount) add as last line:

```java
    transaction.setAmountPending(false);
```

- [ ] **Step 5: Add the controller route**

In `TransactionController.java` (import `TransactionFillRequest`), after `updateTransaction`:

```java
  /** Fills the amount of a pending (amount-less) transaction and clears its pending flag. */
  @PutMapping("/{walletID}/{transactionID}/amount")
  public ResponseEntity<TransactionResponse> fillTransactionAmount(
      @PathVariable UUID walletID,
      @PathVariable UUID transactionID,
      @RequestBody TransactionFillRequest request,
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(
        transactionService.fillTransactionAmount(transactionID, request, walletID, user.getId()));
  }
```

Then open `TransactionControllerTest.java`, copy its existing PUT-update test verbatim as a template, and adapt it for the new route: perform `put("/api/transactions/{walletID}/{transactionID}/amount", ...)` with body `{"originalAmount": 2450.00}`, stub `transactionService.fillTransactionAmount(any(), any(), any(), any())` to return a `TransactionResponse`, expect 200 and verify the service call. Follow that file's existing mock/auth conventions exactly (it extends `BaseWebMvcTest`).

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && ./gradlew test --tests "*.TransactionServiceTest" --tests "*.TransactionControllerTest"`
Expected: PASS.

- [ ] **Step 7: Format, full backend suite, commit**

```bash
cd backend && ./gradlew spotlessApply && ./gradlew test && cd ..
git add backend/src
git commit -m "feat(transaction): fill-amount endpoint for pending transactions"
```

---

### Task 5: Frontend types + pending selection in WalletProvider

**Files:**
- Modify: `frontend/src/utils/types.ts`
- Create: `frontend/src/dashboard/wallet/pendingTransactions.ts`
- Modify: `frontend/src/dashboard/wallet/WalletProvider.tsx`
- Modify: `frontend/src/dashboard/wallet/WalletContext.tsx`
- Test: `frontend/src/__tests__/dashboard/wallet/pendingTransactions.test.ts`

**Interfaces:**
- Consumes: `TransactionResponse.amountPending` from the API (Task 1).
- Produces: `Transaction.amountPending?: boolean`, `Subscription.amountPending?: boolean`, `SubscriptionRequestDTO.amountPending?: boolean`; `selectPendingTransactions(transactions: Transaction[]): Transaction[]` (oldest first); context field `pendingTransactions: Transaction[]`; `filteredTransactions` excludes pending rows. Tasks 6–8 rely on these exact names.

- [ ] **Step 1: Write the failing unit test**

Create `frontend/src/__tests__/dashboard/wallet/pendingTransactions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { selectPendingTransactions } from "../../../dashboard/wallet/pendingTransactions";
import type { Transaction } from "../../../utils/types";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t1",
  name: "Salary",
  tag: { name: "Job", icon: "tag", colorHex: "#ffffff" },
  amount: 0,
  type: "INCOME",
  transactionDate: "2026-06-27",
  ...over,
});

describe("selectPendingTransactions", () => {
  it("returns only pending transactions", () => {
    const result = selectPendingTransactions([
      tx({ id: "a", amountPending: true }),
      tx({ id: "b", amount: 100 }),
    ]);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("sorts pending transactions oldest first", () => {
    const result = selectPendingTransactions([
      tx({ id: "jun", amountPending: true, transactionDate: "2026-06-27" }),
      tx({ id: "apr", amountPending: true, transactionDate: "2026-04-27" }),
      tx({ id: "may", amountPending: true, transactionDate: "2026-05-27" }),
    ]);
    expect(result.map((t) => t.id)).toEqual(["apr", "may", "jun"]);
  });

  it("returns an empty array when nothing is pending", () => {
    expect(selectPendingTransactions([tx({})])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/dashboard/wallet/pendingTransactions.test.ts`
Expected: FAIL (module `pendingTransactions` not found).

- [ ] **Step 3: Implement types + helper + provider wiring**

`frontend/src/utils/types.ts`:
- In `interface Transaction`, after `amount: number;` add: `amountPending?: boolean;`
- In `interface Subscription`, after `amount: number;` add: `amountPending?: boolean;`
- In `interface SubscriptionRequestDTO`, after `amount: number;` add: `amountPending?: boolean;`

Create `frontend/src/dashboard/wallet/pendingTransactions.ts`:

```ts
import type { Transaction } from "../../utils/types";

/** Pending (amount-less) transactions, oldest first — the order the pinned rows render in. */
export function selectPendingTransactions(
  transactions: Transaction[],
): Transaction[] {
  return transactions
    .filter((tx) => tx.amountPending)
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );
}
```

`WalletProvider.tsx`:
- `import { selectPendingTransactions } from "./pendingTransactions";`
- First line inside the `filteredTransactions` filter callback (before the tag check):

```ts
      // Pending (amount-less) rows live only in the pinned panel, never in the normal list.
      if (tx.amountPending) return false;
```

- After the `filteredTransactions` memo:

```ts
  const pendingTransactions = useMemo(
    () => selectPendingTransactions(transactions),
    [transactions],
  );
```

- Add `pendingTransactions,` to the `WalletContext.Provider` value (next to `filteredTransactions`).

`WalletContext.tsx` — in `WalletContextType`, after `filteredTransactions: Transaction[];` add: `pendingTransactions: Transaction[];`

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/dashboard/wallet/`
Expected: PASS — including the pre-existing `WalletProvider.test.tsx`. If that file builds its own context value object, add the new `pendingTransactions` field there too.

- [ ] **Step 5: Lint, build, commit**

```bash
cd frontend && npm run lint && npm run build && cd ..
git add frontend/src
git commit -m "feat(wallet): expose pendingTransactions in WalletContext, exclude pending from filters"
```

---

### Task 6: PendingTransactionsPanel — pinned rows with inline fill

**Files:**
- Create: `frontend/src/dashboard/transaction/PendingTransactionsPanel.tsx`
- Modify: `frontend/src/dashboard/transaction/TransactionsTable.tsx`
- Modify: `frontend/src/dashboard/transaction/TransactionsTab.tsx`
- Test: `frontend/src/__tests__/dashboard/transaction/PendingTransactionsPanel.test.tsx`

**Interfaces:**
- Consumes: `pendingTransactions` from context (Task 5); `PUT /transactions/{walletId}/{txId}/amount` (Task 4); `Button`/`Input` primitives; `detailsModalRef` already in `TransactionsTable`.
- Produces: `<PendingTransactionsPanel wallet pendingTransactions onFilled onOpenDetails />`; new `TransactionsTable` prop `pendingTransactions: Transaction[]`.

- [ ] **Step 1: Write the failing component test**

Create `frontend/src/__tests__/dashboard/transaction/PendingTransactionsPanel.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PendingTransactionsPanel } from "../../../dashboard/transaction/PendingTransactionsPanel";
import api from "../../../api/axiosConfig";
import type { Transaction, Wallet } from "../../../utils/types";

vi.mock("../../../api/axiosConfig", () => ({
  default: { put: vi.fn().mockResolvedValue({ data: {} }) },
}));
vi.mock("../../../components/ui/ToastNotification.tsx", () => ({
  triggerToast: vi.fn(),
}));

const wallet: Wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#8b5cf6",
  currency: "EUR",
  createdAt: "2026-01-01",
  userRole: "OWNER",
};

const pendingTx: Transaction = {
  id: "t1",
  subscriptionId: "s1",
  name: "Salary",
  tag: { name: "Job", icon: "tag", colorHex: "#22c55e" },
  amount: 0,
  amountPending: true,
  originalCurrency: "EUR",
  type: "INCOME",
  transactionDate: "2026-06-27",
};

describe("PendingTransactionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no pending transactions", () => {
    const { container } = render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("submits the amount to the fill endpoint and notifies the parent", async () => {
    const onFilled = vi.fn();
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={onFilled}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Amount for Salary"), {
      target: { value: "2450" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm amount" }));
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/transactions/w1/t1/amount", {
        originalAmount: 2450,
      }),
    );
    expect(onFilled).toHaveBeenCalled();
  });

  it("opens the details view when the row body is clicked", () => {
    const onOpenDetails = vi.fn();
    render(
      <PendingTransactionsPanel
        wallet={wallet}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={onOpenDetails}
      />,
    );
    fireEvent.click(screen.getByText("Salary"));
    expect(onOpenDetails).toHaveBeenCalledWith(pendingTx);
  });

  it("hides the inline input for viewers", () => {
    render(
      <PendingTransactionsPanel
        wallet={{ ...wallet, userRole: "VIEWER" }}
        pendingTransactions={[pendingTx]}
        onFilled={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(
      screen.queryByLabelText("Amount for Salary"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/dashboard/transaction/PendingTransactionsPanel.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the component**

Create `frontend/src/dashboard/transaction/PendingTransactionsPanel.tsx`. Before finalizing, check the actual prop surfaces of `Button.tsx` and `Input.tsx` (both in `src/components/ui/`) and keep the mandated primitives — do not hand-roll `<button>`/`<input>`:

```tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faTags } from "@fortawesome/free-solid-svg-icons";
import type { Transaction, Wallet } from "../../utils/types.ts";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import api from "../../api/axiosConfig.ts";
import Button from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

interface PendingRowProps {
  wallet: Wallet;
  transaction: Transaction;
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

const PendingTransactionRow: React.FC<PendingRowProps> = ({
  wallet,
  transaction,
  onFilled,
  onOpenDetails,
}) => {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const canEdit = wallet.userRole !== "VIEWER";
  const currency = (transaction.originalCurrency ??
    wallet.currency) as CurrencyCode;
  const symbol = CURRENCY_META[currency]?.symbol || currency;

  const submit = async () => {
    if (!value || Number.isNaN(Number(value)) || Number(value) === 0)
      return triggerToast("Please enter a valid amount.", false);
    setSaving(true);
    try {
      await api.put(`/transactions/${wallet.id}/${transaction.id}/amount`, {
        originalAmount: Math.abs(Number(value)),
      });
      triggerToast("Amount saved!", true);
      onFilled();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error saving amount"), false);
      setSaving(false);
    }
  };

  const formattedDate = new Date(
    transaction.transactionDate,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      onClick={() => onOpenDetails(transaction)}
      className="flex items-center justify-between gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:brightness-110"
      style={{
        backgroundColor: `${wallet.color}0d`,
        border: `1px solid ${wallet.color}40`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
          style={{ color: transaction.tag.colorHex }}
        >
          <FontAwesomeIcon
            icon={ICONS[transaction.tag.icon as IconKey] || faTags}
          />
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-base font-bold text-app-text truncate">
            {transaction.name}
          </span>
          <span className="text-xs font-medium text-app-muted">
            {formattedDate}
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit ? (
          <>
            <div className="w-28">
              <Input
                type="number"
                inputMode="decimal"
                placeholder={`0.00 ${symbol}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                aria-label={`Amount for ${transaction.name}`}
              />
            </div>
            <Button
              type="button"
              accentColor={wallet.color}
              ripple
              disabled={saving}
              onClick={submit}
              aria-label="Confirm amount"
            >
              {saving ? "…" : "Save"}
            </Button>
          </>
        ) : (
          <span className="text-sm font-bold font-app-mono text-app-muted">
            —
          </span>
        )}
      </div>
    </div>
  );
};

interface PendingTransactionsPanelProps {
  wallet: Wallet;
  pendingTransactions: Transaction[];
  onFilled: () => void;
  onOpenDetails: (tx: Transaction) => void;
}

/**
 * Pinned "awaiting amount" rows shown above the transaction list. Immune to
 * filters/search/pagination by design — these are reminders, they must stay visible.
 */
export const PendingTransactionsPanel: React.FC<
  PendingTransactionsPanelProps
> = ({ wallet, pendingTransactions, onFilled, onOpenDetails }) => {
  if (pendingTransactions.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="mb-1 flex items-center gap-2">
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="text-xs"
          style={{ color: wallet.color }}
        />
        <h4 className="text-xs font-black uppercase tracking-widest text-app-muted">
          Awaiting amount
        </h4>
      </div>
      {pendingTransactions.map((tx) => (
        <PendingTransactionRow
          key={tx.id}
          wallet={wallet}
          transaction={tx}
          onFilled={onFilled}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
};
```

Styling constraints (from `style.md` + saved feedback): soft wallet-color tint via hex-alpha (`0d` bg / `40` border), **no colored glow/halos**, `Button` with `accentColor` + `ripple` (the approved accent pattern).

- [ ] **Step 4: Wire into TransactionsTable and TransactionsTab**

`TransactionsTable.tsx`:
- Add to props interface: `pendingTransactions: Transaction[];` and destructure it.
- `import { PendingTransactionsPanel } from "./PendingTransactionsPanel.tsx";`
- Immediately inside `<div className="flex-1 overflow-auto pb-10 custom-scrollbar">`, before the `isLoading` ternary, add:

```tsx
        {!isLoading && (
          <PendingTransactionsPanel
            wallet={wallet}
            pendingTransactions={pendingTransactions}
            onFilled={onRefresh}
            onOpenDetails={(tx) => detailsModalRef.current?.openModal(tx)}
          />
        )}
```

- Change the empty-state condition from `transactions.length === 0 ? (` to `transactions.length === 0 && pendingTransactions.length === 0 ? (` (when only pending rows exist, the panel alone renders).

`TransactionsTab.tsx`:
- Destructure `pendingTransactions` from `useWalletContext()` and pass `pendingTransactions={pendingTransactions}` to `<TransactionsTable />`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/dashboard/transaction/`
Expected: PASS.

- [ ] **Step 6: Lint, full test run, build, commit**

```bash
cd frontend && npm run lint && npm test && npm run build && cd ..
git add frontend/src
git commit -m "feat(transactions): pinned awaiting-amount panel with inline fill"
```

---

### Task 7: SubscriptionModal — Reminder toggle

**Files:**
- Modify: `frontend/src/modals/subscription/SubscriptionModal.tsx`
- Test: `frontend/src/__tests__/modals/subscription/SubscriptionModal.test.tsx`

**Interfaces:**
- Consumes: `Toggle` primitive (`src/components/ui/Toggle.tsx`, props: `checked/onChange/accentColor/size/label/aria-label/className`); `SubscriptionRequest.amountPending` (Task 1); `Subscription.amountPending` (Task 5).
- Produces: create/edit payloads carry `amountPending: boolean` and send `amount: 0, originalAmount: 0` when it's true.

- [ ] **Step 1: Write the failing test**

Open `frontend/src/__tests__/modals/subscription/SubscriptionModal.test.tsx`, reuse its existing render harness/mocks (api mock, ref-based `openModal`), and add — adapting fixture names to the file's conventions:

```tsx
  it("saves a reminder subscription without requiring an amount", async () => {
    // Reminder sub in edit mode: amount 0 would normally block saving.
    const reminderSub = {
      ...baseSubscriptionFixture, // reuse/extend the file's existing Subscription fixture
      id: "sub-1",
      amount: 0,
      originalAmount: 0,
      amountPending: true,
    };
    // render the modal via the file's harness, then:
    act(() => ref.current!.openModal(reminderSub));

    const save = await screen.findByRole("button", {
      name: /save subscription/i,
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({
      amountPending: true,
      amount: 0,
      originalAmount: 0,
    });
  });

  it("shows the reminder toggle when creating a subscription", () => {
    act(() => ref.current!.openModal());
    expect(
      screen.getByRole("switch", {
        name: "Reminder subscription (no fixed amount)",
      }),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/__tests__/modals/subscription/SubscriptionModal.test.tsx`
Expected: FAIL (no switch found; save disabled with amount 0).

- [ ] **Step 3: Implement the toggle**

In `SubscriptionModal.tsx`:

1. `import Toggle from "../../components/ui/Toggle.tsx";`
2. New state next to `amount`: `const [amountPending, setAmountPending] = useState(false);`
3. In `openModal` EDIT branch: `setAmountPending(sub.amountPending ?? false);` — in CREATE branch: `setAmountPending(false);`
4. `handleSave` — make the amount validation conditional:

```tsx
      if (!amountPending && (!amount || Number(amount) === 0))
        return triggerToast("Please enter a valid amount.", false);
```

5. In the payload replace the two amount lines with:

```tsx
          amount: amountPending ? 0 : Math.abs(Number(convertedAmount)),
          originalAmount: amountPending ? 0 : Math.abs(Number(amount)),
          amountPending,
```

6. `canSave`:

```tsx
    const canSave =
      (amountPending || (amount !== "" && Number(amount) !== 0)) &&
      selectedTagName !== "" &&
      type !== "";
```

7. In the amount area (section `1. AMOUNT AREA`), hide the `AmountInput` while reminding and add the toggle below `TransactionTypeToggle`:

```tsx
          <div className="flex flex-col items-center justify-center py-2">
            {!amountPending && (
              <AmountInput
                value={amount}
                type={type}
                setType={setType}
                currencySymbol={currencySymbol}
                autoFocus={!isEditing}
                onAmountChange={(val) => {
                  setAmount(val);
                  if (currency !== baseCurrency && exchangeRate)
                    setConvertedAmount(
                      (Number(val) * Number(exchangeRate)).toFixed(2),
                    );
                  else setConvertedAmount(val);
                }}
              />
            )}
            <TransactionTypeToggle type={type} setType={setType} />
            <Toggle
              checked={amountPending}
              onChange={setAmountPending}
              accentColor={wallet.color}
              size="sm"
              className="mt-3"
              label="Reminder — no fixed amount, fill it in each time"
              aria-label="Reminder subscription (no fixed amount)"
            />
          </div>
```

Keep `ExchangeRateSection` visible: currency choice (and manual-rate mode) stays meaningful for foreign-currency reminders — the fill endpoint uses it. With no amount its conversion preview just reads 0; acceptable for v1.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/modals/subscription/`
Expected: PASS (new + pre-existing).

- [ ] **Step 5: Lint, build, commit**

```bash
cd frontend && npm run lint && npm run build && cd ..
git add frontend/src
git commit -m "feat(subscription): reminder toggle in SubscriptionModal"
```

---

### Task 8: Display states — SubscriptionCard, SubscriptionView, TransactionView

**Files:**
- Modify: `frontend/src/dashboard/subscription/SubscriptionCard.tsx` (amount block, ~lines 178–195)
- Modify: `frontend/src/modals/subscription/SubscriptionView.tsx` (amount block, ~lines 65–74)
- Modify: `frontend/src/modals/TransactionModal/TransactionView.tsx` (amount block, ~lines 60–70)
- Test: `frontend/src/__tests__/modals/subscription/SubscriptionView.test.tsx`
- Test: `frontend/src/__tests__/modals/TransactionModal/TransactionDetailsModal.test.tsx`

**Interfaces:**
- Consumes: `subscription.amountPending` / `tx.amountPending` (Task 5).
- Produces: user-visible copy `Reminder` (subscription contexts) and `Amount pending` (transaction details) — the exact strings the tests assert.

- [ ] **Step 1: Write the failing tests**

In `SubscriptionView.test.tsx` add (reusing the file's fixture/render helpers):

```tsx
  it("shows 'Reminder' instead of the amount for reminder subscriptions", () => {
    // render with a subscription fixture extended with: amount: 0, amountPending: true
    expect(screen.getByText("Reminder")).toBeInTheDocument();
    // Note: don't assert the absence of "0.00" — the exchange section of the
    // details view may legitimately render zeros elsewhere.
  });
```

In `TransactionDetailsModal.test.tsx` add (reusing its open/render helper):

```tsx
  it("shows 'Amount pending' for a pending transaction", () => {
    // open the modal with a transaction fixture extended with: amount: 0, amountPending: true
    expect(screen.getByText("Amount pending")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/__tests__/modals/subscription/SubscriptionView.test.tsx src/__tests__/modals/TransactionModal/TransactionDetailsModal.test.tsx`
Expected: the 2 new tests FAIL.

- [ ] **Step 3: Implement the three display states**

`SubscriptionCard.tsx` — replace the amount row (inside the right-side `div` with `font-app-mono`):

```tsx
        <div
          className={`text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${isIncome ? "text-app-green" : "text-app-red"}`}
        >
          {subscription.amountPending ? (
            <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
              Reminder
            </span>
          ) : (
            <>
              <span>
                {isIncome ? "+" : "-"}
                {subscription.amount.toFixed(2)}
              </span>
              <span>
                {
                  CURRENCY_META[subscription.originalCurrency as CurrencyCode]
                    ?.symbol
                }
              </span>
            </>
          )}
          <span className="text-xs text-app-muted font-sans font-medium ml-0.5">
            / {frequencyText}
          </span>
        </div>
```

`SubscriptionView.tsx` — wrap the big amount `<p>` (keep the status pill below untouched):

```tsx
        {sub.amountPending ? (
          <p className="text-4xl font-app-mono text-app-muted">Reminder</p>
        ) : (
          <p
            className={`text-6xl font-app-mono ${isIncome ? "text-app-green" : "text-app-red"}`}
          >
            {isIncome ? "+" : "-"}
            {sub.amount.toFixed(2)}{" "}
            <span className="text-3xl">
              {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}
            </span>
          </p>
        )}
```

`TransactionView.tsx` — same pattern:

```tsx
        <div className="text-center mt-2">
          {tx.amountPending ? (
            <p className="text-4xl font-app-mono text-app-muted">
              Amount pending
            </p>
          ) : (
            <p
              className={`text-6xl font-app-mono ${isIncome ? "text-app-green" : "text-app-red"}`}
            >
              {isIncome ? "+" : "-"}
              {tx.amount.toFixed(2)}{" "}
              <span className="text-3xl">
                {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}
              </span>
            </p>
          )}
        </div>
```

(`SubscriptionCalendar` needs no change: day cells render only `TagBadge`s; a pending past occurrence opens the transaction details, which now says "Amount pending".)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/modals/ src/__tests__/dashboard/`
Expected: PASS.

- [ ] **Step 5: Lint, build, commit**

```bash
cd frontend && npm run lint && npm run build && cd ..
git add frontend/src
git commit -m "feat(subscription): reminder/pending display states in cards and detail views"
```

---

### Task 9: Full verification + knowledge-graph update + handoff

**Files:**
- Modify: `.claude/TODO/reminder-subscriptions.md` (tick checkboxes)
- Modify: `graphify-out/` (regenerated)

- [ ] **Step 1: Full backend gate (Spotless + 90% coverage)**

Run: `cd backend && ./gradlew check`
Expected: BUILD SUCCESSFUL (includes `jacocoTestCoverageVerification`). If coverage dips below 90%, the untested lines are in this feature's new code — add the missing service-test cases; do not lower the gate.

- [ ] **Step 2: Full frontend gate (CI order)**

Run: `cd frontend && npm run lint && npm test && npm run build`
Expected: all three succeed.

- [ ] **Step 3: Optional end-to-end sanity check**

Use the repo's `/verify` skill (throwaway Postgres + second bootRun — do not touch the running dev services): create a reminder subscription with `startDate` = today via `POST /api/subscription/{walletId}`, confirm the response and `GET /api/transactions/{walletId}` show a pending transaction (`amountPending: true, amount: 0`), fill it via `PUT /api/transactions/{walletId}/{txId}/amount` with `{"originalAmount": 2450}`, confirm `amountPending: false, amount: 2450.00` and the unchanged scheduled date.

- [ ] **Step 4: Update the knowledge graph**

Run: `graphify update .` (from repo root — required by CLAUDE.md after code changes).

- [ ] **Step 5: Commit and hand off**

```bash
git add -A
git commit -m "chore: reminder-subscriptions plan checkboxes + graph update"
```

Then follow **superpowers:finishing-a-development-branch**. The branch is `feat/reminder-subscriptions` (base `release/v3.2.0`). **Do not merge** — the user merges manually. When Phase 1 ships, move this file's Phase-1 content to `.claude/TODO/DONE/` keeping the Phase 2–5 census active.
