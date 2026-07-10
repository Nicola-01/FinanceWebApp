# Budgeting — Implementation Plan / TODO

> ## ✅ COMPLETED — 2026-07-11
> Implemented via **superpowers:subagent-driven-development** (a fresh implementer + a
> task reviewer per task, plus a final whole-branch review on Opus). All 10 feature tasks
> (backend 1–6, frontend 7–10) are done, reviewed, and gated green (backend `./gradlew
> check`, coverage ≥91%; frontend lint + Vitest + build). Per-task review findings were
> fixed in-loop (e.g. threshold null-guard ordering, `subtreeTagIds` cycle guard,
> per-threshold alert isolation + `currency` HTML-escaping, `useBudgets`/overlay test
> gaps, duplicate-threshold chip).
>
> **Final whole-branch review surfaced & fixed 3 issues the per-task reviews couldn't see:**
> 1. **CRITICAL** — the alert cron resolved recipients with a lazy `WalletAccess.getUser()`
>    on the (non-transactional) scheduler thread → `LazyInitializationException` swallowed
>    per-budget → **no threshold email would ever send on the real hourly schedule** (admin
>    "Run now" masked it). Fixed by using the eager `findAllByWalletIdAndStatus`.
> 2. Editing a recurring budget reset its `startDate` to today → wiped the rollover anchor/
>    carry. Fixed by preserving the entity's existing `startDate` when the request omits it.
> 3. Deleting a tag referenced by a budget threw a 500 (unhandled FK). Fixed with a
>    `budgetRepository.existsByTag` guard → clean `TagInUseException` (409).
>
> - **Task 11 (MCP budget tools): SKIPPED** per user decision.
> - **graphify update: SKIPPED** (heavy regeneration deferred).
> - **Merge:** `feat/budgeting` was merged **manually by the user** (concurrent with this
>   session) into `Feat/budget` → `release/v3.5.0`; that merged state was re-verified green
>   (backend `./gradlew test` + frontend `npm test` + `npm run build`).
> - Roadmap `todoData.ts` "Budgeting" set to `STARTED`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> Spec: `docs/superpowers/specs/2026-07-08-budgeting-design.md` (read it first — it holds
> the confirmed requirements and all semantics referenced below).
> Branch: `feat/budgeting` — **ask the user which base branch to cut it from before
> starting** (house rule: one branch per task, never commit to `release/*`/`main`; the
> user merges manually).

**Goal:** Per-wallet budgets (per-tag incl. subtree, or whole-wallet) with recurring
(weekly/monthly/yearly) or custom-range periods, optional rollover, live computed
tracking, a Budget wallet tab, and threshold alerts (in-app status + deduplicated
emails from a scheduled job).

**Architecture:** Computed-on-read — a `Budget` entity plus aggregate SUM queries over
`transactions` at request time; no materialized counters, no hooks in transaction write
paths. A `BudgetAlertLog` table remembers which (budget, period, threshold) emails were
already sent; a `ManagedJob` (`budget-alerts`, hourly) recomputes and emails ACCEPTED
wallet members. Frontend: a `useBudgets` hook + colocated components under
`src/dashboard/budget/`, wired into the existing (stubbed) `"budget"` wallet tab.

**Tech Stack:** Spring Boot 3.5 / Java 21 / JPA / H2 tests; React 19 + TS + Tailwind 4;
Vitest + Testing Library; existing `components/ui/` primitives.

## Global Constraints (apply to every task)

- **English only** — code, comments, UI copy.
- **All endpoints under `/api/...`**; tags are addressed **by name** in the API (no tag
  ids in DTOs).
- Backend gates: `./gradlew test` green, **add tests for your change**, then
  `./gradlew spotlessApply` and keep `./gradlew check` (Spotless + **≥90% line
  coverage**) passing. New entity PKs are **UUIDv7** (`@UuidGenerator(algorithm =
  UuidV7Generator.class)`). Schema evolves via `ddl-auto=update` — **no migration files**.
- Frontend gates (run from `frontend/`, same order as CI): `npm run lint` → `npm test`
  → `npm run build`. Tests live under `src/__tests__/` mirroring the source tree. No
  path aliases — relative imports only.
- **UI:** read `frontend/style.md` before any UI task. Reuse `components/ui/`
  primitives (`Button`, `Input`, `CustomSelect`, `ResponsiveOverlay`) — never
  hand-rolled `<button>`/`<input>`. Theme-aware `app-*` colour tokens (never legacy
  `theme-*`), radius scale, per-wallet accent = `wallet.color`, **no colored
  glow/halos**. Status colours use **soft 400-tints** (`#34d399` / `#fbbf24` /
  `#f87171`), not saturated 500s.
- Do **not** kill the running Vite dev server between turns.
- Commit at the end of every task (messages below follow the repo's
  `feat(scope): ...` style).

---

## Phase A — Backend

### Task 1: `Budget` entity, `BudgetRepository`, expense aggregates

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Budget.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/BudgetRepository.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/TransactionRepository.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/repository/BudgetRepositoryTest.java`

**Interfaces (Produces — later tasks depend on these exact names):**
- `Budget` entity with nested `Budget.PeriodType { WEEKLY, MONTHLY, YEARLY, CUSTOM }`;
  fields `id, wallet, tag, name, limitAmount, periodType, startDate, endDate, rollover,
  alertThresholds` (thresholds = JSON int-array string, default `"[80,100]"`).
- `BudgetRepository.findAllByWalletId(UUID)`, `findByIdAndWalletId(UUID, UUID)`,
  `findAllWithWalletAndTag()`.
- `TransactionRepository.sumAmountByWalletAndDateRange(UUID, Transaction.Type, LocalDate, LocalDate)`
  and `sumAmountByWalletAndDateRangeAndTags(UUID, Transaction.Type, LocalDate, LocalDate, Collection<UUID>)`
  — both return `BigDecimal`, never null (`COALESCE`).

- [x] **Step 1: Write the failing repository test**

```java
package dev.busato.FinanceWebApp.backend.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class BudgetRepositoryTest {

  @Autowired private WalletRepository walletRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;
  @Autowired private BudgetRepository budgetRepository;

  private Wallet wallet;
  private Tag food;
  private Tag restaurants; // child of food

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("Budget Wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    food = tagRepository.save(Tag.builder().name("Food").wallet(wallet).build());
    restaurants =
        tagRepository.save(Tag.builder().name("Restaurants").wallet(wallet).parent(food).build());

    tx("Groceries", "50.00", Transaction.Type.EXPENSE, food, LocalDate.of(2026, 7, 10));
    tx("Dinner", "30.00", Transaction.Type.EXPENSE, restaurants, LocalDate.of(2026, 7, 20));
    tx("Untagged", "20.00", Transaction.Type.EXPENSE, null, LocalDate.of(2026, 7, 12));
    tx("Salary", "2000.00", Transaction.Type.INCOME, null, LocalDate.of(2026, 7, 15));
    tx("Old expense", "99.00", Transaction.Type.EXPENSE, food, LocalDate.of(2026, 6, 15));
  }

  private void tx(String name, String amount, Transaction.Type type, Tag tag, LocalDate date) {
    transactionRepository.save(
        Transaction.builder()
            .wallet(wallet)
            .name(name)
            .amount(new BigDecimal(amount))
            .originalAmount(new BigDecimal(amount))
            .type(type)
            .tag(tag)
            .transactionDate(date)
            .build());
  }

  @Test
  void sumByWallet_countsOnlyExpensesInRange() {
    BigDecimal sum =
        transactionRepository.sumAmountByWalletAndDateRange(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31));
    // 50 + 30 + 20 — income and the June expense are excluded
    assertEquals(0, new BigDecimal("100.00").compareTo(sum));
  }

  @Test
  void sumByTags_filtersToTheGivenTagIds() {
    BigDecimal subtree =
        transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31),
            List.of(food.getId(), restaurants.getId()));
    assertEquals(0, new BigDecimal("80.00").compareTo(subtree));

    BigDecimal leafOnly =
        transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 31),
            List.of(restaurants.getId()));
    assertEquals(0, new BigDecimal("30.00").compareTo(leafOnly));
  }

  @Test
  void sum_withNoMatches_returnsZeroNotNull() {
    BigDecimal sum =
        transactionRepository.sumAmountByWalletAndDateRange(
            wallet.getId(),
            Transaction.Type.EXPENSE,
            LocalDate.of(2020, 1, 1),
            LocalDate.of(2020, 1, 31));
    assertEquals(0, BigDecimal.ZERO.compareTo(sum));
  }

  @Test
  void budget_persistsAndLoadsWithDefaults() {
    budgetRepository.save(
        Budget.builder()
            .wallet(wallet)
            .tag(food)
            .name("Food budget")
            .limitAmount(new BigDecimal("300.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .build());

    List<Budget> found = budgetRepository.findAllByWalletId(wallet.getId());
    assertEquals(1, found.size());
    assertEquals("[80,100]", found.get(0).getAlertThresholds());
    assertEquals(false, found.get(0).isRollover());
  }
}
```

- [x] **Step 2: Run it to verify it fails**

Run (from `backend/`): `./gradlew test --tests "*.BudgetRepositoryTest"`
Expected: COMPILATION FAILURE (`Budget`/`BudgetRepository`/`sumAmountByWalletAndDateRange` don't exist).

- [x] **Step 3: Create the entity**

`model/Budget.java` — same Lombok/annotation style as `Transaction.java`:

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "budgets")
public class Budget {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  // Null means the budget tracks the whole wallet. A tag budget also counts the
  // tag's entire subtree of child tags.
  @ManyToOne
  @JoinColumn(name = "tag_id")
  private Tag tag;

  @Column(nullable = false)
  private String name;

  // Spending limit per period, in the wallet's currency.
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal limitAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PeriodType periodType;

  // Recurring: activation anchor — the first period is the calendar period containing
  // this date (no proration). CUSTOM: the range start.
  @Column(nullable = false)
  private LocalDate startDate;

  // CUSTOM only (inclusive). Null for recurring budgets.
  private LocalDate endDate;

  // Recurring only: carry the unspent/overspent remainder into the next period.
  @Builder.Default
  @Column(nullable = false)
  private boolean rollover = false;

  // JSON int array (e.g. "[80,100]"), sorted ascending, values 1–200, max 5 entries.
  // Empty array = alerts disabled for this budget. Same JSON-in-column precedent as
  // PersonalAccessToken.walletPermissions.
  @Builder.Default
  @Column(nullable = false)
  private String alertThresholds = "[80,100]";

  public enum PeriodType {
    WEEKLY,
    MONTHLY,
    YEARLY,
    CUSTOM
  }
}
```

- [x] **Step 4: Create the repository and the aggregate queries**

`repository/BudgetRepository.java`:

```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
  List<Budget> findAllByWalletId(UUID walletId);

  Optional<Budget> findByIdAndWalletId(UUID id, UUID walletId);

  /** All budgets with wallet and tag eagerly loaded — used by the alerts cron job. */
  @Query("SELECT b FROM Budget b JOIN FETCH b.wallet LEFT JOIN FETCH b.tag")
  List<Budget> findAllWithWalletAndTag();
}
```

Add to `repository/TransactionRepository.java` (keep existing methods untouched;
imports: `java.math.BigDecimal`, `java.time.LocalDate`, `java.util.Collection`,
`org.springframework.data.jpa.repository.Query`, `org.springframework.data.repository.query.Param`):

```java
  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.wallet.id = :walletId
        AND t.type = :type
        AND t.transactionDate BETWEEN :from AND :to
      """)
  BigDecimal sumAmountByWalletAndDateRange(
      @Param("walletId") UUID walletId,
      @Param("type") Transaction.Type type,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.wallet.id = :walletId
        AND t.type = :type
        AND t.transactionDate BETWEEN :from AND :to
        AND t.tag.id IN :tagIds
      """)
  BigDecimal sumAmountByWalletAndDateRangeAndTags(
      @Param("walletId") UUID walletId,
      @Param("type") Transaction.Type type,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("tagIds") Collection<UUID> tagIds);
```

- [x] **Step 5: Run the test to verify it passes**

Run: `./gradlew test --tests "*.BudgetRepositoryTest"`
Expected: PASS (4 tests).

- [x] **Step 6: Format + full suite + commit**

```bash
./gradlew spotlessApply test
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/model/Budget.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/BudgetRepository.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/TransactionRepository.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/repository/BudgetRepositoryTest.java
git commit -m "feat(budget): Budget entity, repository and expense aggregate queries"
```

---

### Task 2: `BudgetPeriods` — pure period math

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/BudgetPeriods.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/BudgetPeriodsTest.java`

**Interfaces (Produces):**
- `BudgetPeriods.Period(LocalDate start, LocalDate end, String key, int elapsedPeriods)` (record)
- `static Period currentPeriod(Budget budget, LocalDate today)`
- `static boolean isActive(Budget budget, LocalDate today)`
- `static LocalDate firstPeriodStart(Budget budget)`

Semantics (from spec §2.2): WEEKLY = ISO week Mon–Sun, key `2026-W28`; MONTHLY =
calendar month, key `2026-07`; YEARLY = calendar year, key `2026`; CUSTOM = the fixed
`[startDate, endDate]` range, key `custom`, `elapsedPeriods = 1`. `elapsedPeriods`
counts calendar periods from the one containing `startDate` through today's, inclusive.
`isActive`: recurring → today is not before the first period's start; CUSTOM → today
within the range (inclusive).

- [x] **Step 1: Write the failing test**

```java
package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class BudgetPeriodsTest {

  private Budget budget(Budget.PeriodType type, LocalDate start, LocalDate end) {
    return Budget.builder()
        .name("b")
        .limitAmount(new BigDecimal("100.00"))
        .periodType(type)
        .startDate(start)
        .endDate(end)
        .build();
  }

  @Test
  void monthly_boundsKeyAndElapsed() {
    Budget b = budget(Budget.PeriodType.MONTHLY, LocalDate.of(2026, 5, 20), null);
    BudgetPeriods.Period p = BudgetPeriods.currentPeriod(b, LocalDate.of(2026, 7, 8));
    assertEquals(LocalDate.of(2026, 7, 1), p.start());
    assertEquals(LocalDate.of(2026, 7, 31), p.end());
    assertEquals("2026-07", p.key());
    assertEquals(3, p.elapsedPeriods()); // May, June, July
  }

  @Test
  void weekly_isoWeekAcrossYearBoundary() {
    Budget b = budget(Budget.PeriodType.WEEKLY, LocalDate.of(2025, 12, 1), null);
    // 2025-12-31 falls in ISO week 2026-W01 (Mon 2025-12-29 .. Sun 2026-01-04)
    BudgetPeriods.Period p = BudgetPeriods.currentPeriod(b, LocalDate.of(2025, 12, 31));
    assertEquals(LocalDate.of(2025, 12, 29), p.start());
    assertEquals(LocalDate.of(2026, 1, 4), p.end());
    assertEquals("2026-W01", p.key());
    assertEquals(5, p.elapsedPeriods()); // weeks of Dec 1, 8, 15, 22, 29
  }

  @Test
  void yearly_boundsAndKey() {
    Budget b = budget(Budget.PeriodType.YEARLY, LocalDate.of(2025, 3, 10), null);
    BudgetPeriods.Period p = BudgetPeriods.currentPeriod(b, LocalDate.of(2026, 7, 8));
    assertEquals(LocalDate.of(2026, 1, 1), p.start());
    assertEquals(LocalDate.of(2026, 12, 31), p.end());
    assertEquals("2026", p.key());
    assertEquals(2, p.elapsedPeriods());
  }

  @Test
  void leapFebruary_monthlyEndIs29() {
    Budget b = budget(Budget.PeriodType.MONTHLY, LocalDate.of(2028, 1, 1), null);
    BudgetPeriods.Period p = BudgetPeriods.currentPeriod(b, LocalDate.of(2028, 2, 10));
    assertEquals(LocalDate.of(2028, 2, 29), p.end());
  }

  @Test
  void custom_fixedRangeSinglePeriod() {
    Budget b =
        budget(Budget.PeriodType.CUSTOM, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 8, 31));
    BudgetPeriods.Period p = BudgetPeriods.currentPeriod(b, LocalDate.of(2026, 7, 8));
    assertEquals(LocalDate.of(2026, 6, 1), p.start());
    assertEquals(LocalDate.of(2026, 8, 31), p.end());
    assertEquals("custom", p.key());
    assertEquals(1, p.elapsedPeriods());
  }

  @Test
  void isActive_recurringActiveFromPeriodContainingStartDate() {
    // startDate July 20, today July 8: same calendar month → already active (spec: no proration)
    Budget b = budget(Budget.PeriodType.MONTHLY, LocalDate.of(2026, 7, 20), null);
    assertTrue(BudgetPeriods.isActive(b, LocalDate.of(2026, 7, 8)));
    assertFalse(BudgetPeriods.isActive(b, LocalDate.of(2026, 6, 30)));
  }

  @Test
  void isActive_customEndsAfterEndDate() {
    Budget b =
        budget(Budget.PeriodType.CUSTOM, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));
    assertTrue(BudgetPeriods.isActive(b, LocalDate.of(2026, 6, 30)));
    assertFalse(BudgetPeriods.isActive(b, LocalDate.of(2026, 7, 1)));
  }

  @Test
  void firstPeriodStart_snapsToCalendarPeriod() {
    assertEquals(
        LocalDate.of(2026, 5, 1),
        BudgetPeriods.firstPeriodStart(
            budget(Budget.PeriodType.MONTHLY, LocalDate.of(2026, 5, 20), null)));
    assertEquals(
        LocalDate.of(2026, 6, 1),
        BudgetPeriods.firstPeriodStart(
            budget(
                Budget.PeriodType.CUSTOM, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 8, 31))));
  }
}
```

- [x] **Step 2: Run to verify it fails** — `./gradlew test --tests "*.BudgetPeriodsTest"` → compilation failure.

- [x] **Step 3: Implement**

```java
package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;

/** Pure calendar math for budget periods. See the spec (§2.2) for the semantics. */
public final class BudgetPeriods {

  private BudgetPeriods() {}

  /** One tracked period: inclusive bounds, its alert-log key, and how many periods have
   * elapsed from the budget's first period through this one (inclusive). */
  public record Period(LocalDate start, LocalDate end, String key, int elapsedPeriods) {}

  public static Period currentPeriod(Budget budget, LocalDate today) {
    LocalDate startDate = budget.getStartDate();
    return switch (budget.getPeriodType()) {
      case WEEKLY -> {
        LocalDate start = today.with(DayOfWeek.MONDAY);
        String key =
            String.format(
                "%d-W%02d",
                start.get(IsoFields.WEEK_BASED_YEAR), start.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
        int elapsed =
            (int) ChronoUnit.WEEKS.between(startDate.with(DayOfWeek.MONDAY), start) + 1;
        yield new Period(start, start.plusDays(6), key, elapsed);
      }
      case MONTHLY -> {
        YearMonth ym = YearMonth.from(today);
        int elapsed =
            (int)
                    ChronoUnit.MONTHS.between(
                        YearMonth.from(startDate).atDay(1), ym.atDay(1))
                + 1;
        yield new Period(ym.atDay(1), ym.atEndOfMonth(), ym.toString(), elapsed);
      }
      case YEARLY -> {
        LocalDate start = today.withDayOfYear(1);
        int elapsed = today.getYear() - startDate.getYear() + 1;
        yield new Period(
            start, LocalDate.of(today.getYear(), 12, 31), String.valueOf(today.getYear()), elapsed);
      }
      case CUSTOM -> new Period(startDate, budget.getEndDate(), "custom", 1);
    };
  }

  /** Recurring: active from the start of the calendar period containing startDate.
   * CUSTOM: active only within the (inclusive) range. */
  public static boolean isActive(Budget budget, LocalDate today) {
    if (budget.getPeriodType() == Budget.PeriodType.CUSTOM) {
      return !today.isBefore(budget.getStartDate()) && !today.isAfter(budget.getEndDate());
    }
    return !today.isBefore(firstPeriodStart(budget));
  }

  /** Start of the budget's first period (the calendar period containing startDate). */
  public static LocalDate firstPeriodStart(Budget budget) {
    LocalDate startDate = budget.getStartDate();
    return switch (budget.getPeriodType()) {
      case WEEKLY -> startDate.with(DayOfWeek.MONDAY);
      case MONTHLY -> startDate.withDayOfMonth(1);
      case YEARLY -> startDate.withDayOfYear(1);
      case CUSTOM -> startDate;
    };
  }
}
```

- [x] **Step 4: Run to verify it passes** — `./gradlew test --tests "*.BudgetPeriodsTest"` → PASS (8 tests).

- [x] **Step 5: Format + commit**

```bash
./gradlew spotlessApply
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/service/BudgetPeriods.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/service/BudgetPeriodsTest.java
git commit -m "feat(budget): period math (ISO week/month/year/custom, rollover-elapsed count)"
```

---

### Task 3: DTOs, exceptions, `BudgetMapper`

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/BudgetRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/BudgetStatusResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/exceptions/BudgetNotFoundException.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/exceptions/BudgetConflictException.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/BudgetMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/GlobalExceptionHandler.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/mappers/BudgetMapperTest.java`

**Interfaces (Produces):**
- `BudgetRequest { String name; String tagName; BigDecimal limitAmount; Budget.PeriodType periodType; LocalDate startDate; LocalDate endDate; Boolean rollover; List<Integer> alertThresholds; }`
- `BudgetStatusResponse` — entity fields (`id, name, tagName, limitAmount, periodType,
  startDate, endDate, rollover, alertThresholds`) + computed (`periodStart, periodEnd,
  spent, effectiveLimit, remaining, percentUsed, status, crossedThresholds, active`);
  `status` is a `String`: `"OK" | "WARNING" | "EXCEEDED"`.
- `BudgetMapper.thresholdsToJson(List<Integer>)` (null → default `[80,100]`; validates,
  dedupes, sorts), `thresholdsFromJson(String)`, `baseResponse(Budget)` returning the
  half-filled `BudgetStatusResponse.BudgetStatusResponseBuilder`.
- `BudgetNotFoundException(UUID id)` → 404; `BudgetConflictException(String message)` → 409.

- [x] **Step 1: Write the failing mapper test**

```java
package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class BudgetMapperTest {

  private final BudgetMapper mapper = new BudgetMapper(new ObjectMapper());

  @Test
  void thresholds_roundTrip_sortedAndDeduped() {
    assertEquals("[50,80,100]", mapper.thresholdsToJson(List.of(100, 50, 80, 50)));
    assertEquals(List.of(50, 80, 100), mapper.thresholdsFromJson("[50,80,100]"));
  }

  @Test
  void thresholds_nullMeansDefault_emptyStays() {
    assertEquals("[80,100]", mapper.thresholdsToJson(null));
    assertEquals("[]", mapper.thresholdsToJson(List.of()));
    assertEquals(List.of(), mapper.thresholdsFromJson(null));
  }

  @Test
  void thresholds_invalidValuesRejected() {
    assertThrows(IllegalArgumentException.class, () -> mapper.thresholdsToJson(List.of(0)));
    assertThrows(IllegalArgumentException.class, () -> mapper.thresholdsToJson(List.of(201)));
    assertThrows(
        IllegalArgumentException.class,
        () -> mapper.thresholdsToJson(List.of(10, 20, 30, 40, 50, 60)));
  }

  @Test
  void baseResponse_mapsEntityFields() {
    Budget b =
        Budget.builder()
            .name("Food budget")
            .tag(Tag.builder().name("Food").build())
            .limitAmount(new BigDecimal("300.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .rollover(true)
            .alertThresholds("[80,100]")
            .build();

    var response = mapper.baseResponse(b).build();
    assertEquals("Food budget", response.getName());
    assertEquals("Food", response.getTagName());
    assertEquals(Budget.PeriodType.MONTHLY, response.getPeriodType());
    assertTrue(response.isRollover());
    assertEquals(List.of(80, 100), response.getAlertThresholds());
  }

  @Test
  void baseResponse_nullTagMeansWholeWallet() {
    Budget b =
        Budget.builder()
            .name("Everything")
            .limitAmount(new BigDecimal("1000.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .alertThresholds("[80,100]")
            .build();
    assertNull(mapper.baseResponse(b).build().getTagName());
  }
}
```

- [x] **Step 2: Run to verify it fails** — `./gradlew test --tests "*.BudgetMapperTest"` → compilation failure.

- [x] **Step 3: Implement DTOs, exceptions, mapper, handler entries**

`dto/BudgetRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Budget;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetRequest {
  @NotBlank(message = "Name is required")
  @Size(min = 3, max = 25, message = "The name must be between 3 and 25 characters long.")
  private String name;

  // Null tracks the whole wallet; otherwise must match a tag of this wallet by name.
  private String tagName;

  @NotNull(message = "Limit amount is required")
  @DecimalMin(value = "0.01", message = "The limit must be greater than zero.")
  private BigDecimal limitAmount;

  @NotNull(message = "Period type is required")
  private Budget.PeriodType periodType;

  private LocalDate startDate; // null -> today
  private LocalDate endDate; // required iff CUSTOM
  private Boolean rollover; // null -> false; ignored (stored false) for CUSTOM
  private List<Integer> alertThresholds; // null -> [80,100]; empty -> alerts disabled
}
```

`dto/BudgetStatusResponse.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetStatusResponse {
  // Entity fields
  private UUID id;
  private String name;
  private String tagName; // null = whole-wallet budget
  private BigDecimal limitAmount;
  private Budget.PeriodType periodType;
  private LocalDate startDate;
  private LocalDate endDate;
  private boolean rollover;
  private List<Integer> alertThresholds;

  // Computed for the current period (see spec §2.2)
  private LocalDate periodStart;
  private LocalDate periodEnd;
  private BigDecimal spent;
  private BigDecimal effectiveLimit; // limitAmount + rollover carry
  private BigDecimal remaining;
  private int percentUsed; // floored; pinned to 100 when effectiveLimit <= 0
  private String status; // "OK" | "WARNING" | "EXCEEDED"
  private List<Integer> crossedThresholds;
  private boolean active;
}
```

`exceptions/BudgetNotFoundException.java` (mirror `TagNotFoundException` style):

```java
package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class BudgetNotFoundException extends RuntimeException {
  public BudgetNotFoundException(UUID budgetId) {
    super("Budget not found: " + budgetId);
  }
}
```

`exceptions/BudgetConflictException.java`:

```java
package dev.busato.FinanceWebApp.backend.exceptions;

public class BudgetConflictException extends RuntimeException {
  public BudgetConflictException(String message) {
    super(message);
  }
}
```

`mappers/BudgetMapper.java`:

```java
package dev.busato.FinanceWebApp.backend.mappers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BudgetMapper {

  public static final List<Integer> DEFAULT_THRESHOLDS = List.of(80, 100);
  private static final int MAX_THRESHOLDS = 5;

  private final ObjectMapper objectMapper;

  /** Validates, dedupes and sorts the thresholds, then serializes them for the column.
   * Null means "use the default"; an explicit empty list disables alerts. */
  public String thresholdsToJson(List<Integer> thresholds) {
    List<Integer> effective = thresholds == null ? DEFAULT_THRESHOLDS : thresholds;
    List<Integer> clean = effective.stream().distinct().sorted().toList();
    if (clean.size() > MAX_THRESHOLDS)
      throw new IllegalArgumentException("At most " + MAX_THRESHOLDS + " alert thresholds.");
    if (clean.stream().anyMatch(t -> t == null || t < 1 || t > 200))
      throw new IllegalArgumentException("Alert thresholds must be between 1 and 200.");
    try {
      return objectMapper.writeValueAsString(clean);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid alert thresholds.", e);
    }
  }

  public List<Integer> thresholdsFromJson(String json) {
    if (json == null || json.isBlank()) return List.of();
    try {
      return objectMapper.readValue(json, new TypeReference<List<Integer>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  /** Entity-field half of the response; the service fills in the computed fields. */
  public BudgetStatusResponse.BudgetStatusResponseBuilder baseResponse(Budget budget) {
    return BudgetStatusResponse.builder()
        .id(budget.getId())
        .name(budget.getName())
        .tagName(budget.getTag() != null ? budget.getTag().getName() : null)
        .limitAmount(budget.getLimitAmount())
        .periodType(budget.getPeriodType())
        .startDate(budget.getStartDate())
        .endDate(budget.getEndDate())
        .rollover(budget.isRollover())
        .alertThresholds(thresholdsFromJson(budget.getAlertThresholds()));
  }
}
```

Add to `controller/GlobalExceptionHandler.java`, following the existing
`buildErrorResponse` pattern exactly:

```java
  @ExceptionHandler(BudgetNotFoundException.class)
  public ResponseEntity<ProblemDetail> handleBudgetNotFoundException(
      BudgetNotFoundException ex, HttpServletRequest request) {
    return buildErrorResponse(ex, HttpStatus.NOT_FOUND, "Budget Not Found", request);
  }

  @ExceptionHandler(BudgetConflictException.class)
  public ResponseEntity<ProblemDetail> handleBudgetConflictException(
      BudgetConflictException ex, HttpServletRequest request) {
    return buildErrorResponse(ex, HttpStatus.CONFLICT, "Budget Conflict", request);
  }
```

(Match the handler method signature style already in the file — check how existing
handlers receive the request parameter and copy that exact shape, and add the imports
the file already uses for the other exceptions.)

- [x] **Step 4: Run to verify it passes** — `./gradlew test --tests "*.BudgetMapperTest"` → PASS (5 tests).

- [x] **Step 5: Format + commit**

```bash
./gradlew spotlessApply
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/BudgetRequest.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/BudgetStatusResponse.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/exceptions/ \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/BudgetMapper.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/GlobalExceptionHandler.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/mappers/BudgetMapperTest.java
git commit -m "feat(budget): request/response DTOs, mapper with thresholds codec, 404/409 handlers"
```

---

### Task 4: `BudgetService` — CRUD, validation, status computation

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/BudgetService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/TagRepository.java`
  (fix the generic: `JpaRepository<Tag, Long>` → `JpaRepository<Tag, UUID>` — `Tag.id`
  is a `UUID`; first `grep -rn "tagRepository.findById\|tagRepository.getReferenceById\|tagRepository.deleteById" backend/src/main/java`
  to confirm no caller uses a `Long`-typed method — none does today)
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/BudgetServiceTest.java`

**Interfaces:**
- Consumes: Task 1 repositories, Task 2 `BudgetPeriods`, Task 3 DTOs/mapper/exceptions.
- Produces (used by controller and cron job):
  - `List<BudgetStatusResponse> getBudgets(UUID walletId, UUID userId)` — `@PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")`
  - `BudgetStatusResponse createBudget(BudgetRequest request, UUID walletId, UUID userId)` — write access
  - `BudgetStatusResponse updateBudget(UUID budgetId, BudgetRequest request, UUID walletId, UUID userId)` — write access
  - `void deleteBudget(UUID budgetId, UUID walletId, UUID userId)` — write access
  - `BudgetStatusResponse computeStatus(Budget budget, LocalDate today)` — **no**
    `@PreAuthorize` (internal; callers are already authorized — the cron job also uses it)

Business rules (spec §1/§2.2): tag resolved by name within the wallet
(`TagNotFoundException` if missing); CUSTOM requires `endDate >= startDate`, rollover
stored false; recurring budgets must be unique per (wallet, tag-or-null) → 409;
`startDate` null → `LocalDate.now()`; recurring must have `endDate == null` (clear it);
spent/rollover/percent/status math per spec (percent floored via `RoundingMode.DOWN`,
pinned to 100 with status EXCEEDED when `effectiveLimit <= 0`; status WARNING when a
threshold `< 100` is crossed; `spent` is always computed over the period bounds, and
`active` only gates alerts/UI).

- [x] **Step 1: Write the failing service test** (Mockito style, like `WalletServiceTest`;
  real `BudgetMapper(new ObjectMapper())`, mocked repositories)

```java
package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetConflictException;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.BudgetMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

  @Mock private BudgetRepository budgetRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private TagRepository tagRepository;
  @Mock private WalletRepository walletRepository;

  private BudgetService budgetService;

  private final UUID walletId = UUID.randomUUID();
  private final UUID userId = UUID.randomUUID();
  private Wallet wallet;
  private Tag food;
  private Tag restaurants;

  @BeforeEach
  void setUp() {
    budgetService =
        new BudgetService(
            budgetRepository,
            transactionRepository,
            tagRepository,
            walletRepository,
            new BudgetMapper(new ObjectMapper()));
    wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setName("W");
    wallet.setCurrency("EUR");
    food = Tag.builder().id(UUID.randomUUID()).name("Food").wallet(wallet).build();
    restaurants =
        Tag.builder().id(UUID.randomUUID()).name("Restaurants").wallet(wallet).parent(food).build();
  }

  private BudgetRequest.BudgetRequestBuilder validRequest() {
    return BudgetRequest.builder()
        .name("Food budget")
        .tagName("Food")
        .limitAmount(new BigDecimal("300.00"))
        .periodType(Budget.PeriodType.MONTHLY);
  }

  private Budget monthlyBudget(Tag tag, String limit, boolean rollover) {
    return Budget.builder()
        .id(UUID.randomUUID())
        .wallet(wallet)
        .tag(tag)
        .name("Food budget")
        .limitAmount(new BigDecimal(limit))
        .periodType(Budget.PeriodType.MONTHLY)
        .startDate(LocalDate.of(2026, 5, 1))
        .rollover(rollover)
        .alertThresholds("[80,100]")
        .build();
  }

  @Test
  void createBudget_persistsNormalizedEntity() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(budgetRepository.findAllByWalletId(walletId)).thenReturn(List.of());
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);

    BudgetStatusResponse response =
        budgetService.createBudget(
            validRequest().alertThresholds(List.of(100, 80, 80)).rollover(true).build(),
            walletId,
            userId);

    ArgumentCaptor<Budget> captor = ArgumentCaptor.forClass(Budget.class);
    verify(budgetRepository).save(captor.capture());
    Budget saved = captor.getValue();
    assertEquals("[80,100]", saved.getAlertThresholds()); // deduped + sorted
    assertEquals(LocalDate.now(), saved.getStartDate()); // defaulted
    assertTrue(saved.isRollover());
    assertNull(saved.getEndDate());
    assertEquals("Food", response.getTagName());
  }

  @Test
  void createBudget_customRequiresValidRange_andForcesRolloverOff() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            budgetService.createBudget(
                validRequest().periodType(Budget.PeriodType.CUSTOM).build(), walletId, userId));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            budgetService.createBudget(
                validRequest()
                    .periodType(Budget.PeriodType.CUSTOM)
                    .startDate(LocalDate.of(2026, 7, 10))
                    .endDate(LocalDate.of(2026, 7, 1))
                    .build(),
                walletId,
                userId));

    // Note: no findAllByWalletId stub here — the CUSTOM path skips the recurring-
    // uniqueness check entirely (strict stubbing would flag an unused stub).
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            any(), any(), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);
    budgetService.createBudget(
        validRequest()
            .periodType(Budget.PeriodType.CUSTOM)
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 8, 31))
            .rollover(true)
            .build(),
        walletId,
        userId);
    ArgumentCaptor<Budget> captor = ArgumentCaptor.forClass(Budget.class);
    verify(budgetRepository).save(captor.capture());
    assertFalse(captor.getValue().isRollover()); // spec: ignored for CUSTOM
  }

  @Test
  void createBudget_unknownTag_throwsTagNotFound() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Nope", walletId))
        .thenReturn(Optional.empty());
    assertThrows(
        TagNotFoundException.class,
        () ->
            budgetService.createBudget(validRequest().tagName("Nope").build(), walletId, userId));
  }

  @Test
  void createBudget_secondRecurringOnSameScope_conflicts() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(budgetRepository.findAllByWalletId(walletId))
        .thenReturn(List.of(monthlyBudget(food, "100.00", false)));

    assertThrows(
        BudgetConflictException.class,
        () -> budgetService.createBudget(validRequest().build(), walletId, userId));
  }

  @Test
  void createBudget_customDuplicatesAllowed() {
    // A recurring Food budget already exists in the wallet, yet the CUSTOM create
    // passes: the uniqueness rule only applies between recurring budgets (the CUSTOM
    // path never queries findAllByWalletId — don't stub it, strict stubbing).
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            any(), any(), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);

    // A CUSTOM budget on the same tag coexists with the recurring one.
    assertDoesNotThrow(
        () ->
            budgetService.createBudget(
                validRequest()
                    .periodType(Budget.PeriodType.CUSTOM)
                    .startDate(LocalDate.of(2026, 6, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build(),
                walletId,
                userId));
  }

  @Test
  void updateBudget_missing_throwsNotFound() {
    when(budgetRepository.findByIdAndWalletId(any(), eq(walletId))).thenReturn(Optional.empty());
    assertThrows(
        BudgetNotFoundException.class,
        () ->
            budgetService.updateBudget(UUID.randomUUID(), validRequest().build(), walletId, userId));
  }

  @Test
  void computeStatus_subtreeIdsIncludeChildren_andPercentFloors() {
    Budget budget = monthlyBudget(food, "300.00", false);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), anyCollection()))
        .thenReturn(new BigDecimal("250.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<java.util.Collection<UUID>> ids =
        ArgumentCaptor.forClass(java.util.Collection.class);
    verify(transactionRepository)
        .sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), ids.capture());
    assertTrue(ids.getValue().contains(restaurants.getId())); // child included

    assertEquals(83, status.getPercentUsed()); // 250/300 = 83.33 -> floored
    assertEquals("WARNING", status.getStatus());
    assertEquals(List.of(80), status.getCrossedThresholds());
    assertEquals(0, new BigDecimal("50.00").compareTo(status.getRemaining()));
  }

  @Test
  void computeStatus_wholeWalletBudget_usesUntaggedQuery() {
    Budget budget = monthlyBudget(null, "1000.00", false);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any()))
        .thenReturn(new BigDecimal("1200.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    assertEquals("EXCEEDED", status.getStatus());
    assertEquals(120, status.getPercentUsed());
    assertEquals(List.of(80, 100), status.getCrossedThresholds());
  }

  @Test
  void computeStatus_rolloverCarriesUnspentAndOverspend() {
    Budget budget = monthlyBudget(null, "100.00", true); // started 2026-05-01, today July
    // Current period (July) spent 50; previous periods (May+June) spent 140 of 200
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 7, 1)),
            eq(LocalDate.of(2026, 7, 31))))
        .thenReturn(new BigDecimal("50.00"));
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 5, 1)),
            eq(LocalDate.of(2026, 6, 30))))
        .thenReturn(new BigDecimal("140.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    // carry = 100*2 - 140 = 60 -> effectiveLimit 160, spent 50 -> 31%
    assertEquals(0, new BigDecimal("160.00").compareTo(status.getEffectiveLimit()));
    assertEquals(31, status.getPercentUsed());
    assertEquals("OK", status.getStatus());
  }

  @Test
  void computeStatus_negativeCarryEatsPeriod_pinsTo100() {
    Budget budget = monthlyBudget(null, "100.00", true);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 7, 1)),
            eq(LocalDate.of(2026, 7, 31))))
        .thenReturn(BigDecimal.ZERO);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 5, 1)),
            eq(LocalDate.of(2026, 6, 30))))
        .thenReturn(new BigDecimal("350.00")); // carry = 200-350 = -150 -> effectiveLimit -50

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    assertEquals(100, status.getPercentUsed());
    assertEquals("EXCEEDED", status.getStatus());
  }

  @Test
  void computeStatus_futureRecurringBudget_isInactive() {
    Budget budget = monthlyBudget(null, "100.00", false);
    budget.setStartDate(LocalDate.of(2026, 9, 1));
    when(transactionRepository.sumAmountByWalletAndDateRange(any(), any(), any(), any()))
        .thenReturn(BigDecimal.ZERO);
    assertFalse(budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8)).isActive());
  }
}
```

- [x] **Step 2: Run to verify it fails** — `./gradlew test --tests "*.BudgetServiceTest"` → compilation failure.

- [x] **Step 3: Implement the service** (and fix the `TagRepository` generic)

```java
package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetConflictException;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.BudgetMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BudgetService {

  private final BudgetRepository budgetRepository;
  private final TransactionRepository transactionRepository;
  private final TagRepository tagRepository;
  private final WalletRepository walletRepository;
  private final BudgetMapper budgetMapper;

  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
  public List<BudgetStatusResponse> getBudgets(UUID walletId, UUID userId) {
    LocalDate today = LocalDate.now();
    return budgetRepository.findAllByWalletId(walletId).stream()
        .map(b -> computeStatus(b, today))
        .sorted(Comparator.comparing(BudgetStatusResponse::getName, String.CASE_INSENSITIVE_ORDER))
        .toList();
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BudgetStatusResponse createBudget(BudgetRequest request, UUID walletId, UUID userId) {
    Budget budget = new Budget();
    applyRequest(budget, request, walletId);
    budget.setWallet(walletRepository.getReferenceById(walletId));
    budgetRepository.save(budget);
    return computeStatus(budget, LocalDate.now());
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BudgetStatusResponse updateBudget(
      UUID budgetId, BudgetRequest request, UUID walletId, UUID userId) {
    Budget budget =
        budgetRepository
            .findByIdAndWalletId(budgetId, walletId)
            .orElseThrow(() -> new BudgetNotFoundException(budgetId));
    applyRequest(budget, request, walletId);
    budgetRepository.save(budget);
    return computeStatus(budget, LocalDate.now());
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public void deleteBudget(UUID budgetId, UUID walletId, UUID userId) {
    Budget budget =
        budgetRepository
            .findByIdAndWalletId(budgetId, walletId)
            .orElseThrow(() -> new BudgetNotFoundException(budgetId));
    budgetRepository.delete(budget);
  }

  /** Validates the request and copies it onto the entity (shared by create/update). */
  private void applyRequest(Budget budget, BudgetRequest request, UUID walletId) {
    Tag tag = null;
    if (request.getTagName() != null && !request.getTagName().isBlank()) {
      tag =
          tagRepository
              .findByNameIgnoreCaseAndWalletId(request.getTagName(), walletId)
              .orElseThrow(() -> new TagNotFoundException(request.getTagName(), walletId));
    }

    LocalDate startDate =
        request.getStartDate() != null ? request.getStartDate() : LocalDate.now();

    if (request.getPeriodType() == Budget.PeriodType.CUSTOM) {
      if (request.getEndDate() == null)
        throw new IllegalArgumentException("A custom budget requires an end date.");
      if (request.getEndDate().isBefore(startDate))
        throw new IllegalArgumentException("The end date must not be before the start date.");
      budget.setEndDate(request.getEndDate());
      budget.setRollover(false); // spec: rollover does not apply to custom budgets
    } else {
      requireNoOtherRecurring(budget, tag, walletId, request.getPeriodType());
      budget.setEndDate(null);
      budget.setRollover(Boolean.TRUE.equals(request.getRollover()));
    }

    budget.setTag(tag);
    budget.setName(request.getName());
    budget.setLimitAmount(request.getLimitAmount());
    budget.setPeriodType(request.getPeriodType());
    budget.setStartDate(startDate);
    budget.setAlertThresholds(budgetMapper.thresholdsToJson(request.getAlertThresholds()));
  }

  /** Spec: at most one recurring budget per (wallet, tag-or-null) scope. */
  private void requireNoOtherRecurring(
      Budget budget, Tag tag, UUID walletId, Budget.PeriodType periodType) {
    UUID tagId = tag != null ? tag.getId() : null;
    boolean conflict =
        budgetRepository.findAllByWalletId(walletId).stream()
            .filter(other -> !Objects.equals(other.getId(), budget.getId()))
            .filter(other -> other.getPeriodType() != Budget.PeriodType.CUSTOM)
            .anyMatch(
                other ->
                    Objects.equals(
                        other.getTag() != null ? other.getTag().getId() : null, tagId));
    if (conflict)
      throw new BudgetConflictException(
          "A recurring budget already exists for this "
              + (tagId == null ? "wallet" : "tag")
              + ".");
  }

  /**
   * Computes the live status of a budget for the period containing {@code today}. No
   * authorization of its own: the API entry points above are gated, and the alerts cron
   * job runs as the system.
   */
  public BudgetStatusResponse computeStatus(Budget budget, LocalDate today) {
    boolean active = BudgetPeriods.isActive(budget, today);
    BudgetPeriods.Period period = BudgetPeriods.currentPeriod(budget, today);
    List<Integer> thresholds = budgetMapper.thresholdsFromJson(budget.getAlertThresholds());

    BigDecimal spent = sumExpenses(budget, period.start(), period.end());

    BigDecimal effectiveLimit = budget.getLimitAmount();
    if (active && budget.isRollover() && period.elapsedPeriods() > 1) {
      BigDecimal spentBefore =
          sumExpenses(budget, BudgetPeriods.firstPeriodStart(budget), period.start().minusDays(1));
      BigDecimal carry =
          budget
              .getLimitAmount()
              .multiply(BigDecimal.valueOf(period.elapsedPeriods() - 1))
              .subtract(spentBefore);
      effectiveLimit = budget.getLimitAmount().add(carry);
    }

    int percentUsed;
    if (effectiveLimit.compareTo(BigDecimal.ZERO) > 0) {
      percentUsed =
          spent
              .multiply(BigDecimal.valueOf(100))
              .divide(effectiveLimit, 0, RoundingMode.DOWN)
              .intValue();
    } else {
      percentUsed = 100; // a negative rollover carry ate the whole period
    }

    List<Integer> crossed = thresholds.stream().filter(t -> percentUsed >= t).toList();
    String status =
        percentUsed >= 100
            ? "EXCEEDED"
            : crossed.stream().anyMatch(t -> t < 100) ? "WARNING" : "OK";

    return budgetMapper
        .baseResponse(budget)
        .periodStart(period.start())
        .periodEnd(period.end())
        .spent(spent)
        .effectiveLimit(effectiveLimit)
        .remaining(effectiveLimit.subtract(spent))
        .percentUsed(percentUsed)
        .status(status)
        .crossedThresholds(crossed)
        .active(active)
        .build();
  }

  private BigDecimal sumExpenses(Budget budget, LocalDate from, LocalDate to) {
    UUID walletId = budget.getWallet().getId();
    if (budget.getTag() == null) {
      return transactionRepository.sumAmountByWalletAndDateRange(
          walletId, Transaction.Type.EXPENSE, from, to);
    }
    return transactionRepository.sumAmountByWalletAndDateRangeAndTags(
        walletId, Transaction.Type.EXPENSE, from, to, subtreeTagIds(budget.getTag(), walletId));
  }

  /** The tag's id plus every descendant's, resolved from the wallet's (small) tag list. */
  private List<UUID> subtreeTagIds(Tag root, UUID walletId) {
    Map<UUID, List<Tag>> childrenByParent = new HashMap<>();
    for (Tag t : tagRepository.getTagsByWalletId(walletId)) {
      if (t.getParent() != null) {
        childrenByParent.computeIfAbsent(t.getParent().getId(), k -> new ArrayList<>()).add(t);
      }
    }
    List<UUID> ids = new ArrayList<>();
    Deque<Tag> queue = new ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
      Tag current = queue.poll();
      ids.add(current.getId());
      queue.addAll(childrenByParent.getOrDefault(current.getId(), List.of()));
    }
    return ids;
  }
}
```

Also change in `TagRepository.java`: `extends JpaRepository<Tag, Long>` →
`extends JpaRepository<Tag, UUID>` (the entity id is `UUID`; run the grep from the
Files list first to confirm no `Long`-keyed usage exists).

- [x] **Step 4: Run to verify it passes** — `./gradlew test --tests "*.BudgetServiceTest"` → PASS (11 tests). Then run the **full** suite: `./gradlew test` (the TagRepository generic fix must not break anything).

- [x] **Step 5: Format + commit**

```bash
./gradlew spotlessApply
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/service/BudgetService.java \
        backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/TagRepository.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/service/BudgetServiceTest.java
git commit -m "feat(budget): BudgetService — CRUD, validation, on-read status computation"
```

---

### Task 5: `BudgetController` + integration test (RBAC included)

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/BudgetController.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/integration/BudgetIntegrationTest.java`

**Interfaces (Produces — the frontend consumes exactly these):**
- `GET /api/budgets/{walletId}` → 200 `List<BudgetStatusResponse>` (read access)
- `POST /api/budgets/{walletId}` + `BudgetRequest` → 200 `BudgetStatusResponse` (write access)
- `PUT /api/budgets/{walletId}/{budgetId}` + `BudgetRequest` → 200 (write access)
- `DELETE /api/budgets/{walletId}/{budgetId}` → 204 (write access)

- [x] **Step 1: Write the failing integration test** (mirror `BulkImportIntegrationTest`
  setup: entities via repositories, JWT via `JwtService`, requests via `MockMvc`;
  **all dates relative to `LocalDate.now()`** so the month-based asserts never go stale)

```java
package dev.busato.FinanceWebApp.backend.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** End-to-end budget CRUD + computed status + per-wallet RBAC on the real (H2) stack. */
public class BudgetIntegrationTest extends BaseIntegrationTest {

  @Autowired private JwtService jwtService;
  @Autowired private UserRepository userRepository;
  @Autowired private WalletRepository walletRepository;
  @Autowired private WalletAccessRepository walletAccessRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;

  private Wallet wallet;
  private Tag food;
  private String editorJwt;
  private String viewerJwt;
  private final LocalDate today = LocalDate.now();

  @BeforeEach
  void setUp() {
    User editor = user("budget-editor@example.com");
    User viewer = user("budget-viewer@example.com");

    wallet = new Wallet();
    wallet.setName("Budget Wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    access(editor, WalletAccess.WalletRole.EDITOR);
    access(viewer, WalletAccess.WalletRole.VIEWER);

    food = tagRepository.save(Tag.builder().name("Food").wallet(wallet).build());
    Tag restaurants =
        tagRepository.save(Tag.builder().name("Restaurants").wallet(wallet).parent(food).build());

    // 50 (Food) + 30 (Restaurants child) this period; income and old rows must not count.
    tx("Groceries", "50.00", Transaction.Type.EXPENSE, food, today);
    tx("Dinner", "30.00", Transaction.Type.EXPENSE, restaurants, today);
    tx("Salary", "2000.00", Transaction.Type.INCOME, null, today);
    tx("Old", "99.00", Transaction.Type.EXPENSE, food, today.minusMonths(2));

    editorJwt = jwtService.generateToken(new HashMap<>(), editor);
    viewerJwt = jwtService.generateToken(new HashMap<>(), viewer);
  }

  private User user(String email) {
    User u = new User();
    u.setUsername(email);
    u.setEmail(email);
    u.setPassword("password");
    u.setRole(User.Role.USER);
    u.setTokenVersion(1);
    return userRepository.save(u);
  }

  private void access(User user, WalletAccess.WalletRole role) {
    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(user.getId(), wallet.getId()));
    a.setRole(role);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(user);
    a.setWallet(wallet);
    walletAccessRepository.save(a);
  }

  private void tx(String name, String amount, Transaction.Type type, Tag tag, LocalDate date) {
    transactionRepository.save(
        Transaction.builder()
            .wallet(wallet)
            .name(name)
            .amount(new BigDecimal(amount))
            .originalAmount(new BigDecimal(amount))
            .type(type)
            .tag(tag)
            .transactionDate(date)
            .build());
  }

  private BudgetRequest monthlyFoodBudget() {
    return BudgetRequest.builder()
        .name("Food budget")
        .tagName("Food")
        .limitAmount(new BigDecimal("100.00"))
        .periodType(Budget.PeriodType.MONTHLY)
        .startDate(today.withDayOfMonth(1))
        .build();
  }

  @Test
  void createAndList_computesSubtreeSpentAndStatus() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.spent").value(80.0)) // 50 + 30 (child tag), not 99 (old month)
        .andExpect(jsonPath("$.percentUsed").value(80))
        .andExpect(jsonPath("$.status").value("WARNING"))
        .andExpect(jsonPath("$.crossedThresholds[0]").value(80))
        .andExpect(jsonPath("$.active").value(true));

    mockMvc
        .perform(get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + viewerJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].name").value("Food budget"))
        .andExpect(jsonPath("$[0].tagName").value("Food"))
        .andExpect(jsonPath("$[0].alertThresholds[0]").value(80));
  }

  @Test
  void viewer_cannotWrite() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + viewerJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isForbidden());
  }

  @Test
  void nonMember_getsNotFound() throws Exception {
    User outsider = user("outsider@example.com");
    String outsiderJwt = jwtService.generateToken(new HashMap<>(), outsider);
    mockMvc
        .perform(
            get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + outsiderJwt))
        .andExpect(status().isNotFound());
  }

  @Test
  void duplicateRecurring_conflicts_customMissingEndDate_isBadRequest() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isConflict());

    BudgetRequest custom = monthlyFoodBudget();
    custom.setPeriodType(Budget.PeriodType.CUSTOM);
    custom.setEndDate(null);
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(custom)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void updateAndDelete_roundTrip() throws Exception {
    String body =
        mockMvc
            .perform(
                post("/api/budgets/" + wallet.getId())
                    .header("Authorization", "Bearer " + editorJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = objectMapper.readTree(body).get("id").asText();

    BudgetRequest update = monthlyFoodBudget();
    update.setLimitAmount(new BigDecimal("500.00"));
    mockMvc
        .perform(
            put("/api/budgets/" + wallet.getId() + "/" + id)
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.percentUsed").value(16)) // 80/500 floored
        .andExpect(jsonPath("$.status").value("OK"));

    mockMvc
        .perform(
            delete("/api/budgets/" + wallet.getId() + "/" + id)
                .header("Authorization", "Bearer " + editorJwt))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + editorJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }
}
```

- [x] **Step 2: Run to verify it fails** — `./gradlew test --tests "*.BudgetIntegrationTest"` → 404s (no controller).

- [x] **Step 3: Implement the controller** (mirror `TagController`)

```java
package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

  private final BudgetService budgetService;

  @GetMapping("/{walletId}")
  public ResponseEntity<List<BudgetStatusResponse>> getBudgets(
      @PathVariable UUID walletId, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(budgetService.getBudgets(walletId, user.getId()));
  }

  @PostMapping("/{walletId}")
  public ResponseEntity<BudgetStatusResponse> createBudget(
      @PathVariable UUID walletId,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody BudgetRequest budgetRequest) {
    return ResponseEntity.ok(budgetService.createBudget(budgetRequest, walletId, user.getId()));
  }

  @PutMapping("/{walletId}/{budgetId}")
  public ResponseEntity<BudgetStatusResponse> updateBudget(
      @PathVariable UUID walletId,
      @PathVariable UUID budgetId,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody BudgetRequest budgetRequest) {
    return ResponseEntity.ok(
        budgetService.updateBudget(budgetId, budgetRequest, walletId, user.getId()));
  }

  @DeleteMapping("/{walletId}/{budgetId}")
  public ResponseEntity<Void> deleteBudget(
      @PathVariable UUID walletId,
      @PathVariable UUID budgetId,
      @AuthenticationPrincipal User user) {
    budgetService.deleteBudget(budgetId, walletId, user.getId());
    return ResponseEntity.noContent().build();
  }
}
```

If `SecurityConfig` whitelists paths explicitly, confirm `/api/budgets/**` falls under
the authenticated group like `/api/tags/**` (it should by default — only adjust if the
integration test comes back 401 for valid JWTs).

- [x] **Step 4: Run to verify it passes** — `./gradlew test --tests "*.BudgetIntegrationTest"` → PASS (5 tests).

- [x] **Step 5: Format + full suite + commit**

```bash
./gradlew spotlessApply test
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/BudgetController.java \
        backend/src/test/java/dev/busato/FinanceWebApp/backend/integration/BudgetIntegrationTest.java
git commit -m "feat(budget): REST endpoints under /api/budgets with per-wallet RBAC"
```

---

### Task 6: Alerts — `BudgetAlertLog`, email, `budget-alerts` cron job

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/BudgetAlertLog.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/BudgetAlertLogRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/CronJob/BudgetAlertCronJob.java`
- Create: `backend/src/main/resources/templates/email/budgetAlertEmail.html`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SendEmailService.java` (add `sendBudgetAlert`)
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/BudgetService.java`
  (`deleteBudget` must first `budgetAlertLogRepository.deleteAllByBudgetId(budgetId)` —
  the FK would otherwise block deletion; add the repository as a new constructor field
  and update `BudgetServiceTest`'s constructor call with the extra mock)
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/CronJob/BudgetAlertCronJobTest.java`

**Interfaces:**
- Consumes: `BudgetService.computeStatus`, `BudgetPeriods.currentPeriod(...).key()`,
  `BudgetRepository.findAllWithWalletAndTag()`, `WalletAccessRepository.findAllByWalletId`.
- Produces: `ManagedJob` bean with `key() = "budget-alerts"`, default `HOURLY`
  (`new ScheduleDefaults(JobFrequency.HOURLY, 0, 0, null)`) — auto-discovered by
  `ScheduledJobService`, visible in the admin System tab.
  `BudgetAlertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(UUID, String, int)`,
  `deleteAllByBudgetId(UUID)`.
  `SendEmailService.sendBudgetAlert(Wallet wallet, BudgetStatusResponse status, int threshold, List<String> recipients)`.

- [x] **Step 1: Write the failing cron-job test** (Mockito; `BudgetService` mocked so the
  test crafts statuses directly)

```java
package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetAlertCronJobTest {

  @Mock private BudgetRepository budgetRepository;
  @Mock private BudgetAlertLogRepository alertLogRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private BudgetService budgetService;
  @Mock private SendEmailService sendEmailService;

  private BudgetAlertCronJob job;
  private Budget budget;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    job =
        new BudgetAlertCronJob(
            budgetRepository,
            alertLogRepository,
            walletAccessRepository,
            budgetService,
            sendEmailService);
    wallet = new Wallet();
    wallet.setId(UUID.randomUUID());
    wallet.setName("W");
    wallet.setCurrency("EUR");
    budget =
        Budget.builder()
            .id(UUID.randomUUID())
            .wallet(wallet)
            .name("Food budget")
            .limitAmount(new BigDecimal("100.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.now().withDayOfMonth(1))
            .alertThresholds("[80,100]")
            .build();
  }

  private BudgetStatusResponse status(List<Integer> crossed, boolean active) {
    return BudgetStatusResponse.builder()
        .id(budget.getId())
        .name(budget.getName())
        .spent(new BigDecimal("85.00"))
        .effectiveLimit(new BigDecimal("100.00"))
        .percentUsed(85)
        .status("WARNING")
        .crossedThresholds(crossed)
        .active(active)
        .periodStart(LocalDate.now().withDayOfMonth(1))
        .periodEnd(LocalDate.now().withDayOfMonth(28))
        .alertThresholds(List.of(80, 100))
        .build();
  }

  private void memberWithEmail(String email, WalletAccess.InvitationStatus status) {
    User u = new User();
    u.setEmail(email);
    u.setUsername(email);
    WalletAccess a = new WalletAccess();
    a.setUser(u);
    a.setWallet(wallet);
    a.setStatus(status);
    a.setRole(WalletAccess.WalletRole.EDITOR);
    when(walletAccessRepository.findAllByWalletId(wallet.getId()))
        .thenReturn(List.of(a));
  }

  @Test
  void crossedThreshold_sendsOnceAndLogs() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(80)))
        .thenReturn(false);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);

    String result = job.run();

    verify(sendEmailService)
        .sendBudgetAlert(eq(wallet), any(), eq(80), eq(List.of("owner@example.com")));
    verify(alertLogRepository).save(any(BudgetAlertLog.class));
    assertTrue(result.startsWith("1 budget alert(s) sent"));
  }

  @Test
  void alreadyLogged_isIdempotent() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(80)))
        .thenReturn(true);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);

    job.run();

    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
    verify(alertLogRepository, never()).save(any());
  }

  @Test
  void inactiveOrUncrossed_skipped() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(), true));

    job.run();
    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
  }

  @Test
  void pendingMembers_getNoEmail() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    memberWithEmail("pending@example.com", WalletAccess.InvitationStatus.PENDING);

    job.run();
    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
  }

  @Test
  void emailFailure_doesNotLog_andDoesNotBlockOtherBudgets() throws Exception {
    Budget second =
        Budget.builder()
            .id(UUID.randomUUID())
            .wallet(wallet)
            .name("Other budget")
            .limitAmount(new BigDecimal("100.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.now().withDayOfMonth(1))
            .alertThresholds("[80,100]")
            .build();
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget, second));
    when(budgetService.computeStatus(any(), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(any(), anyString(), eq(80)))
        .thenReturn(false);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);
    doThrow(new RuntimeException("smtp down"))
        .doNothing()
        .when(sendEmailService)
        .sendBudgetAlert(any(), any(), anyInt(), anyList());

    String result = job.run();

    // First budget failed (nothing logged for it), second one still went out.
    verify(alertLogRepository, times(1)).save(any(BudgetAlertLog.class));
    assertTrue(result.contains("1 budget alert(s) sent"));
    assertTrue(result.contains("1 budget(s) failed"));
  }
}
```

- [x] **Step 2: Run to verify it fails** — `./gradlew test --tests "*.BudgetAlertCronJobTest"` → compilation failure.

- [x] **Step 3: Implement entity, repository, email, job**

`model/BudgetAlertLog.java`:

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

/** Remembers which (budget, period, threshold) alert emails were already sent, so the
 * cron job never re-alerts within the same period. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "budget_alert_logs",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_budget_alert",
          columnNames = {"budget_id", "period_key", "threshold"})
    })
public class BudgetAlertLog {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "budget_id", nullable = false)
  private Budget budget;

  // "2026-07" (monthly) / "2026-W28" (weekly) / "2026" (yearly) / "custom".
  @Column(name = "period_key", nullable = false)
  private String periodKey;

  @Column(nullable = false)
  private int threshold;

  @Column(nullable = false)
  private Instant sentAt;
}
```

`repository/BudgetAlertLogRepository.java`:

```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetAlertLogRepository extends JpaRepository<BudgetAlertLog, UUID> {
  boolean existsByBudgetIdAndPeriodKeyAndThreshold(UUID budgetId, String periodKey, int threshold);

  void deleteAllByBudgetId(UUID budgetId);
}
```

Add to `SendEmailService` (reuse its existing `getHtmlTemplate` helper and
`MimeMessageHelper` pattern — see `sendWalletInvitation`; no inline image needed here):

```java
  public void sendBudgetAlert(
      Wallet wallet, BudgetStatusResponse status, int threshold, List<String> recipients)
      throws Exception {
    String html =
        getHtmlTemplate("templates/email/budgetAlertEmail.html")
            .replace("{{walletName}}", wallet.getName())
            .replace("{{budgetName}}", status.getName())
            .replace("{{threshold}}", String.valueOf(threshold))
            .replace("{{spent}}", status.getSpent().toPlainString())
            .replace("{{limit}}", status.getEffectiveLimit().toPlainString())
            .replace("{{currency}}", wallet.getCurrency())
            .replace("{{periodStart}}", status.getPeriodStart().toString())
            .replace("{{periodEnd}}", status.getPeriodEnd().toString());

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(recipients.toArray(String[]::new));
    helper.setSubject(
        "Budget \"" + status.getName() + "\" reached " + threshold + "% in " + wallet.getName());
    helper.setText(html, true);
    mailSender.send(message);
  }
```

`resources/templates/email/budgetAlertEmail.html` (match the visual language of the
existing templates in the same folder — dark card, brand accent; keep it table-based
and inline-styled for email clients):

```html
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#111113;font-family:Arial,Helvetica,sans-serif;color:#e7e7ea;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#1b1b1f;border-radius:12px;padding:32px;">
      <tr>
        <td>
          <h2 style="margin:0 0 8px;color:#ffffff;">Budget alert: {{budgetName}}</h2>
          <p style="margin:0 0 24px;color:#a1a1aa;">
            Your budget in <strong style="color:#e7e7ea;">{{walletName}}</strong> has reached
            <strong style="color:#f87171;">{{threshold}}%</strong> of its limit.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#26262b;border-radius:8px;padding:16px;">
            <tr>
              <td style="padding:8px 16px;color:#a1a1aa;">Spent</td>
              <td style="padding:8px 16px;text-align:right;color:#ffffff;font-weight:bold;">{{spent}} {{currency}}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;color:#a1a1aa;">Limit</td>
              <td style="padding:8px 16px;text-align:right;color:#ffffff;font-weight:bold;">{{limit}} {{currency}}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;color:#a1a1aa;">Period</td>
              <td style="padding:8px 16px;text-align:right;color:#ffffff;">{{periodStart}} → {{periodEnd}}</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#71717a;">
            You receive this because you are a member of this wallet. Alert thresholds can be
            changed on the wallet's Budget tab.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

`CronJob/BudgetAlertCronJob.java`:

```java
package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import dev.busato.FinanceWebApp.backend.service.BudgetPeriods;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Emails wallet members when a budget crosses one of its alert thresholds. One email
 * per (budget, period, threshold), deduplicated via {@link BudgetAlertLog}. Default
 * schedule: hourly (editable in the admin System tab). */
@Component
@RequiredArgsConstructor
public class BudgetAlertCronJob implements ManagedJob {

  private final BudgetRepository budgetRepository;
  private final BudgetAlertLogRepository alertLogRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final BudgetService budgetService;
  private final SendEmailService sendEmailService;

  @Override
  public String key() {
    return "budget-alerts";
  }

  @Override
  public String displayName() {
    return "Budget Alerts";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.HOURLY, 0, 0, null);
  }

  @Override
  public String run() {
    LocalDate today = LocalDate.now();
    int sent = 0;
    int failed = 0;
    for (Budget budget : budgetRepository.findAllWithWalletAndTag()) {
      try {
        sent += processBudget(budget, today);
      } catch (Exception e) {
        failed++; // one broken budget/wallet must not block the rest
      }
    }
    return sent + " budget alert(s) sent" + (failed > 0 ? ", " + failed + " budget(s) failed" : "");
  }

  private int processBudget(Budget budget, LocalDate today) throws Exception {
    BudgetStatusResponse status = budgetService.computeStatus(budget, today);
    if (!status.isActive() || status.getCrossedThresholds().isEmpty()) return 0;

    List<String> recipients = acceptedMemberEmails(budget.getWallet().getId());
    if (recipients.isEmpty()) return 0;

    String periodKey = BudgetPeriods.currentPeriod(budget, today).key();
    int sent = 0;
    for (int threshold : status.getCrossedThresholds()) {
      if (alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
          budget.getId(), periodKey, threshold)) continue;
      sendEmailService.sendBudgetAlert(budget.getWallet(), status, threshold, recipients);
      alertLogRepository.save(
          BudgetAlertLog.builder()
              .budget(budget)
              .periodKey(periodKey)
              .threshold(threshold)
              .sentAt(Instant.now())
              .build());
      sent++;
    }
    return sent;
  }

  private List<String> acceptedMemberEmails(UUID walletId) {
    return walletAccessRepository.findAllByWalletId(walletId).stream()
        .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
        .map(a -> a.getUser().getEmail())
        .toList();
  }
}
```

In `BudgetService`: add `private final BudgetAlertLogRepository budgetAlertLogRepository;`
and make `deleteBudget` call `budgetAlertLogRepository.deleteAllByBudgetId(budgetId);`
before `budgetRepository.delete(budget);`. Update `BudgetServiceTest`'s constructor
call with the extra mock and add one assertion to the delete path:

```java
  @Test
  void deleteBudget_purgesAlertLogsFirst() {
    Budget budget = monthlyBudget(null, "100.00", false);
    when(budgetRepository.findByIdAndWalletId(budget.getId(), walletId))
        .thenReturn(Optional.of(budget));

    budgetService.deleteBudget(budget.getId(), walletId, userId);

    var order = inOrder(budgetAlertLogRepository, budgetRepository);
    order.verify(budgetAlertLogRepository).deleteAllByBudgetId(budget.getId());
    order.verify(budgetRepository).delete(budget);
  }
```

- [x] **Step 4: Run to verify it passes** — `./gradlew test --tests "*.BudgetAlertCronJobTest" --tests "*.BudgetServiceTest"` → PASS.

- [x] **Step 5: Backend wrap-up — full gate + commit**

```bash
./gradlew spotlessApply check   # Spotless + tests + 90% coverage gate
git add backend/src/main backend/src/test
git commit -m "feat(budget): threshold alert emails via budget-alerts managed job"
```

If `check` fails on coverage, add the missing service-branch tests (the validation
branches in `applyRequest` are the usual culprits) before committing.

---

## Phase B — Frontend

### Task 7: Types + pure `budgetLogic` module

**Files:**
- Modify: `frontend/src/utils/types.ts`
- Create: `frontend/src/dashboard/budget/budgetLogic.ts`
- Test: `frontend/src/__tests__/dashboard/budget/budgetLogic.test.ts`

**Interfaces (Produces):**
- `Budget` type = `BudgetStatusResponse` shape (see Task 5); `BudgetPayload` = request body.
- `STATUS_META`, `periodLabel(budget)`, `barPercent(budget)`, `validateThresholds(numbers)`.

- [x] **Step 1: Add the types** to `frontend/src/utils/types.ts`:

```ts
export interface Budget {
  id: string;
  name: string;
  tagName?: string | null; // null = whole-wallet budget
  limitAmount: number;
  periodType: "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  startDate: string;
  endDate?: string | null;
  rollover: boolean;
  alertThresholds: number[];
  // Computed by the backend for the current period
  periodStart: string;
  periodEnd: string;
  spent: number;
  effectiveLimit: number;
  remaining: number;
  percentUsed: number;
  status: "OK" | "WARNING" | "EXCEEDED";
  crossedThresholds: number[];
  active: boolean;
}

export interface BudgetPayload {
  name: string;
  tagName?: string | null;
  limitAmount: number;
  periodType: Budget["periodType"];
  startDate?: string;
  endDate?: string | null;
  rollover?: boolean;
  alertThresholds?: number[];
}
```

- [x] **Step 2: Write the failing Vitest test**

```ts
import { describe, expect, it } from "vitest";
import {
  STATUS_META,
  barPercent,
  periodLabel,
  validateThresholds,
} from "../../../dashboard/budget/budgetLogic";
import type { Budget } from "../../../utils/types";

const base: Budget = {
  id: "b1",
  name: "Food budget",
  tagName: "Food",
  limitAmount: 300,
  periodType: "MONTHLY",
  startDate: "2026-07-01",
  endDate: null,
  rollover: false,
  alertThresholds: [80, 100],
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  spent: 150,
  effectiveLimit: 300,
  remaining: 150,
  percentUsed: 50,
  status: "OK",
  crossedThresholds: [],
  active: true,
};

describe("periodLabel", () => {
  it("labels recurring periods", () => {
    expect(periodLabel(base)).toBe("Monthly");
    expect(periodLabel({ ...base, periodType: "WEEKLY" })).toBe("Weekly");
    expect(periodLabel({ ...base, periodType: "YEARLY" })).toBe("Yearly");
  });

  it("renders the custom range with both dates", () => {
    const label = periodLabel({
      ...base,
      periodType: "CUSTOM",
      startDate: "2026-06-01",
      endDate: "2026-08-31",
    });
    expect(label).toContain("2026");
    expect(label).toContain("–");
  });
});

describe("barPercent", () => {
  it("passes through in-range values and clamps overflow", () => {
    expect(barPercent(base)).toBe(50);
    expect(barPercent({ ...base, percentUsed: 130 })).toBe(100);
    expect(barPercent({ ...base, percentUsed: -5 })).toBe(0);
  });
});

describe("validateThresholds", () => {
  it("accepts a valid set and the empty set", () => {
    expect(validateThresholds([80, 100])).toBeNull();
    expect(validateThresholds([])).toBeNull();
  });
  it("rejects out-of-range, duplicates and more than 5", () => {
    expect(validateThresholds([0])).not.toBeNull();
    expect(validateThresholds([201])).not.toBeNull();
    expect(validateThresholds([50, 50])).not.toBeNull();
    expect(validateThresholds([10, 20, 30, 40, 50, 60])).not.toBeNull();
  });
});

describe("STATUS_META", () => {
  it("uses the soft-tint palette", () => {
    expect(STATUS_META.OK.color).toBe("#34d399");
    expect(STATUS_META.WARNING.color).toBe("#fbbf24");
    expect(STATUS_META.EXCEEDED.color).toBe("#f87171");
  });
});
```

- [x] **Step 3: Run to verify it fails** — from `frontend/`: `npm test` → fails (module not found).

- [x] **Step 4: Implement `budgetLogic.ts`**

```ts
import type { Budget } from "../../utils/types";

/** Soft 400-tint status palette (house chart-colour rule: no saturated 500s). */
export const STATUS_META: Record<
  Budget["status"],
  { color: string; label: string }
> = {
  OK: { color: "#34d399", label: "On track" },
  WARNING: { color: "#fbbf24", label: "Near limit" },
  EXCEEDED: { color: "#f87171", label: "Over budget" },
};

export function periodLabel(budget: Budget): string {
  switch (budget.periodType) {
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "YEARLY":
      return "Yearly";
    case "CUSTOM": {
      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      return `${fmt(budget.startDate)} – ${fmt(budget.endDate ?? budget.startDate)}`;
    }
  }
}

/** Progress-bar width: percentUsed clamped to [0, 100]. */
export function barPercent(budget: Budget): number {
  return Math.max(0, Math.min(budget.percentUsed, 100));
}

/** Mirror of the backend rules. Returns an error message, or null when valid. */
export function validateThresholds(thresholds: number[]): string | null {
  if (thresholds.length > 5) return "At most 5 thresholds.";
  if (thresholds.some((t) => !Number.isInteger(t) || t < 1 || t > 200))
    return "Thresholds must be whole numbers between 1 and 200.";
  if (new Set(thresholds).size !== thresholds.length)
    return "Thresholds must be unique.";
  return null;
}
```

- [x] **Step 5: Verify + commit**

```bash
npm run lint && npm test && npm run build
git add frontend/src/utils/types.ts frontend/src/dashboard/budget/budgetLogic.ts \
        frontend/src/__tests__/dashboard/budget/budgetLogic.test.ts
git commit -m "feat(budget): Budget types and pure budget logic module"
```

---

### Task 8: `useBudgets` hook

**Files:**
- Create: `frontend/src/dashboard/budget/useBudgets.ts`
- Test: `frontend/src/__tests__/dashboard/budget/useBudgets.test.ts`

**Interfaces (Produces):**
- `useBudgets(walletId: string)` → `{ budgets: Budget[]; isLoading: boolean; refresh(): Promise<void>; createBudget(p: BudgetPayload): Promise<boolean>; updateBudget(id: string, p: BudgetPayload): Promise<boolean>; deleteBudget(id: string): Promise<boolean>; }`
- Mutations toast success/failure (`triggerToast` + `getApiErrorTitle`) and `refresh()` on success — same UX contract as the tag handlers in `WalletProvider`.

- [x] **Step 1: Write the failing hook test** (mock the axios module; `renderHook` +
  `waitFor` from `@testing-library/react`)

```ts
import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock("../../../components/ui/ToastNotification", () => ({
  triggerToast: vi.fn(),
}));

import api from "../../../api/axiosConfig";
import { useBudgets } from "../../../dashboard/budget/useBudgets";

const mocked = vi.mocked(api);

describe("useBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.get.mockResolvedValue({ data: [{ id: "b1", name: "Food budget" }] });
  });

  it("fetches budgets on mount", async () => {
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mocked.get).toHaveBeenCalledWith("/budgets/w1");
    expect(result.current.budgets).toHaveLength(1);
  });

  it("createBudget posts then refreshes", async () => {
    mocked.post.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = false;
    await act(async () => {
      ok = await result.current.createBudget({
        name: "Food budget",
        limitAmount: 300,
        periodType: "MONTHLY",
      });
    });
    expect(ok).toBe(true);
    expect(mocked.post).toHaveBeenCalledWith("/budgets/w1", expect.any(Object));
    expect(mocked.get).toHaveBeenCalledTimes(2); // mount + refresh
  });

  it("deleteBudget failure returns false and does not refresh", async () => {
    mocked.delete.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useBudgets("w1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let ok = true;
    await act(async () => {
      ok = await result.current.deleteBudget("b1");
    });
    expect(ok).toBe(false);
    expect(mocked.get).toHaveBeenCalledTimes(1);
  });
});
```

- [x] **Step 2: Run to verify it fails** — `npm test` → module not found.

- [x] **Step 3: Implement the hook**

```ts
import { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorTitle } from "../../utils/apiError";
import type { Budget, BudgetPayload } from "../../utils/types";

/**
 * Budget list + CRUD for one wallet. Colocated with the Budget tab (the only
 * consumer): the tab remounts on every visit, so each visit re-fetches the
 * server-computed status.
 */
export function useBudgets(walletId: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/budgets/${walletId}`);
      setBudgets(res.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error loading budgets"), false);
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createBudget = async (payload: BudgetPayload): Promise<boolean> => {
    try {
      await api.post(`/budgets/${walletId}`, payload);
      triggerToast("Budget created!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error creating budget"), false);
      return false;
    }
  };

  const updateBudget = async (
    budgetId: string,
    payload: BudgetPayload,
  ): Promise<boolean> => {
    try {
      await api.put(`/budgets/${walletId}/${budgetId}`, payload);
      triggerToast("Budget updated!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error updating budget"), false);
      return false;
    }
  };

  const deleteBudget = async (budgetId: string): Promise<boolean> => {
    try {
      await api.delete(`/budgets/${walletId}/${budgetId}`);
      triggerToast("Budget deleted!", true);
      await refresh();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting budget"), false);
      return false;
    }
  };

  return { budgets, isLoading, refresh, createBudget, updateBudget, deleteBudget };
}
```

- [x] **Step 4: Run to verify it passes** — `npm test` → PASS.

- [x] **Step 5: Verify + commit**

```bash
npm run lint && npm test && npm run build
git add frontend/src/dashboard/budget/useBudgets.ts \
        frontend/src/__tests__/dashboard/budget/useBudgets.test.ts
git commit -m "feat(budget): useBudgets hook (fetch + CRUD with toasts)"
```

---

### Task 9: Budget tab — `BudgetTab`, `BudgetCard`, tab wiring

**Files:**
- Create: `frontend/src/dashboard/budget/BudgetTab.tsx`
- Create: `frontend/src/dashboard/budget/BudgetCard.tsx`
- Modify: `frontend/src/dashboard/wallet/WalletTabs.tsx` (add the tab entry)
- Modify: `frontend/src/dashboard/wallet/WalletDashboard.tsx` (render the tab)
- Test: `frontend/src/__tests__/dashboard/budget/BudgetTab.test.tsx`

**Interfaces:**
- Consumes: `useBudgets`, `budgetLogic`, `useWalletContext()` (`wallet.color`,
  `wallet.currency`, `wallet.userRole`), `components/ui/Button`, `Icon` component
  (`src/components/icon/Icon.tsx`) for tag chips.
- Produces: `<BudgetTab />` (no props); `BudgetCard` props
  `{ budget: Budget; walletColor: string; currency: string; canEdit: boolean; onEdit: (b: Budget) => void; onDelete: (b: Budget) => void; }`.
- The form overlay arrives in Task 10 — in this task the New/Edit buttons keep local
  state but render nothing yet (wire them in Task 10).

**Before coding:** re-read `frontend/style.md`. For money formatting, grep
`frontend/src/utils/` for the currency formatter the Transactions tab uses
(`grep -rn "Intl.NumberFormat" frontend/src/utils frontend/src/dashboard/transaction | head`)
and reuse it — do not add a new one.

- [x] **Step 1: Write the failing tab test**

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Budget, Wallet } from "../../../utils/types";

const budgetsFixture: Budget[] = [
  {
    id: "b1",
    name: "Food budget",
    tagName: "Food",
    limitAmount: 300,
    periodType: "MONTHLY",
    startDate: "2026-07-01",
    endDate: null,
    rollover: false,
    alertThresholds: [80, 100],
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    spent: 250,
    effectiveLimit: 300,
    remaining: 50,
    percentUsed: 83,
    status: "WARNING",
    crossedThresholds: [80],
    active: true,
  },
];

const mockUseBudgets = vi.fn();
vi.mock("../../../dashboard/budget/useBudgets", () => ({
  useBudgets: (walletId: string) => mockUseBudgets(walletId),
}));

const wallet = {
  id: "w1",
  name: "Main",
  icon: "wallet",
  color: "#7c3aed",
  currency: "EUR",
  createdAt: "",
  userRole: "EDITOR",
} as Wallet;

const mockContext = vi.fn();
vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => mockContext(),
}));

import { BudgetTab } from "../../../dashboard/budget/BudgetTab";

describe("BudgetTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.mockReturnValue({ wallet, tags: [] });
    mockUseBudgets.mockReturnValue({
      budgets: budgetsFixture,
      isLoading: false,
      refresh: vi.fn(),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
    });
  });

  it("renders a card per budget with its status", () => {
    render(<BudgetTab />);
    expect(screen.getByText("Food budget")).toBeInTheDocument();
    expect(screen.getByText("Near limit")).toBeInTheDocument();
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });

  it("shows the New budget button to editors", () => {
    render(<BudgetTab />);
    expect(screen.getByRole("button", { name: /new budget/i })).toBeInTheDocument();
  });

  it("hides the New budget button from viewers", () => {
    mockContext.mockReturnValue({ wallet: { ...wallet, userRole: "VIEWER" }, tags: [] });
    render(<BudgetTab />);
    expect(screen.queryByRole("button", { name: /new budget/i })).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no budgets", () => {
    mockUseBudgets.mockReturnValue({
      budgets: [],
      isLoading: false,
      refresh: vi.fn(),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
    });
    render(<BudgetTab />);
    expect(screen.getByText(/no budgets yet/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run to verify it fails** — `npm test` → module not found.

- [x] **Step 3: Implement `BudgetCard.tsx`** (structure below is binding for behavior —
  name/status/label/bar; fine-tune classes against `style.md`, not against new design
  ideas: **no sweeping visual inventions, reuse the app's card look** — check how
  `SubscriptionTab`'s cards are styled and stay consistent)

```tsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../utils/types";
import { STATUS_META, barPercent, periodLabel } from "./budgetLogic";

interface BudgetCardProps {
  budget: Budget;
  walletColor: string;
  currency: string;
  canEdit: boolean;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  walletColor,
  currency,
  canEdit,
  onEdit,
  onDelete,
}) => {
  const meta = STATUS_META[budget.status];
  const money = (v: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v); // replace with the shared util found in Step 0 grep

  return (
    <div className="rounded-xl border border-app-border bg-app-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-app-text truncate">{budget.name}</h3>
          <p className="text-xs text-app-muted">
            {budget.tagName ?? "Whole wallet"} · {periodLabel(budget)}
            {budget.rollover && " · Rollover"}
          </p>
        </div>
        <span
          className="shrink-0 text-xs font-bold px-2 py-1 rounded-md"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="h-2 rounded-full bg-app-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barPercent(budget)}%`, backgroundColor: meta.color }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-app-text font-semibold">
          {money(budget.spent)}{" "}
          <span className="text-app-muted font-normal">of {money(budget.effectiveLimit)}</span>
        </span>
        <span className="text-app-muted">{budget.percentUsed}%</span>
      </div>

      {!budget.active && (
        <p className="text-xs text-app-muted">Not active in the current period.</p>
      )}

      {canEdit && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            aria-label={`Edit ${budget.name}`}
            onClick={() => onEdit(budget)}
            className="text-app-muted hover:text-app-text transition-colors p-1"
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
          <button
            type="button"
            aria-label={`Delete ${budget.name}`}
            onClick={() => onDelete(budget)}
            className="text-app-muted hover:text-red-400 transition-colors p-1"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}
    </div>
  );
};
```

(The `walletColor` prop is used for the header CTA and any accent ring; if unused in
the final card markup after style.md alignment, drop the prop — keep the tests green.)

- [x] **Step 4: Implement `BudgetTab.tsx`**

```tsx
import React, { useState } from "react";
import type { Budget } from "../../utils/types";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { useBudgets } from "./useBudgets";
import { BudgetCard } from "./BudgetCard";
import { Button } from "../../components/ui/Button";

export const BudgetTab: React.FC = () => {
  const { wallet } = useWalletContext();
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } =
    useBudgets(wallet.id);
  const canEdit = wallet.userRole !== "VIEWER";

  // Wired to BudgetFormOverlay + DeleteModal in the next task.
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  void editing;
  void creating;
  void deleting;
  void createBudget;
  void updateBudget;
  void deleteBudget;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-app-text">Budgets</h2>
        {canEdit && (
          <Button onClick={() => setCreating(true)}>New budget</Button>
        )}
      </div>

      {!isLoading && budgets.length === 0 && (
        <div className="rounded-xl border border-dashed border-app-border p-8 text-center text-app-muted">
          <p className="font-semibold text-app-text mb-1">No budgets yet</p>
          <p className="text-sm">
            Set a spending limit on a category or on the whole wallet to start tracking.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            walletColor={wallet.color}
            currency={wallet.currency}
            canEdit={canEdit}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ))}
      </div>
    </div>
  );
};
```

Check `components/ui/Button`'s actual props (`grep -n "interface ButtonProps" -A 10
frontend/src/components/ui/Button.tsx`) and pass the wallet accent the way the other
tabs' primary CTAs do.

- [x] **Step 5: Wire the tab.** In `WalletTabs.tsx` add
  `{ id: "budget", label: "Budget", icon: faBullseye }` between Statistics and Settings
  (import `faBullseye` from `@fortawesome/free-solid-svg-icons`). In
  `WalletDashboard.tsx` add `{activeTab === "budget" && <BudgetTab />}` alongside the
  other tab conditionals (import from `../budget/BudgetTab`). `"budget"` is already in
  `VALID_TABS` — no routing change needed.

- [x] **Step 6: Run to verify it passes** — `npm test` → PASS. Also eyeball it in the
  running dev server (do **not** restart it): open a wallet → Budget tab.

- [x] **Step 7: Verify + commit**

```bash
npm run lint && npm test && npm run build
git add frontend/src/dashboard/budget/ frontend/src/dashboard/wallet/WalletTabs.tsx \
        frontend/src/dashboard/wallet/WalletDashboard.tsx frontend/src/__tests__/dashboard/budget/
git commit -m "feat(budget): Budget tab with status cards"
```

---

### Task 10: `BudgetFormOverlay` + delete flow

**Files:**
- Create: `frontend/src/dashboard/budget/BudgetFormOverlay.tsx`
- Modify: `frontend/src/dashboard/budget/BudgetTab.tsx` (render overlay + DeleteModal)
- Test: `frontend/src/__tests__/dashboard/budget/BudgetFormOverlay.test.tsx`

**Interfaces:**
- Produces: `BudgetFormOverlay` props:
  `{ open: boolean; initial: Budget | null; tags: Tag[]; accentColor: string; onClose: () => void; onSubmit: (payload: BudgetPayload) => Promise<boolean>; }`
  (`initial = null` → create mode; non-null → edit mode with fields prefilled).
- Consumes: `ResponsiveOverlay` (the house shell for drawer/mobile forms — exact props
  in `frontend/src/components/ui/ResponsiveOverlay.tsx`: `open, onClose, title,
  accentColor, footer, children`), `Input`, `CustomSelect`, `Button` from
  `components/ui/`, `validateThresholds` from `budgetLogic`, `tags` from
  `useWalletContext()`.

**Form contract (binding):**
- Fields: name (`Input`, 3–25); scope (`CustomSelect`: "Whole wallet" + one option per
  wallet tag, by name); limit amount (`Input type="number"`, > 0); period
  (`CustomSelect`: Weekly / Monthly / Yearly / Custom range); **CUSTOM only:** start +
  end date inputs (end required, ≥ start); **recurring only:** a rollover toggle —
  check `ls frontend/src/components/ui/` for an existing Toggle/Switch primitive and
  use it; if none exists, a labelled native checkbox styled with `app-*` tokens is
  acceptable (do NOT build a new ui/ primitive for this);
  thresholds editor: number input + "Add" button producing removable chips, validated
  with `validateThresholds`, default `[80, 100]`.
- Footer: primary submit `Button` ("Create budget" / "Save changes"), disabled while
  invalid or submitting; on `onSubmit(...) === true` → `onClose()`.
- Payload shape: `{ name, tagName (null for whole wallet), limitAmount: Number(...),
  periodType, startDate?, endDate? (CUSTOM only), rollover, alertThresholds }`.
- Delete: in `BudgetTab`, reuse the house `DeleteModal` exactly as the Categories tab
  uses it for tag deletion (same component, **friction level 1** — hold-to-confirm),
  calling `deleteBudget(budget.id)` on confirm. Find the reference usage with
  `grep -rn "DeleteModal" frontend/src/dashboard/tag/`.

- [x] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetFormOverlay } from "../../../dashboard/budget/BudgetFormOverlay";
import type { Tag } from "../../../utils/types";

const tags: Tag[] = [
  { name: "Food", icon: "utensils", colorHex: "#34d399" },
  { name: "Rent", icon: "house", colorHex: "#60a5fa" },
];

describe("BudgetFormOverlay", () => {
  const onSubmit = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  const renderForm = () =>
    render(
      <BudgetFormOverlay
        open
        initial={null}
        tags={tags}
        accentColor="#7c3aed"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

  it("renders the create form with default thresholds", () => {
    renderForm();
    expect(screen.getByText(/new budget/i)).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows date-range fields only for the custom period", () => {
    renderForm();
    expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();
    // switch period to Custom range — CustomSelect interaction; open it and pick the option
    fireEvent.click(screen.getByText(/monthly/i));
    fireEvent.click(screen.getByText(/custom range/i));
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it("submits a whole-wallet monthly budget payload", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Everything" },
    });
    fireEvent.change(screen.getByLabelText(/limit/i), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create budget/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Everything",
        tagName: null,
        limitAmount: 1000,
        periodType: "MONTHLY",
        alertThresholds: [80, 100],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("blocks submit while the name is invalid", () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "ab" } });
    expect(
      screen.getByRole("button", { name: /create budget/i }),
    ).toBeDisabled();
  });
});
```

Note: the two CustomSelect interactions in the test assume the select renders its
current value as clickable text and its options as text — adjust the queries to
`CustomSelect`'s real markup (see its own tests under
`src/__tests__/components/ui/` if present) **without changing what is asserted**.

- [x] **Step 2: Run to verify it fails** — `npm test` → module not found.

- [x] **Step 3: Implement `BudgetFormOverlay.tsx`.** Structure: local `useState` per
  field, initialised from `initial` (or defaults: period MONTHLY, thresholds
  `[80, 100]`, scope whole-wallet); a `payload()` builder; `canSubmit` =
  name 3–25 && amount > 0 && (`periodType !== "CUSTOM"` || (start && end && end >= start))
  && `validateThresholds(thresholds) === null`; render inside `ResponsiveOverlay` with
  `title={initial ? "Edit budget" : "New budget"}`, `accentColor`, and the submit
  `Button` in `footer`. Threshold chips: `flex flex-wrap gap-2`, each chip a small
  rounded `bg-app-input` pill `"{t}%"` with an in-chip remove button
  (`aria-label={\`Remove ${t}%\`}`).

- [x] **Step 4: Wire into `BudgetTab.tsx`:** render
  `<BudgetFormOverlay open={creating || editing !== null} initial={editing} tags={tags} accentColor={wallet.color} onClose={...reset state...} onSubmit={editing ? (p) => updateBudget(editing.id, p) : createBudget} />`
  (take `tags` from `useWalletContext()`), plus the `DeleteModal` for `deleting`
  (friction level 1, confirm → `deleteBudget(deleting.id)`). Remove the placeholder
  `void` statements from Task 9.

- [x] **Step 5: Run to verify it passes** — `npm test` → PASS. Manually exercise
  create/edit/delete against the dev servers (backend on :8080 must be running).

- [x] **Step 6: Verify + commit**

```bash
npm run lint && npm test && npm run build
git add frontend/src/dashboard/budget/ frontend/src/__tests__/dashboard/budget/
git commit -m "feat(budget): create/edit overlay and delete flow"
```

---

## Phase C — Wrap-up

### Task 11 (OPTIONAL — confirm with the user first): MCP budget tools

**Files:**
- Modify: `mcp-server/mcp_server.py`

Add three tools mirroring the existing wallet/transaction tools' structure (same HTTP
client + bearer-token forwarding; the backend enforces permissions):
- `list_budgets(wallet_id)` → `GET /api/budgets/{wallet_id}` — returns budgets **with
  live status** (spent, percentUsed, status, crossedThresholds).
- `create_budget(wallet_id, name, limit_amount, period_type, tag_name=None, start_date=None, end_date=None, rollover=False, alert_thresholds=None)` → `POST /api/budgets/{wallet_id}`.
- `delete_budget(wallet_id, budget_id)` → `DELETE /api/budgets/{wallet_id}/{budget_id}`.

Copy the docstring style of the neighbouring tools (the LLM client reads them). Test
manually via the MCP client of choice; there is no Python test suite in this repo.

Commit: `git commit -m "feat(mcp): budget tools (list/create/delete)"`.

### Task 12: Final gates + roadmap tick

- [x] Backend: `./gradlew spotlessApply check` — green (Spotless + tests + ≥90% coverage).
- [x] Frontend: `npm run lint && npm test && npm run build` — green.
- [x] Update the public roadmap: in `frontend/src/components/ToDoPage/todoData.ts` set
  the "Budgeting" item `status` to `"FINISHED"` (or `"STARTED"` if Task 11 was skipped
  and the user considers MCP part of the feature — ask).
- [ ] `graphify update .` (house rule after code changes). — **SKIPPED** (heavy graph regeneration deferred; run separately)
- [x] Commit: `git commit -am "chore(budget): roadmap status + graph refresh"`.
- [ ] Use superpowers:finishing-a-development-branch to close out (the user merges
  manually — do not merge or push without being asked).

---

## Self-review notes (already applied)

- Spec §2.3 uses `tagName` (not `tagId`): tags are addressed by name across the API
  and `TagResponse` exposes no id — the plan follows the spec as amended.
- `spent` is always computed over the period bounds; `active` only gates alerts and the
  UI badge (an ended CUSTOM budget still shows its final numbers).
- `BudgetService.computeStatus` is the single computation path for both the API and the
  cron job — do not duplicate the math in the job.
- The `TagRepository` generic fix (Task 4) is intentionally in-plan: budgets are the
  first feature needing `findById` on tags; verify with the full suite.
