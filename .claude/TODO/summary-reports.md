# Periodic Summary Reports — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-07-07-summary-reports-design.md` (approved). Read it first.

**Goal:** Monthly report + yearly wrap-up emails (short HTML body + PDF attachment) for every opted-in non-demo user, one wallet-section per ACCEPTED wallet; Web Push companion notifications in the final phases.

**Architecture:** Two new `ManagedJob`s (keys `monthly-report`, `yearly-report`) on the existing DB-driven scheduler, extended with `MONTHLY`/`YEARLY` frequencies. A new `report/` backend package: pure in-memory `ReportAggregator` → `ReportHtmlBuilder` (existing `{{token}}` template mechanism) → `ReportPdfRenderer` (openhtmltopdf) → `SendEmailService.sendReportEmail` (PDF attachment). Preferences are boolean columns on `User`, surfaced in a new Settings “Notifications” section. Push = greenfield Web Push/VAPID (`nl.martijndwars:web-push` + custom service worker via vite-plugin-pwa `injectManifest`).

**Tech Stack:** Spring Boot 3.5 / Java 21, `io.github.openhtmltopdf:openhtmltopdf-pdfbox`, `nl.martijndwars:web-push` + BouncyCastle, React 19 + vite-plugin-pwa (injectManifest) + workbox-*, Vitest.

## Global Constraints

- **Git workflow:** work on branch `feature/summary-reports` cut from `release/v3.2.0`; never commit to `release/*`/`main` directly; the user merges manually. Commit at the end of every task.
- **English only** for all UI copy, email/PDF copy, and code comments.
- **Backend gates:** `./gradlew spotlessApply` before committing; `./gradlew check` enforces Spotless + **90% line coverage**. Every backend change ships with JUnit tests (Stop hook re-runs `./gradlew test`).
- **Frontend gates:** `npm run lint` → `npm test` → `npm run build` (same order as CI/Stop hook). Every frontend change ships with Vitest tests under `src/__tests__/<mirrored path>`; extracted pure logic MUST have a unit test.
- **No path aliases** — all frontend imports relative. Reuse `components/ui/` primitives (`Button`, `Toggle`, `Card`, `CustomSelect`, `Input`); never hand-roll `<button>`/`<input>`.
- **Persistence:** no Flyway — schema evolves via `ddl-auto=update`. New NOT NULL boolean columns MUST use `columnDefinition = "boolean default true"` (mirrors `User.tokenVersion`) so existing rows migrate. New entity PKs use UUIDv7 (`@UuidGenerator(algorithm = UuidV7Generator.class)`).
- **All REST endpoints under `/api/...`.**
- **PDF templates must be well-formed XHTML** (openhtmltopdf is an XML parser: close every tag, `<br/>` not `<br>`, quote attributes, no raw `&`).
- Amounts always come from `Transaction.amount` (wallet-currency value) with `Transaction.type` INCOME/EXPENSE. **Coordination note:** `.claude/TODO/walletEncryptionPlan.md` may later encrypt amounts (`encryptedAmount` column exists); reports read plaintext `amount` — revisit if encryption lands first.
- Report period is derived from execution date: monthly job covers `YearMonth.now().minusMonths(1)`, yearly covers `Year.now().getValue() - 1`. Admin “Run now” re-sends the last closed period (documented; no idempotency table).
- After finishing a session of code changes, run `graphify update .`.

**Setup (once, before Task 1):**
```bash
cd /home/nicola/Desktop/FinanceWebApp
git checkout release/v3.2.0 && git pull
git checkout -b feature/summary-reports
```

---

## Phase 1 — Scheduler MONTHLY/YEARLY

### Task 1: Extend the scheduler with MONTHLY and YEARLY frequencies

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/scheduling/JobFrequency.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/ScheduledJobConfig.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/scheduling/ManagedJob.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/scheduling/ScheduledJobService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/UpdateScheduleRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/ScheduledJobDTO.java`
- Modify (fix call sites): `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/AdminJobControllerTest.java:54`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/scheduling/ScheduledJobServiceTest.java`

**Interfaces:**
- Consumes: existing `ScheduledJobService.toCron(ScheduledJobConfig)`, `ManagedJob.ScheduleDefaults`.
- Produces: `JobFrequency.MONTHLY`, `JobFrequency.YEARLY`; `ScheduledJobConfig.getDayOfMonth()/getMonthOfYear()` (`Integer`, nullable, default 1 when null); `ManagedJob.ScheduleDefaults(JobFrequency, int hour, int minute, String daysOfWeek, Integer dayOfMonth, Integer monthOfYear)` **plus** the old 4-arg convenience constructor (existing jobs untouched); `UpdateScheduleRequest`/`ScheduledJobDTO` carry `Integer dayOfMonth, Integer monthOfYear` appended after `daysOfWeek`.

- [ ] **Step 1: Write the failing tests** — append to `ScheduledJobServiceTest`:

```java
@Test
void toCron_Monthly_UsesDayOfMonth() {
  ScheduledJobConfig c = config("k", true, JobFrequency.MONTHLY, 7, 0, null);
  c.setDayOfMonth(1);
  assertEquals("0 0 7 1 * *", ScheduledJobService.toCron(c));
}

@Test
void toCron_Monthly_NullDayOfMonth_DefaultsToFirst() {
  ScheduledJobConfig c = config("k", true, JobFrequency.MONTHLY, 7, 0, null);
  assertEquals("0 0 7 1 * *", ScheduledJobService.toCron(c));
}

@Test
void toCron_Yearly_UsesDayAndMonth() {
  ScheduledJobConfig c = config("k", true, JobFrequency.YEARLY, 7, 30, null);
  c.setDayOfMonth(1);
  c.setMonthOfYear(1);
  assertEquals("0 30 7 1 1 *", ScheduledJobService.toCron(c));
}

@Test
void updateSchedule_PersistsDayOfMonthAndMonthOfYear() {
  UpdateScheduleRequest req =
      new UpdateScheduleRequest(JobFrequency.YEARLY, 7, 30, List.of(), 15, 6);

  ScheduledJobDTO dto = service.updateSchedule("backup", req);

  assertEquals(15, dto.dayOfMonth());
  assertEquals(6, dto.monthOfYear());
  assertEquals(15, backupCfg.getDayOfMonth());
  assertEquals(6, backupCfg.getMonthOfYear());
}
```

Also update the two existing call sites to the new record arity (compile fix):
- `ScheduledJobServiceTest` `updateSchedule_MutatesConfigAndReschedules`: `new UpdateScheduleRequest(JobFrequency.WEEKLY, 4, 30, List.of("MON", "WED"), null, null)`
- `AdminJobControllerTest:54`: same — append `, null, null`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./gradlew test --tests "*.ScheduledJobServiceTest"`
Expected: COMPILE ERROR (missing enum constants / record components) — that counts as red.

- [ ] **Step 3: Implement**

`JobFrequency.java`:
```java
/** How often a managed job runs. Drives the (computed) cron expression. */
public enum JobFrequency {
  HOURLY,
  DAILY,
  WEEKLY,
  MONTHLY,
  YEARLY
}
```

`ScheduledJobConfig.java` — add after `daysOfWeek`:
```java
  /** 1–28 day of month for MONTHLY/YEARLY; null otherwise (treated as 1). */
  private Integer dayOfMonth;

  /** 1–12 month for YEARLY; null otherwise (treated as 1 = January). */
  private Integer monthOfYear;
```

`ManagedJob.java` — replace the `ScheduleDefaults` record:
```java
  /**
   * Default schedule values for seeding. {@code daysOfWeek} is a CSV (e.g. "MON,WED") or null;
   * {@code dayOfMonth}/{@code monthOfYear} apply to MONTHLY/YEARLY and may be null (= 1).
   */
  record ScheduleDefaults(
      JobFrequency frequency,
      int hour,
      int minute,
      String daysOfWeek,
      Integer dayOfMonth,
      Integer monthOfYear) {

    /** Convenience constructor for HOURLY/DAILY/WEEKLY jobs. */
    public ScheduleDefaults(JobFrequency frequency, int hour, int minute, String daysOfWeek) {
      this(frequency, hour, minute, daysOfWeek, null, null);
    }
  }
```

`UpdateScheduleRequest.java`:
```java
/** Request to change a job's schedule (structured — no raw cron). */
public record UpdateScheduleRequest(
    @NotNull JobFrequency frequency,
    @Min(0) @Max(23) int hourOfDay,
    @Min(0) @Max(59) int minuteOfHour,
    List<String> daysOfWeek,
    @Min(1) @Max(28) Integer dayOfMonth,
    @Min(1) @Max(12) Integer monthOfYear) {}
```
(Cap `dayOfMonth` at 28 so a monthly/yearly schedule can never silently skip short months.)

`ScheduledJobDTO.java`:
```java
public record ScheduledJobDTO(
    String key,
    String displayName,
    boolean enabled,
    String frequency,
    int hourOfDay,
    int minuteOfHour,
    List<String> daysOfWeek,
    Integer dayOfMonth,
    Integer monthOfYear,
    Instant nextRunAt,
    List<JobRunDTO> recentRuns) {}
```

`ScheduledJobService.java` — four touch points:
1. `init()` seeding builder — after `.daysOfWeek(d.daysOfWeek())` add:
```java
                .dayOfMonth(d.dayOfMonth())
                .monthOfYear(d.monthOfYear())
```
2. `updateSchedule(...)` — after `cfg.setDaysOfWeek(...)` add:
```java
    cfg.setDayOfMonth(req.dayOfMonth());
    cfg.setMonthOfYear(req.monthOfYear());
```
3. `toCron(...)` — extend the switch:
```java
      case MONTHLY ->
          String.format(
              "0 %d %d %d * *", c.getMinuteOfHour(), c.getHourOfDay(), dayOfMonthOrDefault(c));
      case YEARLY ->
          String.format(
              "0 %d %d %d %d *",
              c.getMinuteOfHour(), c.getHourOfDay(), dayOfMonthOrDefault(c), monthOfYearOrDefault(c));
```
with private helpers:
```java
  private static int dayOfMonthOrDefault(ScheduledJobConfig c) {
    return c.getDayOfMonth() == null ? 1 : c.getDayOfMonth();
  }

  private static int monthOfYearOrDefault(ScheduledJobConfig c) {
    return c.getMonthOfYear() == null ? 1 : c.getMonthOfYear();
  }
```
4. `toDTO(...)` — pass `cfg.getDayOfMonth(), cfg.getMonthOfYear()` between `splitDays(...)` and `nextRun(...)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && ./gradlew test --tests "*.ScheduledJobServiceTest" --tests "*.AdminJobControllerTest"`
Expected: PASS (all green).

- [ ] **Step 5: Format + full suite + commit**

```bash
cd backend && ./gradlew spotlessApply test
git add -A backend
git commit -m "feat(scheduler): MONTHLY and YEARLY job frequencies"
```

---

### Task 2: Admin SystemTab — schedule editor for MONTHLY/YEARLY

**Files:**
- Create: `frontend/src/admin/schedulePayload.ts`
- Modify: `frontend/src/admin/SystemTab.tsx`
- Test: `frontend/src/__tests__/admin/schedulePayload.test.ts`

**Interfaces:**
- Consumes: extended `ScheduledJobDTO` JSON from Task 1 (`dayOfMonth: number | null`, `monthOfYear: number | null` after `daysOfWeek`).
- Produces: `buildSchedulePayload(draft: ScheduleDraft): SchedulePayload` — the exact body for `PUT /api/admin/jobs/{key}/schedule`.

- [ ] **Step 1: Write the failing test** — `frontend/src/__tests__/admin/schedulePayload.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildSchedulePayload } from "../../admin/schedulePayload";

const base = {
  frequency: "DAILY",
  hourOfDay: 3,
  minuteOfHour: 0,
  daysOfWeek: ["MON"],
  dayOfMonth: 5,
  monthOfYear: 6,
};

describe("buildSchedulePayload", () => {
  it("strips daysOfWeek/dayOfMonth/monthOfYear for DAILY", () => {
    expect(buildSchedulePayload(base)).toEqual({
      frequency: "DAILY",
      hourOfDay: 3,
      minuteOfHour: 0,
      daysOfWeek: [],
      dayOfMonth: null,
      monthOfYear: null,
    });
  });

  it("keeps daysOfWeek only for WEEKLY", () => {
    expect(buildSchedulePayload({ ...base, frequency: "WEEKLY" }).daysOfWeek).toEqual(["MON"]);
    expect(buildSchedulePayload({ ...base, frequency: "WEEKLY" }).dayOfMonth).toBeNull();
  });

  it("keeps dayOfMonth only for MONTHLY", () => {
    const p = buildSchedulePayload({ ...base, frequency: "MONTHLY" });
    expect(p.dayOfMonth).toBe(5);
    expect(p.monthOfYear).toBeNull();
    expect(p.daysOfWeek).toEqual([]);
  });

  it("keeps dayOfMonth and monthOfYear for YEARLY", () => {
    const p = buildSchedulePayload({ ...base, frequency: "YEARLY" });
    expect(p.dayOfMonth).toBe(5);
    expect(p.monthOfYear).toBe(6);
  });
});
```

- [ ] **Step 2: Run it** — `cd frontend && npx vitest run src/__tests__/admin/schedulePayload.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `frontend/src/admin/schedulePayload.ts`:

```ts
export interface ScheduleDraft {
  frequency: string;
  hourOfDay: number;
  minuteOfHour: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
}

export interface SchedulePayload extends ScheduleDraft {
  dayOfMonth: number | null;
  monthOfYear: number | null;
}

/** Normalizes the schedule-editor draft into the PUT /admin/jobs/{key}/schedule body. */
export function buildSchedulePayload(draft: ScheduleDraft): SchedulePayload {
  return {
    frequency: draft.frequency,
    hourOfDay: draft.hourOfDay,
    minuteOfHour: draft.minuteOfHour,
    daysOfWeek: draft.frequency === "WEEKLY" ? draft.daysOfWeek : [],
    dayOfMonth:
      draft.frequency === "MONTHLY" || draft.frequency === "YEARLY"
        ? (draft.dayOfMonth ?? 1)
        : null,
    monthOfYear: draft.frequency === "YEARLY" ? (draft.monthOfYear ?? 1) : null,
  };
}
```

Then wire `SystemTab.tsx`:
1. `ScheduledJobDTO` interface: add `dayOfMonth: number | null;` and `monthOfYear: number | null;` after `daysOfWeek`.
2. `FREQ_OPTIONS`: append `{ value: "MONTHLY", label: "Monthly" }, { value: "YEARLY", label: "Yearly" }`.
3. New constants:
```ts
const DOM_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1), label }));
```
4. `JOB_ICONS`: add `"monthly-report": faEnvelope, "yearly-report": faStar` (import `faEnvelope`, `faStar` from `@fortawesome/free-solid-svg-icons`).
5. `JobCard` state: `const [dayOfMonth, setDayOfMonth] = useState<number | null>(job.dayOfMonth);` and same for `monthOfYear`; include both in the sync-reset block and in `scheduleSig` (`` `${j.frequency}|${j.hourOfDay}|${j.minuteOfHour}|${days}|${j.dayOfMonth ?? ""}|${j.monthOfYear ?? ""}` `` — update the function signature/type accordingly).
6. Editor row: after the frequency select, for `MONTHLY` render `on day <Select DOM_OPTIONS>`; for `YEARLY` render `on <Select DOM_OPTIONS> <Select MONTH_OPTIONS width="w-32">`; the existing `at HH : MM` selects stay for both (they're in the non-HOURLY branch already).
7. `handleSave`: `await api.put(`/admin/jobs/${job.key}/schedule`, buildSchedulePayload({ frequency, hourOfDay, minuteOfHour, daysOfWeek, dayOfMonth, monthOfYear }));`
8. `handleReset`: also reset the two new states from `job`.

- [ ] **Step 4: Verify** — `cd frontend && npm run lint && npm test && npm run build` → all green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/admin frontend/src/__tests__/admin
git commit -m "feat(admin): monthly/yearly schedule editing in System tab"
```

---

## Phase 2 — Report aggregation (pure logic)

### Task 3: `ReportAggregator.monthly()` + report records

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/PeriodTotals.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/CategoryTotal.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/WalletMonthlyReport.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportAggregator.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportAggregatorTest.java`

**Interfaces:**
- Consumes: `Wallet` (name/color/currency), `Transaction` (amount, type, transactionDate, tag→parent chain), nothing else — **pure, no repositories**.
- Produces:
  - `PeriodTotals(BigDecimal income, BigDecimal expense, BigDecimal net)`
  - `CategoryTotal(String name, BigDecimal amount, double percentOfTotal, BigDecimal previousAmount)` (`previousAmount` null outside the yearly report)
  - `WalletMonthlyReport(String walletName, String walletColor, String currency, YearMonth period, PeriodTotals totals, PeriodTotals previousTotals /*null = no prev data*/, BigDecimal endBalance, List<CategoryTotal> topExpenseCategories, List<CategoryTotal> topIncomeCategories, int transactionCount)`
  - `ReportAggregator.monthly(Wallet wallet, List<Transaction> allTransactions, YearMonth period): WalletMonthlyReport`

Category semantics (MCP `get_wallet_statistics` parity): a transaction's category is its tag's **root parent** name (walk `tag.getParent()` up); null tag → `"Uncategorized"`. Top lists = top 5 by amount desc; `percentOfTotal` = share of that type's period total (0 when total is 0). `endBalance` = Σ(income) − Σ(expense) over **all** transactions dated ≤ end of period.

- [ ] **Step 1: Write the failing tests** — `ReportAggregatorTest.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReportAggregatorTest {

  private final ReportAggregator aggregator = new ReportAggregator();
  private final Wallet wallet =
      Wallet.builder().name("Main").color("#8b5cf6").currency("EUR").build();

  private static Tag tag(String name, Tag parent) {
    return Tag.builder().name(name).parent(parent).build();
  }

  private static Transaction tx(
      String name, String amount, Transaction.Type type, LocalDate date, Tag tag) {
    return Transaction.builder()
        .name(name)
        .amount(new BigDecimal(amount))
        .type(type)
        .transactionDate(date)
        .tag(tag)
        .build();
  }

  @Test
  void monthly_ComputesTotalsAndEndBalance() {
    List<Transaction> all =
        List.of(
            tx("salary", "2000.00", Transaction.Type.INCOME, LocalDate.of(2026, 6, 1), null),
            tx("rent", "800.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 3), null),
            // outside the period, but counts toward the running balance
            tx("old income", "500.00", Transaction.Type.INCOME, LocalDate.of(2026, 1, 10), null),
            // after the period: ignored everywhere
            tx("future", "999.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 7, 1), null));

    WalletMonthlyReport r = aggregator.monthly(wallet, all, YearMonth.of(2026, 6));

    assertEquals(new BigDecimal("2000.00"), r.totals().income());
    assertEquals(new BigDecimal("800.00"), r.totals().expense());
    assertEquals(new BigDecimal("1200.00"), r.totals().net());
    assertEquals(new BigDecimal("1700.00"), r.endBalance()); // 2000+500-800
    assertEquals(2, r.transactionCount());
    assertEquals("Main", r.walletName());
    assertEquals("EUR", r.currency());
  }

  @Test
  void monthly_PreviousTotals_NullWhenPreviousMonthEmpty() {
    List<Transaction> all =
        List.of(tx("a", "10.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 5), null));

    WalletMonthlyReport r = aggregator.monthly(wallet, all, YearMonth.of(2026, 6));

    assertNull(r.previousTotals());
  }

  @Test
  void monthly_PreviousTotals_PresentWhenPreviousMonthHasData() {
    List<Transaction> all =
        List.of(
            tx("a", "10.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 5), null),
            tx("b", "40.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 5, 20), null));

    WalletMonthlyReport r = aggregator.monthly(wallet, all, YearMonth.of(2026, 6));

    assertNotNull(r.previousTotals());
    assertEquals(new BigDecimal("40.00"), r.previousTotals().expense());
  }

  @Test
  void monthly_TopCategories_RollUpToRootParent_NullTagIsUncategorized() {
    Tag food = tag("Food", null);
    Tag groceries = tag("Groceries", food);
    List<Transaction> all =
        List.of(
            tx("spesa", "60.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 2), groceries),
            tx("pranzo", "20.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 8), food),
            tx("boh", "20.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 9), null));

    WalletMonthlyReport r = aggregator.monthly(wallet, all, YearMonth.of(2026, 6));

    assertEquals(2, r.topExpenseCategories().size());
    CategoryTotal top = r.topExpenseCategories().get(0);
    assertEquals("Food", top.name());
    assertEquals(new BigDecimal("80.00"), top.amount());
    assertEquals(80.0, top.percentOfTotal(), 0.01);
    assertEquals("Uncategorized", r.topExpenseCategories().get(1).name());
    assertNull(top.previousAmount());
  }

  @Test
  void monthly_EmptyMonth_ZeroTotalsAndCountZero() {
    WalletMonthlyReport r = aggregator.monthly(wallet, List.of(), YearMonth.of(2026, 6));

    assertEquals(0, r.transactionCount());
    assertEquals(0, BigDecimal.ZERO.compareTo(r.totals().income()));
    assertEquals(0, BigDecimal.ZERO.compareTo(r.totals().net()));
    assertTrue(r.topExpenseCategories().isEmpty());
  }
}
```

- [ ] **Step 2: Run** — `cd backend && ./gradlew test --tests "*.ReportAggregatorTest"` → COMPILE ERROR (classes missing) = red.

- [ ] **Step 3: Implement**

`PeriodTotals.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;

/** Income / expense / net for one report period, in the wallet currency. */
public record PeriodTotals(BigDecimal income, BigDecimal expense, BigDecimal net) {}
```

`CategoryTotal.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;

/**
 * One (root) category's total for a period. {@code percentOfTotal} is the share of the period's
 * income or expense total; {@code previousAmount} is the previous-year figure (yearly report only,
 * null elsewhere or when there is no previous data).
 */
public record CategoryTotal(
    String name, BigDecimal amount, double percentOfTotal, BigDecimal previousAmount) {}
```

`WalletMonthlyReport.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/** One wallet's section of the monthly report. {@code previousTotals} is null without prior data. */
public record WalletMonthlyReport(
    String walletName,
    String walletColor,
    String currency,
    YearMonth period,
    PeriodTotals totals,
    PeriodTotals previousTotals,
    BigDecimal endBalance,
    List<CategoryTotal> topExpenseCategories,
    List<CategoryTotal> topIncomeCategories,
    int transactionCount) {}
```

`ReportAggregator.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Pure in-memory aggregation over a wallet's transactions (same approach as the MCP server's
 * get_wallet_statistics — data volumes are personal-scale, so no SQL aggregates are needed).
 */
@Component
public class ReportAggregator {

  static final int TOP_CATEGORIES = 5;

  public WalletMonthlyReport monthly(
      Wallet wallet, List<Transaction> allTransactions, YearMonth period) {
    List<Transaction> inPeriod = between(allTransactions, period.atDay(1), period.atEndOfMonth());
    YearMonth prev = period.minusMonths(1);
    List<Transaction> inPrevious = between(allTransactions, prev.atDay(1), prev.atEndOfMonth());
    PeriodTotals totals = totals(inPeriod);

    return new WalletMonthlyReport(
        wallet.getName(),
        wallet.getColor(),
        wallet.getCurrency(),
        period,
        totals,
        inPrevious.isEmpty() ? null : totals(inPrevious),
        balanceUpTo(allTransactions, period.atEndOfMonth()),
        topCategories(inPeriod, Transaction.Type.EXPENSE, totals.expense(), Map.of()),
        topCategories(inPeriod, Transaction.Type.INCOME, totals.income(), Map.of()),
        inPeriod.size());
  }

  // ── shared helpers (package-private: reused by the yearly report) ─────────

  static List<Transaction> between(List<Transaction> all, LocalDate from, LocalDate to) {
    return all.stream()
        .filter(t -> !t.getTransactionDate().isBefore(from) && !t.getTransactionDate().isAfter(to))
        .toList();
  }

  static PeriodTotals totals(List<Transaction> transactions) {
    BigDecimal income = sumByType(transactions, Transaction.Type.INCOME);
    BigDecimal expense = sumByType(transactions, Transaction.Type.EXPENSE);
    return new PeriodTotals(income, expense, income.subtract(expense));
  }

  static BigDecimal sumByType(List<Transaction> transactions, Transaction.Type type) {
    return transactions.stream()
        .filter(t -> t.getType() == type)
        .map(Transaction::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  static BigDecimal balanceUpTo(List<Transaction> all, LocalDate endInclusive) {
    List<Transaction> upTo = between(all, LocalDate.MIN, endInclusive);
    return sumByType(upTo, Transaction.Type.INCOME)
        .subtract(sumByType(upTo, Transaction.Type.EXPENSE));
  }

  /** Root-parent category name; transactions without a tag land in "Uncategorized". */
  static String rootCategory(Transaction t) {
    Tag tag = t.getTag();
    if (tag == null) return "Uncategorized";
    while (tag.getParent() != null) tag = tag.getParent();
    return tag.getName();
  }

  static Map<String, BigDecimal> byCategory(List<Transaction> transactions, Transaction.Type type) {
    Map<String, BigDecimal> out = new LinkedHashMap<>();
    for (Transaction t : transactions) {
      if (t.getType() != type) continue;
      out.merge(rootCategory(t), t.getAmount(), BigDecimal::add);
    }
    return out;
  }

  /**
   * Top {@value TOP_CATEGORIES} categories of the given type, by amount desc. {@code
   * previousByCategory} feeds {@link CategoryTotal#previousAmount} (pass an empty map to leave it
   * null — monthly reports don't carry per-category history).
   */
  static List<CategoryTotal> topCategories(
      List<Transaction> transactions,
      Transaction.Type type,
      BigDecimal typeTotal,
      Map<String, BigDecimal> previousByCategory) {
    return byCategory(transactions, type).entrySet().stream()
        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
        .limit(TOP_CATEGORIES)
        .map(
            e ->
                new CategoryTotal(
                    e.getKey(),
                    e.getValue(),
                    percent(e.getValue(), typeTotal),
                    previousByCategory.get(e.getKey())))
        .toList();
  }

  static double percent(BigDecimal part, BigDecimal total) {
    if (total == null || total.signum() == 0) return 0.0;
    return part.multiply(BigDecimal.valueOf(100))
        .divide(total, 1, RoundingMode.HALF_UP)
        .doubleValue();
  }
}
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.ReportAggregatorTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): monthly in-memory wallet aggregation"
```

---

### Task 4: `ReportAggregator.yearly()` — wrap-up data

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/MonthRow.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/YearRecords.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/WalletYearlyReport.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportAggregator.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportAggregatorTest.java` (append)

**Interfaces:**
- Consumes: Task 3 helpers (`between`, `totals`, `topCategories`, `byCategory`, `rootCategory`).
- Produces:
  - `MonthRow(YearMonth month, BigDecimal income, BigDecimal expense, BigDecimal net, long transactionCount)`
  - `YearRecords(String biggestExpenseName, LocalDate biggestExpenseDate, BigDecimal biggestExpenseAmount, LocalDate mostExpensiveDay, BigDecimal mostExpensiveDayTotal, YearMonth mostActiveMonth, long mostActiveMonthCount, long totalTransactions, String fastestGrowingCategory, BigDecimal fastestGrowingIncrease)` — the last two are null when the previous year has no transactions.
  - `WalletYearlyReport(String walletName, String walletColor, String currency, int year, PeriodTotals totals, PeriodTotals previousTotals /*null = prev year empty*/, List<MonthRow> months /*always 12*/, YearMonth bestMonth, YearMonth worstMonth /*by net; null when the year is empty*/, List<CategoryTotal> topExpenseCategories /*previousAmount = prev-year figure*/, List<CategoryTotal> topIncomeCategories, YearRecords records, int transactionCount)`
  - `ReportAggregator.yearly(Wallet wallet, List<Transaction> allTransactions, int year): WalletYearlyReport`

Definitions (from spec): best/worst month = highest/lowest net **among months with ≥1 transaction**; fastest-growing category = expense category of the current year with the largest absolute increase vs the previous year (categories absent last year count from 0).

- [ ] **Step 1: Write the failing tests** — append to `ReportAggregatorTest`:

```java
  @Test
  void yearly_MonthRows_BestAndWorstMonth() {
    List<Transaction> all =
        List.of(
            tx("jan-in", "1000.00", Transaction.Type.INCOME, LocalDate.of(2025, 1, 5), null),
            tx("mar-out", "300.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 3, 10), null));

    WalletYearlyReport r = aggregator.yearly(wallet, all, 2025);

    assertEquals(12, r.months().size());
    assertEquals(YearMonth.of(2025, 1), r.bestMonth());
    assertEquals(YearMonth.of(2025, 3), r.worstMonth());
    assertEquals(new BigDecimal("1000.00"), r.months().get(0).income());
    assertEquals(0, BigDecimal.ZERO.compareTo(r.months().get(1).income())); // Feb empty
    assertEquals(2, r.transactionCount());
  }

  @Test
  void yearly_Records_BiggestExpenseAndMostExpensiveDay() {
    List<Transaction> all =
        List.of(
            tx("tv", "900.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 11, 28), null),
            tx("cena", "100.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 11, 28), null),
            tx("laptop", "950.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 4, 2), null));

    WalletYearlyReport r = aggregator.yearly(wallet, all, 2025);

    assertEquals("laptop", r.records().biggestExpenseName());
    assertEquals(new BigDecimal("950.00"), r.records().biggestExpenseAmount());
    assertEquals(LocalDate.of(2025, 11, 28), r.records().mostExpensiveDay());
    assertEquals(new BigDecimal("1000.00"), r.records().mostExpensiveDayTotal());
    assertEquals(3, r.records().totalTransactions());
    assertEquals(YearMonth.of(2025, 11), r.records().mostActiveMonth());
  }

  @Test
  void yearly_FastestGrowingCategory_NullWithoutPreviousYear() {
    List<Transaction> all =
        List.of(tx("a", "10.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 2, 1), null));

    WalletYearlyReport r = aggregator.yearly(wallet, all, 2025);

    assertNull(r.records().fastestGrowingCategory());
    assertNull(r.previousTotals());
  }

  @Test
  void yearly_FastestGrowingCategory_LargestAbsoluteIncrease() {
    Tag food = tag("Food", null);
    Tag travel = tag("Travel", null);
    List<Transaction> all =
        List.of(
            // previous year
            tx("p1", "100.00", Transaction.Type.EXPENSE, LocalDate.of(2024, 5, 1), food),
            tx("p2", "500.00", Transaction.Type.EXPENSE, LocalDate.of(2024, 6, 1), travel),
            // current year: Food +200, Travel -100
            tx("c1", "300.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 5, 1), food),
            tx("c2", "400.00", Transaction.Type.EXPENSE, LocalDate.of(2025, 6, 1), travel));

    WalletYearlyReport r = aggregator.yearly(wallet, all, 2025);

    assertEquals("Food", r.records().fastestGrowingCategory());
    assertEquals(new BigDecimal("200.00"), r.records().fastestGrowingIncrease());
    // YoY on category ranking
    CategoryTotal travelTotal =
        r.topExpenseCategories().stream()
            .filter(c -> c.name().equals("Travel"))
            .findFirst()
            .orElseThrow();
    assertEquals(new BigDecimal("500.00"), travelTotal.previousAmount());
  }
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.ReportAggregatorTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Implement**

`MonthRow.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.YearMonth;

/** One month's line in the yearly wrap-up. */
public record MonthRow(
    YearMonth month, BigDecimal income, BigDecimal expense, BigDecimal net, long transactionCount) {}
```

`YearRecords.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Wrapped-style records for the yearly report. {@code fastestGrowingCategory}/{@code
 * fastestGrowingIncrease} are null when the previous year has no transactions; the expense records
 * are null for a year without expenses.
 */
public record YearRecords(
    String biggestExpenseName,
    LocalDate biggestExpenseDate,
    BigDecimal biggestExpenseAmount,
    LocalDate mostExpensiveDay,
    BigDecimal mostExpensiveDayTotal,
    YearMonth mostActiveMonth,
    long mostActiveMonthCount,
    long totalTransactions,
    String fastestGrowingCategory,
    BigDecimal fastestGrowingIncrease) {}
```

`WalletYearlyReport.java`:
```java
package dev.busato.FinanceWebApp.backend.report;

import java.util.List;

/** One wallet's section of the yearly wrap-up. {@code previousTotals} is null without prior data. */
public record WalletYearlyReport(
    String walletName,
    String walletColor,
    String currency,
    int year,
    PeriodTotals totals,
    PeriodTotals previousTotals,
    List<MonthRow> months,
    java.time.YearMonth bestMonth,
    java.time.YearMonth worstMonth,
    List<CategoryTotal> topExpenseCategories,
    List<CategoryTotal> topIncomeCategories,
    YearRecords records,
    int transactionCount) {}
```

Append to `ReportAggregator.java`:
```java
  public WalletYearlyReport yearly(Wallet wallet, List<Transaction> allTransactions, int year) {
    LocalDate from = LocalDate.of(year, 1, 1);
    LocalDate to = LocalDate.of(year, 12, 31);
    List<Transaction> inYear = between(allTransactions, from, to);
    List<Transaction> inPrevious =
        between(allTransactions, LocalDate.of(year - 1, 1, 1), LocalDate.of(year - 1, 12, 31));
    PeriodTotals totals = totals(inYear);
    Map<String, BigDecimal> prevExpenseByCat =
        inPrevious.isEmpty() ? Map.of() : byCategory(inPrevious, Transaction.Type.EXPENSE);
    Map<String, BigDecimal> prevIncomeByCat =
        inPrevious.isEmpty() ? Map.of() : byCategory(inPrevious, Transaction.Type.INCOME);

    List<MonthRow> months = new java.util.ArrayList<>(12);
    YearMonth best = null;
    YearMonth worst = null;
    BigDecimal bestNet = null;
    BigDecimal worstNet = null;
    for (int m = 1; m <= 12; m++) {
      YearMonth ym = YearMonth.of(year, m);
      List<Transaction> inMonth = between(inYear, ym.atDay(1), ym.atEndOfMonth());
      PeriodTotals t = totals(inMonth);
      months.add(new MonthRow(ym, t.income(), t.expense(), t.net(), inMonth.size()));
      if (inMonth.isEmpty()) continue;
      if (bestNet == null || t.net().compareTo(bestNet) > 0) {
        bestNet = t.net();
        best = ym;
      }
      if (worstNet == null || t.net().compareTo(worstNet) < 0) {
        worstNet = t.net();
        worst = ym;
      }
    }

    return new WalletYearlyReport(
        wallet.getName(),
        wallet.getColor(),
        wallet.getCurrency(),
        year,
        totals,
        inPrevious.isEmpty() ? null : totals(inPrevious),
        months,
        best,
        worst,
        topCategories(inYear, Transaction.Type.EXPENSE, totals.expense(), prevExpenseByCat),
        topCategories(inYear, Transaction.Type.INCOME, totals.income(), prevIncomeByCat),
        records(inYear, months, prevExpenseByCat, inPrevious.isEmpty()),
        inYear.size());
  }

  private static YearRecords records(
      List<Transaction> inYear,
      List<MonthRow> months,
      Map<String, BigDecimal> prevExpenseByCat,
      boolean previousYearEmpty) {
    Transaction biggest =
        inYear.stream()
            .filter(t -> t.getType() == Transaction.Type.EXPENSE)
            .max(Comparator.comparing(Transaction::getAmount))
            .orElse(null);

    Map.Entry<LocalDate, BigDecimal> costliestDay =
        inYear.stream()
            .filter(t -> t.getType() == Transaction.Type.EXPENSE)
            .collect(
                java.util.stream.Collectors.groupingBy(
                    Transaction::getTransactionDate,
                    java.util.stream.Collectors.reducing(
                        BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)))
            .entrySet()
            .stream()
            .max(Map.Entry.comparingByValue())
            .orElse(null);

    MonthRow mostActive =
        months.stream().max(Comparator.comparingLong(MonthRow::transactionCount)).orElse(null);

    String growthCat = null;
    BigDecimal growth = null;
    if (!previousYearEmpty) {
      for (Map.Entry<String, BigDecimal> e :
          byCategory(inYear, Transaction.Type.EXPENSE).entrySet()) {
        BigDecimal increase =
            e.getValue().subtract(prevExpenseByCat.getOrDefault(e.getKey(), BigDecimal.ZERO));
        if (growth == null || increase.compareTo(growth) > 0) {
          growth = increase;
          growthCat = e.getKey();
        }
      }
    }

    return new YearRecords(
        biggest == null ? null : biggest.getName(),
        biggest == null ? null : biggest.getTransactionDate(),
        biggest == null ? null : biggest.getAmount(),
        costliestDay == null ? null : costliestDay.getKey(),
        costliestDay == null ? null : costliestDay.getValue(),
        mostActive == null || mostActive.transactionCount() == 0 ? null : mostActive.month(),
        mostActive == null ? 0 : mostActive.transactionCount(),
        inYear.size(),
        growthCat,
        growth);
  }
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.ReportAggregatorTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): yearly wrap-up aggregation (months, records, YoY)"
```

---

## Phase 3 — PDF rendering + templates

### Task 5: openhtmltopdf dependency + `ReportPdfRenderer`

**Files:**
- Modify: `backend/build.gradle`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportPdfRenderer.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportPdfRendererTest.java`

**Interfaces:**
- Produces: `ReportPdfRenderer.render(String xhtml): byte[]` — throws `IllegalStateException` on renderer failure. Input MUST be well-formed XHTML.

- [ ] **Step 1: Add the dependency** — in `backend/build.gradle`, after the AWS block:

```groovy
    // HTML/CSS → PDF for the periodic report attachments
    implementation 'io.github.openhtmltopdf:openhtmltopdf-pdfbox:1.1.24'
```
Note: `io.github.openhtmltopdf` is the maintained fork of the archived `com.openhtmltopdf` (same API, package names unchanged: `com.openhtmltopdf.pdfboxout.PdfRendererBuilder`). If Gradle can't resolve `1.1.24`, check the latest on Maven Central and pin that.

- [ ] **Step 2: Write the failing test** — `ReportPdfRendererTest.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class ReportPdfRendererTest {

  private final ReportPdfRenderer renderer = new ReportPdfRenderer();

  private static final String XHTML =
      """
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head><title>t</title><style>body { font-family: sans-serif; }</style></head>
      <body><h1>Report</h1><p>hello</p></body>
      </html>
      """;

  @Test
  void render_ProducesNonEmptyPdfBytes() {
    byte[] pdf = renderer.render(XHTML);

    assertTrue(pdf.length > 500);
    assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
  }

  @Test
  void render_MalformedHtml_Throws() {
    assertThrows(IllegalStateException.class, () -> renderer.render("<html><p>unclosed"));
  }
}
```

- [ ] **Step 3: Run** — `./gradlew test --tests "*.ReportPdfRendererTest"` → COMPILE ERROR = red.

- [ ] **Step 4: Implement** — `ReportPdfRenderer.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import org.springframework.stereotype.Component;

/** Renders well-formed XHTML (the report templates) to PDF bytes via openhtmltopdf. */
@Component
public class ReportPdfRenderer {

  public byte[] render(String xhtml) {
    try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.useFastMode();
      builder.withHtmlContent(xhtml, null);
      builder.toStream(out);
      builder.run();
      return out.toByteArray();
    } catch (Exception e) {
      throw new IllegalStateException("PDF rendering failed", e);
    }
  }
}
```

- [ ] **Step 5: Run** — `./gradlew test --tests "*.ReportPdfRendererTest"` → PASS. Then:

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): PDF renderer via openhtmltopdf"
```

---

### Task 6: Monthly templates + `ReportHtmlBuilder`

**Files:**
- Create: `backend/src/main/resources/templates/email/monthlyReportEmail.html`
- Create: `backend/src/main/resources/templates/report/monthlyReportPdf.html`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportHtmlBuilder.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportHtmlBuilderTest.java`

**Interfaces:**
- Consumes: `WalletMonthlyReport` (Task 3).
- Produces:
  - `ReportHtmlBuilder.monthlyEmailBody(String username, YearMonth period, List<WalletMonthlyReport> reports): String`
  - `ReportHtmlBuilder.monthlyPdfHtml(String username, YearMonth period, List<WalletMonthlyReport> reports): String`
  - `ReportHtmlBuilder.monthLabel(YearMonth period): String` → `"June 2026"` (static, reused by ReportService for subjects/filenames).

Mechanism = existing email pattern: flat `{{token}}` `String.replace` on a page template; the repeated wallet sections / category rows are built by private Java helpers and injected as one `{{walletSections}}` token. All free text `HtmlUtils.htmlEscape`d; wallet color passes a `sanitizeHexColor` identical to `SendEmailService`'s (hex literal or `#8b5cf6` fallback). Amounts: `formatAmount(BigDecimal, currency)` → `1,234.56 EUR` (`NumberFormat` `Locale.ENGLISH`, 2 fraction digits). Category bars are pure CSS `<div>` widths (percent). Templates are **XHTML-valid** (openhtmltopdf).

- [ ] **Step 1: Write the failing tests** — `ReportHtmlBuilderTest.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReportHtmlBuilderTest {

  private final ReportHtmlBuilder builder = new ReportHtmlBuilder();

  private static WalletMonthlyReport report(String walletName, String color) {
    return new WalletMonthlyReport(
        walletName,
        color,
        "EUR",
        YearMonth.of(2026, 6),
        new PeriodTotals(
            new BigDecimal("2000.00"), new BigDecimal("800.00"), new BigDecimal("1200.00")),
        new PeriodTotals(
            new BigDecimal("1500.00"), new BigDecimal("900.00"), new BigDecimal("600.00")),
        new BigDecimal("5400.00"),
        List.of(new CategoryTotal("Food", new BigDecimal("300.00"), 37.5, null)),
        List.of(new CategoryTotal("Salary", new BigDecimal("2000.00"), 100.0, null)),
        12);
  }

  @Test
  void monthlyEmailBody_ContainsPeriodWalletAndNoLeftoverTokens() {
    String html =
        builder.monthlyEmailBody("nicola", YearMonth.of(2026, 6), List.of(report("Main", "#8b5cf6")));

    assertTrue(html.contains("June 2026"));
    assertTrue(html.contains("Main"));
    assertFalse(html.contains("{{"), "unreplaced template token left in email body");
  }

  @Test
  void monthlyPdfHtml_EscapesUserContent_AndSanitizesColor() {
    String html =
        builder.monthlyPdfHtml(
            "nicola",
            YearMonth.of(2026, 6),
            List.of(report("<script>x</script>", "red;background:url(x)")));

    assertFalse(html.contains("<script>x</script>"), "wallet name must be HTML-escaped");
    assertTrue(html.contains("&lt;script&gt;"));
    assertFalse(html.contains("url(x)"), "invalid color must be replaced by the fallback");
    assertFalse(html.contains("{{"));
  }

  @Test
  void monthlyPdfHtml_OmitsDeltaWhenNoPreviousMonth() {
    WalletMonthlyReport r =
        new WalletMonthlyReport(
            "Main",
            "#8b5cf6",
            "EUR",
            YearMonth.of(2026, 6),
            new PeriodTotals(BigDecimal.ZERO, new BigDecimal("10.00"), new BigDecimal("-10.00")),
            null,
            new BigDecimal("-10.00"),
            List.of(),
            List.of(),
            1);

    String html = builder.monthlyPdfHtml("nicola", YearMonth.of(2026, 6), List.of(r));

    assertFalse(html.contains("vs previous month"), "no delta row without previous data");
  }

  @Test
  void monthLabel_FormatsEnglish() {
    assertEquals("June 2026", ReportHtmlBuilder.monthLabel(YearMonth.of(2026, 6)));
  }

  @Test
  void pdfHtml_IsRenderable() {
    // Integration guard: the produced markup must be XHTML the PDF renderer accepts.
    byte[] pdf =
        new ReportPdfRenderer()
            .render(
                builder.monthlyPdfHtml(
                    "nicola", YearMonth.of(2026, 6), List.of(report("Main", "#8b5cf6"))));
    assertTrue(pdf.length > 500);
  }
}
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.ReportHtmlBuilderTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Create the templates**

`backend/src/main/resources/templates/email/monthlyReportEmail.html` (short body; matches the existing email look — light card, brand purple `#b829ff`, footer):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>FinanceWebApp - Monthly Report</title>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding:40px 20px;">
    <tr>
        <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0"
                   style="max-width:600px; border:1px solid #e2e8f0; border-top:4px solid #b829ff; border-radius:16px; overflow:hidden; margin:0 auto;">
                <tr>
                    <td align="center" style="padding:40px 30px 10px 30px;">
                        <h1 style="font-size:24px; margin:0 0 8px 0; font-weight:700;">Your {{period}} report is ready</h1>
                        <p style="color:#4a5568; font-size:15px; line-height:1.6; margin:0;">
                            Hi <strong>{{username}}</strong>, here is a quick look at last month.
                            The full report is attached as a PDF.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 30px 30px 30px;">
                        {{highlights}}
                    </td>
                </tr>
                <tr>
                    <td align="center" style="background-color:rgba(0,0,0,0.03); padding:24px;">
                        <p style="color:#718096; font-size:12px; margin:0;">
                            You receive this because monthly reports are enabled in your
                            <a href="{{appUrl}}/settings#notifications" style="color:#b829ff;">notification settings</a>.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
```
`{{highlights}}` is one row per wallet built in Java (see builder below).

`backend/src/main/resources/templates/report/monthlyReportPdf.html` (full report; **XHTML**, one `{{walletSections}}` token):
```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>FinanceWebApp Monthly Report</title>
    <style>
        @page { size: A4; margin: 18mm 14mm; }
        body { font-family: sans-serif; color: #1a202c; font-size: 12px; margin: 0; }
        h1 { font-size: 22px; margin: 0; }
        .sub { color: #718096; margin: 2px 0 18px 0; }
        .wallet { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .wallet h2 { font-size: 15px; margin: 0 0 10px 0; padding-left: 8px; border-left: 4px solid #b829ff; }
        table.kpi { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        table.kpi td { padding: 6px 8px; border-bottom: 1px solid #edf2f7; }
        .label { color: #718096; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
        .amount { text-align: right; font-weight: bold; }
        .pos { color: #059669; } .neg { color: #dc2626; }
        .delta { color: #718096; font-size: 10px; text-align: right; }
        h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #718096; margin: 12px 0 6px 0; }
        .catrow { margin: 3px 0; }
        .catname { display: inline-block; width: 32%; vertical-align: middle; }
        .barwrap { display: inline-block; width: 42%; background: #edf2f7; border-radius: 4px; vertical-align: middle; }
        .bar { height: 8px; border-radius: 4px; }
        .catamount { display: inline-block; width: 24%; text-align: right; vertical-align: middle; }
        .footer { color: #a0aec0; font-size: 9px; margin-top: 12px; text-align: center; }
    </style>
</head>
<body>
    <h1>Monthly Report — {{period}}</h1>
    <p class="sub">Prepared for {{username}} · FinanceWebApp</p>
    {{walletSections}}
    <p class="footer">Generated by FinanceWebApp. Amounts are shown in each wallet's currency.</p>
</body>
</html>
```

- [ ] **Step 4: Implement** — `ReportHtmlBuilder.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Fills the report templates ({@code {{token}}} replace, same mechanism as SendEmailService).
 * Repeated blocks (wallet sections, category rows) are built here and injected as single tokens.
 * Everything user-controlled is escaped; wallet colors are constrained to hex literals because
 * they land inside style attributes.
 */
@Component
public class ReportHtmlBuilder {

  private static final java.util.regex.Pattern HEX_COLOR =
      java.util.regex.Pattern.compile("^#[0-9a-fA-F]{6}$");
  private static final String FALLBACK_COLOR = "#b829ff";

  @Value("${application.frontend.url}")
  private String frontendUrl;

  // ── monthly ───────────────────────────────────────────────────────────────

  public String monthlyEmailBody(
      String username, YearMonth period, List<WalletMonthlyReport> reports) {
    StringBuilder highlights = new StringBuilder();
    for (WalletMonthlyReport r : reports) {
      highlights.append(emailHighlightRow(r));
    }
    return load("templates/email/monthlyReportEmail.html")
        .replace("{{period}}", monthLabel(period))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{appUrl}}", frontendUrl)
        .replace("{{highlights}}", highlights.toString());
  }

  public String monthlyPdfHtml(String username, YearMonth period, List<WalletMonthlyReport> reports) {
    StringBuilder sections = new StringBuilder();
    for (WalletMonthlyReport r : reports) {
      sections.append(monthlySection(r));
    }
    return load("templates/report/monthlyReportPdf.html")
        .replace("{{period}}", monthLabel(period))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{walletSections}}", sections.toString());
  }

  private String emailHighlightRow(WalletMonthlyReport r) {
    String netClass = r.totals().net().signum() < 0 ? "#dc2626" : "#059669";
    return """
        <div style="display:flex; justify-content:space-between; padding:10px 12px; \
        border:1px solid #e2e8f0; border-left:4px solid %s; border-radius:8px; margin-bottom:8px;">\
        <span style="font-weight:600;">%s</span>\
        <span style="font-weight:700; color:%s;">%s</span></div>"""
        .formatted(
            sanitizeHexColor(r.walletColor()),
            HtmlUtils.htmlEscape(r.walletName()),
            netClass,
            formatAmount(r.totals().net(), r.currency()));
  }

  private String monthlySection(WalletMonthlyReport r) {
    StringBuilder s = new StringBuilder();
    s.append("<div class=\"wallet\">");
    s.append("<h2 style=\"border-left-color:")
        .append(sanitizeHexColor(r.walletColor()))
        .append(";\">")
        .append(HtmlUtils.htmlEscape(r.walletName()))
        .append("</h2>");
    s.append("<table class=\"kpi\">");
    s.append(kpiRow("Income", r.totals().income(), r.previousTotals() == null ? null : r.previousTotals().income(), r.currency(), false));
    s.append(kpiRow("Expenses", r.totals().expense(), r.previousTotals() == null ? null : r.previousTotals().expense(), r.currency(), false));
    s.append(kpiRow("Net", r.totals().net(), r.previousTotals() == null ? null : r.previousTotals().net(), r.currency(), true));
    s.append(kpiRow("Balance at end of month", r.endBalance(), null, r.currency(), true));
    s.append("</table>");
    s.append(categoryBlock("Top expense categories", r.topExpenseCategories(), r.currency(), "#dc2626"));
    s.append(categoryBlock("Top income categories", r.topIncomeCategories(), r.currency(), "#059669"));
    s.append("</div>");
    return s.toString();
  }

  // ── shared fragment helpers (also used by the yearly builder in Task 7) ───

  String kpiRow(String label, BigDecimal value, BigDecimal previous, String currency, boolean signed) {
    String cls = signed ? (value.signum() < 0 ? " neg" : " pos") : "";
    StringBuilder row = new StringBuilder();
    row.append("<tr><td class=\"label\">")
        .append(label)
        .append("</td><td class=\"amount")
        .append(cls)
        .append("\">")
        .append(formatAmount(value, currency));
    if (previous != null) {
      BigDecimal diff = value.subtract(previous);
      row.append("<div class=\"delta\">")
          .append(diff.signum() >= 0 ? "+" : "")
          .append(formatAmount(diff, currency))
          .append(" vs previous month</div>");
    }
    row.append("</td></tr>");
    return row.toString();
  }

  String categoryBlock(String title, List<CategoryTotal> categories, String currency, String barColor) {
    if (categories.isEmpty()) return "";
    StringBuilder s = new StringBuilder("<h3>").append(title).append("</h3>");
    for (CategoryTotal c : categories) {
      s.append("<div class=\"catrow\"><span class=\"catname\">")
          .append(HtmlUtils.htmlEscape(c.name()))
          .append("</span><span class=\"barwrap\"><span class=\"bar\" style=\"display:block; width:")
          .append(Math.max(2, Math.min(100, (int) Math.round(c.percentOfTotal()))))
          .append("%; background:")
          .append(barColor)
          .append(";\"></span></span><span class=\"catamount\">")
          .append(formatAmount(c.amount(), currency))
          .append(" · ")
          .append(String.format(Locale.ENGLISH, "%.1f", c.percentOfTotal()))
          .append("%</span></div>");
    }
    return s.toString();
  }

  static String monthLabel(YearMonth period) {
    return period.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + period.getYear();
  }

  static String formatAmount(BigDecimal amount, String currency) {
    NumberFormat nf = NumberFormat.getNumberInstance(Locale.ENGLISH);
    nf.setMinimumFractionDigits(2);
    nf.setMaximumFractionDigits(2);
    return nf.format(amount) + " " + (currency == null ? "" : currency);
  }

  static String sanitizeHexColor(String color) {
    return color != null && HEX_COLOR.matcher(color).matches() ? color : FALLBACK_COLOR;
  }

  String load(String path) {
    try {
      return new String(
          new ClassPathResource(path).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IllegalStateException("Error loading report template " + path, e);
    }
  }
}
```
Test setup note: `frontendUrl` is a `@Value` field — in the unit test set it with `ReflectionTestUtils.setField(builder, "frontendUrl", "http://localhost:5173")` in a `@BeforeEach` (add it to the test class from Step 1).

- [ ] **Step 5: Run** — `./gradlew test --tests "*.ReportHtmlBuilderTest"` → PASS. Then:

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): monthly email + PDF templates and HTML builder"
```

---

### Task 7: Yearly wrap-up templates + builder methods

**Files:**
- Create: `backend/src/main/resources/templates/email/yearlyReportEmail.html`
- Create: `backend/src/main/resources/templates/report/yearlyReportPdf.html`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportHtmlBuilder.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportHtmlBuilderTest.java` (append)

**Interfaces:**
- Consumes: `WalletYearlyReport` (Task 4), fragment helpers from Task 6.
- Produces: `ReportHtmlBuilder.yearlyEmailBody(String username, int year, List<WalletYearlyReport> reports): String` and `ReportHtmlBuilder.yearlyPdfHtml(String username, int year, List<WalletYearlyReport> reports): String`.

- [ ] **Step 1: Write the failing tests** — append to `ReportHtmlBuilderTest`:

```java
  private static WalletYearlyReport yearlyReport() {
    java.util.List<MonthRow> months = new java.util.ArrayList<>();
    for (int m = 1; m <= 12; m++) {
      months.add(
          new MonthRow(
              YearMonth.of(2025, m),
              new BigDecimal("100.00"),
              new BigDecimal("50.00"),
              new BigDecimal("50.00"),
              m == 3 ? 9 : 1));
    }
    return new WalletYearlyReport(
        "Main",
        "#8b5cf6",
        "EUR",
        2025,
        new PeriodTotals(
            new BigDecimal("1200.00"), new BigDecimal("600.00"), new BigDecimal("600.00")),
        null,
        months,
        YearMonth.of(2025, 1),
        YearMonth.of(2025, 12),
        List.of(new CategoryTotal("Food", new BigDecimal("300.00"), 50.0, new BigDecimal("250.00"))),
        List.of(),
        new YearRecords(
            "laptop",
            java.time.LocalDate.of(2025, 4, 2),
            new BigDecimal("950.00"),
            java.time.LocalDate.of(2025, 11, 28),
            new BigDecimal("1000.00"),
            YearMonth.of(2025, 3),
            9,
            20,
            "Food",
            new BigDecimal("50.00")),
        20);
  }

  @Test
  void yearlyPdfHtml_ContainsMonthTableRecordsAndNoTokens() {
    String html = builder.yearlyPdfHtml("nicola", 2025, List.of(yearlyReport()));

    assertTrue(html.contains("2025"));
    assertTrue(html.contains("laptop"));
    assertTrue(html.contains("March")); // month rows + most-active month
    assertFalse(html.contains("{{"));
  }

  @Test
  void yearlyEmailBody_NoLeftoverTokens() {
    String html = builder.yearlyEmailBody("nicola", 2025, List.of(yearlyReport()));

    assertTrue(html.contains("2025"));
    assertFalse(html.contains("{{"));
  }

  @Test
  void yearlyPdfHtml_IsRenderable() {
    byte[] pdf =
        new ReportPdfRenderer().render(builder.yearlyPdfHtml("nicola", 2025, List.of(yearlyReport())));
    assertTrue(pdf.length > 500);
  }
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.ReportHtmlBuilderTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Create templates + implement**

`templates/email/yearlyReportEmail.html` — copy `monthlyReportEmail.html` and change: `<title>FinanceWebApp - Yearly Wrap</title>`, `<h1>Your {{year}} wrap-up is here 🎉</h1>`, intro sentence `Hi <strong>{{username}}</strong>, your year in money — best months, top categories and records. The full wrap-up is attached as a PDF.`, and replace the token `{{period}}` with `{{year}}` everywhere. The `{{highlights}}` / `{{appUrl}}` blocks stay identical.

`templates/report/yearlyReportPdf.html` — copy `monthlyReportPdf.html`, change the heading block to:
```html
    <h1>Yearly Wrap — {{year}}</h1>
    <p class="sub">Prepared for {{username}} · FinanceWebApp</p>
    {{walletSections}}
```
and append these style rules to the `<style>` block:
```css
        table.months { width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; font-size: 10px; }
        table.months th { text-align: left; color: #718096; text-transform: uppercase; font-size: 8px; letter-spacing: 1px; padding: 4px 6px; border-bottom: 1px solid #e2e8f0; }
        table.months td { padding: 4px 6px; border-bottom: 1px solid #edf2f7; }
        tr.best td { background: #ecfdf5; } tr.worst td { background: #fef2f2; }
        .records { margin-top: 10px; }
        .record { display: inline-block; width: 31%; margin: 0 1% 8px 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; vertical-align: top; }
        .record .label { display: block; margin-bottom: 3px; }
        .record .value { font-weight: bold; font-size: 12px; }
```

Append to `ReportHtmlBuilder.java`:
```java
  // ── yearly ────────────────────────────────────────────────────────────────

  public String yearlyEmailBody(String username, int year, List<WalletYearlyReport> reports) {
    StringBuilder highlights = new StringBuilder();
    for (WalletYearlyReport r : reports) {
      highlights.append(yearlyHighlightRow(r));
    }
    return load("templates/email/yearlyReportEmail.html")
        .replace("{{year}}", String.valueOf(year))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{appUrl}}", frontendUrl)
        .replace("{{highlights}}", highlights.toString());
  }

  public String yearlyPdfHtml(String username, int year, List<WalletYearlyReport> reports) {
    StringBuilder sections = new StringBuilder();
    for (WalletYearlyReport r : reports) {
      sections.append(yearlySection(r));
    }
    return load("templates/report/yearlyReportPdf.html")
        .replace("{{year}}", String.valueOf(year))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{walletSections}}", sections.toString());
  }

  private String yearlyHighlightRow(WalletYearlyReport r) {
    String netColor = r.totals().net().signum() < 0 ? "#dc2626" : "#059669";
    return """
        <div style="display:flex; justify-content:space-between; padding:10px 12px; \
        border:1px solid #e2e8f0; border-left:4px solid %s; border-radius:8px; margin-bottom:8px;">\
        <span style="font-weight:600;">%s</span>\
        <span style="font-weight:700; color:%s;">%s</span></div>"""
        .formatted(
            sanitizeHexColor(r.walletColor()),
            HtmlUtils.htmlEscape(r.walletName()),
            netColor,
            formatAmount(r.totals().net(), r.currency()));
  }

  private String yearlySection(WalletYearlyReport r) {
    StringBuilder s = new StringBuilder();
    s.append("<div class=\"wallet\">");
    s.append("<h2 style=\"border-left-color:")
        .append(sanitizeHexColor(r.walletColor()))
        .append(";\">")
        .append(HtmlUtils.htmlEscape(r.walletName()))
        .append("</h2>");
    s.append("<table class=\"kpi\">");
    s.append(yearKpiRow("Income", r.totals().income(), r.previousTotals() == null ? null : r.previousTotals().income(), r.currency(), false));
    s.append(yearKpiRow("Expenses", r.totals().expense(), r.previousTotals() == null ? null : r.previousTotals().expense(), r.currency(), false));
    s.append(yearKpiRow("Net", r.totals().net(), r.previousTotals() == null ? null : r.previousTotals().net(), r.currency(), true));
    s.append("</table>");
    s.append(monthTable(r));
    s.append(categoryBlock("Top expense categories", r.topExpenseCategories(), r.currency(), "#dc2626"));
    s.append(categoryBlock("Top income categories", r.topIncomeCategories(), r.currency(), "#059669"));
    s.append(recordsBlock(r.records(), r.currency()));
    s.append("</div>");
    return s.toString();
  }

  /** Same as kpiRow but the delta line reads "vs previous year". */
  private String yearKpiRow(
      String label, BigDecimal value, BigDecimal previous, String currency, boolean signed) {
    return kpiRow(label, value, previous, currency, signed)
        .replace("vs previous month", "vs previous year");
  }

  private String monthTable(WalletYearlyReport r) {
    StringBuilder s =
        new StringBuilder(
            "<h3>Month by month</h3><table class=\"months\">"
                + "<tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr>");
    for (MonthRow m : r.months()) {
      String cls =
          m.month().equals(r.bestMonth()) ? " class=\"best\""
              : m.month().equals(r.worstMonth()) ? " class=\"worst\"" : "";
      s.append("<tr").append(cls).append("><td>")
          .append(m.month().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
          .append("</td><td>").append(formatAmount(m.income(), r.currency()))
          .append("</td><td>").append(formatAmount(m.expense(), r.currency()))
          .append("</td><td>").append(formatAmount(m.net(), r.currency()))
          .append("</td></tr>");
    }
    s.append("</table>");
    return s.toString();
  }

  private String recordsBlock(YearRecords rec, String currency) {
    StringBuilder s = new StringBuilder("<h3>Records &amp; fun facts</h3><div class=\"records\">");
    if (rec.biggestExpenseName() != null) {
      s.append(record("Biggest expense",
          HtmlUtils.htmlEscape(rec.biggestExpenseName()) + " — "
              + formatAmount(rec.biggestExpenseAmount(), currency)));
      s.append(record("Most expensive day",
          rec.mostExpensiveDay() + " — " + formatAmount(rec.mostExpensiveDayTotal(), currency)));
    }
    if (rec.mostActiveMonth() != null) {
      s.append(record("Most active month",
          rec.mostActiveMonth().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
              + " — " + rec.mostActiveMonthCount() + " transactions"));
    }
    s.append(record("Total transactions", String.valueOf(rec.totalTransactions())));
    if (rec.fastestGrowingCategory() != null) {
      s.append(record("Fastest growing category",
          HtmlUtils.htmlEscape(rec.fastestGrowingCategory()) + " (+"
              + formatAmount(rec.fastestGrowingIncrease(), currency) + ")"));
    }
    s.append("</div>");
    return s.toString();
  }

  private static String record(String label, String value) {
    return "<span class=\"record\"><span class=\"label\">" + label + "</span><span class=\"value\">"
        + value + "</span></span>";
  }
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.ReportHtmlBuilderTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): yearly wrap-up templates and builder"
```

---

## Phase 4 — Preferences, email sending, orchestration, jobs

### Task 8: User report preferences (backend)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/User.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/NotificationPrefsRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/UserProfileResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/UserMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/UserService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/UserController.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/UserServiceTest.java`, `backend/src/test/java/dev/busato/FinanceWebApp/backend/mappers/UserMapperTest.java` (append to both)

**Interfaces:**
- Produces: `User.isMonthlyReportEnabled()/isYearlyReportEnabled()` (default **true**); `PUT /api/users/me/notifications` body `{"monthlyReportEnabled": bool, "yearlyReportEnabled": bool}` → `UserProfileResponse` (which now carries both booleans); `UserService.updateNotificationPrefs(User, boolean, boolean): User`.

- [ ] **Step 1: Write the failing tests**

Append to `UserServiceTest` (it already has `@Mock UserRepository userRepository` + `@InjectMocks UserService` — reuse the existing setup):
```java
  @Test
  void updateNotificationPrefs_SavesBothFlags() {
    User user = User.builder().username("nicola").email("n@x.com").password("pw").build();
    when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

    User updated = userService.updateNotificationPrefs(user, false, true);

    assertFalse(updated.isMonthlyReportEnabled());
    assertTrue(updated.isYearlyReportEnabled());
    verify(userRepository).save(user);
  }
```

Append to `UserMapperTest`:
```java
  @Test
  void toProfileResponse_CarriesReportPrefs() {
    User user =
        User.builder()
            .username("nicola")
            .email("nicola@example.com")
            .password("pw")
            .monthlyReportEnabled(false)
            .yearlyReportEnabled(true)
            .build();

    UserProfileResponse resp = userMapper.toProfileResponse(user);

    assertFalse(resp.isMonthlyReportEnabled());
    assertTrue(resp.isYearlyReportEnabled());
  }
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.UserServiceTest" --tests "*.UserMapperTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Implement**

`User.java` — add after `tokenVersion` (the `columnDefinition` default is REQUIRED: `ddl-auto=update` must backfill existing rows — same pattern as `tokenVersion`):
```java
  /** Opt-in for the monthly summary report email (default on; demo users are always excluded). */
  @Column(nullable = false, columnDefinition = "boolean default true")
  @Builder.Default
  private boolean monthlyReportEnabled = true;

  /** Opt-in for the yearly wrap-up report email (default on; demo users are always excluded). */
  @Column(nullable = false, columnDefinition = "boolean default true")
  @Builder.Default
  private boolean yearlyReportEnabled = true;
```

`NotificationPrefsRequest.java`:
```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotNull;

/** Body of PUT /api/users/me/notifications. */
public record NotificationPrefsRequest(
    @NotNull Boolean monthlyReportEnabled, @NotNull Boolean yearlyReportEnabled) {}
```

`UserProfileResponse.java` — add fields:
```java
  private boolean monthlyReportEnabled;
  private boolean yearlyReportEnabled;
```

`UserMapper.toProfileResponse` — add to the builder chain:
```java
        .monthlyReportEnabled(user.isMonthlyReportEnabled())
        .yearlyReportEnabled(user.isYearlyReportEnabled())
```

`UserService.java` — add:
```java
  /** Updates the report-notification opt-ins shown in the settings Notifications section. */
  public User updateNotificationPrefs(User user, boolean monthlyEnabled, boolean yearlyEnabled) {
    user.setMonthlyReportEnabled(monthlyEnabled);
    user.setYearlyReportEnabled(yearlyEnabled);
    return userRepository.save(user);
  }
```

`UserController.java` — add endpoint (import `NotificationPrefsRequest`):
```java
  /** Updates the report-notification preferences. Returns the refreshed (masked) profile. */
  @PutMapping("/me/notifications")
  @PreAuthorize("@walletSecurity.preventPatAccess()")
  public ResponseEntity<UserProfileResponse> updateNotificationPrefs(
      @AuthenticationPrincipal User user, @Valid @RequestBody NotificationPrefsRequest request) {
    User updated =
        userService.updateNotificationPrefs(
            user, request.monthlyReportEnabled(), request.yearlyReportEnabled());
    return ResponseEntity.ok(userMapper.toProfileResponse(updated));
  }
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.UserServiceTest" --tests "*.UserMapperTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(user): monthly/yearly report opt-in preferences + PUT /users/me/notifications"
```

---

### Task 9: `SendEmailService.sendReportEmail` (PDF attachment)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SendEmailService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/SendEmailServiceTest.java` (append)

**Interfaces:**
- Produces: `SendEmailService.sendReportEmail(String to, String subject, String bodyHtml, String attachmentName, byte[] pdfBytes)` — throws `MessagingException`/`UnsupportedEncodingException` like its siblings.

- [ ] **Step 1: Write the failing test** — append to `SendEmailServiceTest` (class already mocks `mailSender`/`mimeMessage`; the mocked `MimeMessage` can't capture parts, so use a real one for this test):

```java
  @Test
  void sendReportEmail_SendsMultipartWithPdfAttachment() throws Exception {
    MimeMessage real =
        new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage();
    org.mockito.Mockito.when(mailSender.createMimeMessage()).thenReturn(real);

    sendEmailService.sendReportEmail(
        "user@example.com", "Your June 2026 report", "<p>hi</p>", "report.pdf", "%PDF-fake".getBytes());

    verify(mailSender).send(real);
    assertEquals("Your June 2026 report", real.getSubject());
    assertTrue(real.getContentType().toLowerCase().contains("multipart"));
  }
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.SendEmailServiceTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Implement** — append to `SendEmailService` (import `org.springframework.core.io.ByteArrayResource` is already there):

```java
  /**
   * Sends a periodic report: short HTML body + the full report attached as PDF. The body/subject
   * are fully built by ReportHtmlBuilder (already escaped) — this method only ships them.
   */
  public void sendReportEmail(
      String to, String subject, String bodyHtml, String attachmentName, byte[] pdfBytes)
      throws MessagingException, UnsupportedEncodingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(bodyHtml, true);
    helper.addAttachment(attachmentName, new ByteArrayResource(pdfBytes), "application/pdf");

    mailSender.send(message);
  }
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.SendEmailServiceTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(mail): report email with PDF attachment"
```

---

### Task 10: `ReportService` orchestrator

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportServiceTest.java`

**Interfaces:**
- Consumes: `UserRepository.findAll()`, `WalletAccessRepository.findAllByUserIdAndStatus(UUID, InvitationStatus.ACCEPTED)` (→ `WalletAccess.getWallet()`), `TransactionRepository.getAllByWalletId(UUID)`, `ReportAggregator`, `ReportHtmlBuilder`, `ReportPdfRenderer`, `SendEmailService.sendReportEmail`.
- Produces: `ReportService.sendMonthlyReports(YearMonth period): String` and `sendYearlyReports(int year): String` — return the JobRun summary message `"sent N, skipped N (no data), failed N"`.

Rules (spec): demo users and pref-off users are silently ignored (not counted); a user whose wallets all have 0 transactions in the period counts as **skipped**; a per-user exception increments **failed** and never aborts the batch.

- [ ] **Step 1: Write the failing tests** — `ReportServiceTest.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.model.WalletAccess.InvitationStatus;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private ReportAggregator aggregator;
  @Mock private ReportHtmlBuilder htmlBuilder;
  @Mock private ReportPdfRenderer pdfRenderer;
  @Mock private SendEmailService sendEmailService;

  @InjectMocks private ReportService reportService;

  private final YearMonth period = YearMonth.of(2026, 6);
  private User user;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    user = User.builder().id(UUID.randomUUID()).username("nicola").email("n@x.com").password("p").build();
    wallet = Wallet.builder().id(UUID.randomUUID()).name("Main").currency("EUR").build();
  }

  private void wireHappyPath(int txCount) {
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(walletAccessRepository.findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));
    when(transactionRepository.getAllByWalletId(wallet.getId())).thenReturn(List.of());
    when(aggregator.monthly(eq(wallet), anyList(), eq(period)))
        .thenReturn(
            new WalletMonthlyReport(
                "Main", null, "EUR", period,
                new PeriodTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                null, BigDecimal.ZERO, List.of(), List.of(), txCount));
  }

  @Test
  void sendMonthlyReports_SendsEmailWithPdf() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(eq("nicola"), eq(period), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(eq("nicola"), eq(period), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render("<pdf/>")).thenReturn("%PDF".getBytes());

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 1, skipped 0 (no data), failed 0", summary);
    verify(sendEmailService)
        .sendReportEmail(
            eq("n@x.com"),
            eq("Your FinanceWebApp report for June 2026"),
            eq("<body/>"),
            eq("FinanceWebApp-Report-2026-06.pdf"),
            any(byte[].class));
  }

  @Test
  void sendMonthlyReports_SkipsUserWithNoData() throws Exception {
    wireHappyPath(0); // wallet exists but empty period

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 1 (no data), failed 0", summary);
    verify(sendEmailService, never()).sendReportEmail(any(), any(), any(), any(), any());
  }

  @Test
  void sendMonthlyReports_IgnoresDemoAndOptedOutUsers() throws Exception {
    User demo = User.builder().id(UUID.randomUUID()).username("d").email("d@x.com").password("p").demo(true).build();
    User optedOut = User.builder().id(UUID.randomUUID()).username("o").email("o@x.com").password("p").monthlyReportEnabled(false).build();
    when(userRepository.findAll()).thenReturn(List.of(demo, optedOut));

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 0 (no data), failed 0", summary);
    verifyNoInteractions(sendEmailService);
  }

  @Test
  void sendMonthlyReports_OneFailureDoesNotAbortBatch() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(any(), any(), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(any(), any(), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render(any())).thenReturn("%PDF".getBytes());
    doThrow(new RuntimeException("smtp down"))
        .when(sendEmailService)
        .sendReportEmail(any(), any(), any(), any(), any());

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 0 (no data), failed 1", summary);
  }

  @Test
  void sendYearlyReports_SendsWrapEmail() throws Exception {
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(walletAccessRepository.findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));
    when(transactionRepository.getAllByWalletId(wallet.getId())).thenReturn(List.of());
    when(aggregator.yearly(eq(wallet), anyList(), eq(2025)))
        .thenReturn(
            new WalletYearlyReport(
                "Main", null, "EUR", 2025,
                new PeriodTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                null, List.of(), null, null, List.of(), List.of(),
                new YearRecords(null, null, null, null, null, null, 0, 5, null, null), 5));
    when(htmlBuilder.yearlyEmailBody(eq("nicola"), eq(2025), anyList())).thenReturn("<body/>");
    when(htmlBuilder.yearlyPdfHtml(eq("nicola"), eq(2025), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render("<pdf/>")).thenReturn("%PDF".getBytes());

    String summary = reportService.sendYearlyReports(2025);

    assertEquals("sent 1, skipped 0 (no data), failed 0", summary);
    verify(sendEmailService)
        .sendReportEmail(
            eq("n@x.com"),
            eq("Your 2025 FinanceWebApp wrap-up"),
            eq("<body/>"),
            eq("FinanceWebApp-Wrap-2025.pdf"),
            any(byte[].class));
  }
}
```
- [ ] **Step 2: Run** — `./gradlew test --tests "*.ReportServiceTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Implement** — `ReportService.java`:

```java
package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.model.WalletAccess.InvitationStatus;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Builds and sends the periodic summary reports (one email per user, one section per ACCEPTED
 * wallet with data). Per-user failures are counted, logged and never abort the batch; the returned
 * string becomes the JobRun history message.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final TransactionRepository transactionRepository;
  private final ReportAggregator aggregator;
  private final ReportHtmlBuilder htmlBuilder;
  private final ReportPdfRenderer pdfRenderer;
  private final SendEmailService sendEmailService;

  public String sendMonthlyReports(YearMonth period) {
    return sendAll(
        User::isMonthlyReportEnabled,
        user -> {
          List<WalletMonthlyReport> reports = new ArrayList<>();
          for (Wallet wallet : acceptedWallets(user)) {
            WalletMonthlyReport r =
                aggregator.monthly(
                    wallet, transactionRepository.getAllByWalletId(wallet.getId()), period);
            if (r.transactionCount() > 0) reports.add(r);
          }
          if (reports.isEmpty()) return false;
          byte[] pdf =
              pdfRenderer.render(htmlBuilder.monthlyPdfHtml(user.getUsername(), period, reports));
          sendEmailService.sendReportEmail(
              user.getEmail(),
              "Your FinanceWebApp report for " + ReportHtmlBuilder.monthLabel(period),
              htmlBuilder.monthlyEmailBody(user.getUsername(), period, reports),
              "FinanceWebApp-Report-" + period + ".pdf",
              pdf);
          return true;
        });
  }

  public String sendYearlyReports(int year) {
    return sendAll(
        User::isYearlyReportEnabled,
        user -> {
          List<WalletYearlyReport> reports = new ArrayList<>();
          for (Wallet wallet : acceptedWallets(user)) {
            WalletYearlyReport r =
                aggregator.yearly(
                    wallet, transactionRepository.getAllByWalletId(wallet.getId()), year);
            if (r.transactionCount() > 0) reports.add(r);
          }
          if (reports.isEmpty()) return false;
          byte[] pdf =
              pdfRenderer.render(htmlBuilder.yearlyPdfHtml(user.getUsername(), year, reports));
          sendEmailService.sendReportEmail(
              user.getEmail(),
              "Your " + year + " FinanceWebApp wrap-up",
              htmlBuilder.yearlyEmailBody(user.getUsername(), year, reports),
              "FinanceWebApp-Wrap-" + year + ".pdf",
              pdf);
          return true;
        });
  }

  /** Shared batch loop: opt-in filter → build+send (true = sent, false = no data). */
  private String sendAll(Predicate<User> optedIn, SendForUser sender) {
    int sent = 0;
    int skipped = 0;
    int failed = 0;
    for (User user : userRepository.findAll()) {
      if (user.isDemo() || !optedIn.test(user)) continue;
      try {
        if (sender.send(user)) sent++;
        else skipped++;
      } catch (Exception e) {
        failed++;
        log.error("[Reports] report failed for user {}: {}", user.getId(), e.getMessage(), e);
      }
    }
    return "sent %d, skipped %d (no data), failed %d".formatted(sent, skipped, failed);
  }

  private List<Wallet> acceptedWallets(User user) {
    return walletAccessRepository
        .findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED)
        .stream()
        .map(WalletAccess::getWallet)
        .toList();
  }

  @FunctionalInterface
  private interface SendForUser {
    boolean send(User user) throws Exception;
  }
}
```

- [ ] **Step 4: Run** — `./gradlew test --tests "*.ReportServiceTest"` → PASS.

- [ ] **Step 5: Commit**

```bash
cd backend && ./gradlew spotlessApply
git add -A backend && git commit -m "feat(report): ReportService batch orchestration (monthly + yearly)"
```

---

### Task 11: `MonthlyReportCronJob` + `YearlyReportCronJob`

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/CronJob/MonthlyReportCronJob.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/CronJob/YearlyReportCronJob.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/CronJob/MonthlyReportCronJobTest.java`, `.../YearlyReportCronJobTest.java`

**Interfaces:**
- Consumes: `ReportService` (Task 10), `ManagedJob.ScheduleDefaults` 6-arg form (Task 1). Jobs self-register via `@Component` — no other wiring.
- Produces: job keys `monthly-report` (defaults MONTHLY, day 1, 07:00) and `yearly-report` (defaults YEARLY, Jan 1, 07:30).

- [ ] **Step 1: Write the failing tests** (mirror `SubscriptionCronJobTest`):

`MonthlyReportCronJobTest.java`:
```java
package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MonthlyReportCronJobTest {

  @Mock private ReportService reportService;

  @InjectMocks private MonthlyReportCronJob job;

  @Test
  void run_CoversPreviousMonth_ReturnsServiceSummary() {
    when(reportService.sendMonthlyReports(YearMonth.now().minusMonths(1)))
        .thenReturn("sent 2, skipped 0 (no data), failed 0");

    assertEquals("sent 2, skipped 0 (no data), failed 0", job.run());
    verify(reportService).sendMonthlyReports(YearMonth.now().minusMonths(1));
  }

  @Test
  void metadata_IsStable() {
    assertEquals("monthly-report", job.key());
    assertEquals("Monthly Report Email", job.displayName());
    assertTrue(job.available());
    assertEquals(JobFrequency.MONTHLY, job.defaults().frequency());
    assertEquals(7, job.defaults().hour());
    assertEquals(0, job.defaults().minute());
    assertEquals(1, job.defaults().dayOfMonth());
  }
}
```

`YearlyReportCronJobTest.java`:
```java
package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import java.time.Year;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class YearlyReportCronJobTest {

  @Mock private ReportService reportService;

  @InjectMocks private YearlyReportCronJob job;

  @Test
  void run_CoversPreviousYear_ReturnsServiceSummary() {
    int previousYear = Year.now().getValue() - 1;
    when(reportService.sendYearlyReports(previousYear)).thenReturn("sent 1, skipped 0 (no data), failed 0");

    assertEquals("sent 1, skipped 0 (no data), failed 0", job.run());
    verify(reportService).sendYearlyReports(previousYear);
  }

  @Test
  void metadata_IsStable() {
    assertEquals("yearly-report", job.key());
    assertEquals("Yearly Wrap-up Email", job.displayName());
    assertEquals(JobFrequency.YEARLY, job.defaults().frequency());
    assertEquals(7, job.defaults().hour());
    assertEquals(30, job.defaults().minute());
    assertEquals(1, job.defaults().dayOfMonth());
    assertEquals(1, job.defaults().monthOfYear());
  }
}
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*ReportCronJobTest"` → COMPILE ERROR = red.

- [ ] **Step 3: Implement**

`MonthlyReportCronJob.java`:
```java
package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Emails every opted-in user the monthly summary report. Covers the previous calendar month,
 * derived from the execution date — so the admin "Run now" re-sends the last closed month.
 */
@Component
@RequiredArgsConstructor
public class MonthlyReportCronJob implements ManagedJob {

  private final ReportService reportService;

  @Override
  public String key() {
    return "monthly-report";
  }

  @Override
  public String displayName() {
    return "Monthly Report Email";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.MONTHLY, 7, 0, null, 1, null);
  }

  @Override
  public String run() {
    return reportService.sendMonthlyReports(YearMonth.now().minusMonths(1));
  }
}
```

`YearlyReportCronJob.java`:
```java
package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.Year;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Emails every opted-in user the yearly wrap-up. Covers the previous calendar year, derived from
 * the execution date — the admin "Run now" re-sends the last closed year.
 */
@Component
@RequiredArgsConstructor
public class YearlyReportCronJob implements ManagedJob {

  private final ReportService reportService;

  @Override
  public String key() {
    return "yearly-report";
  }

  @Override
  public String displayName() {
    return "Yearly Wrap-up Email";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.YEARLY, 7, 30, null, 1, 1);
  }

  @Override
  public String run() {
    return reportService.sendYearlyReports(Year.now().getValue() - 1);
  }
}
```

- [ ] **Step 4: Run the full backend suite + coverage gate**

Run: `cd backend && ./gradlew check`
Expected: PASS (Spotless clean, tests green, line coverage ≥ 90%). If coverage dips, the untested lines will be in `ReportHtmlBuilder`/`ReportService` — extend their tests rather than excluding anything.

- [ ] **Step 5: Commit**

```bash
git add -A backend && git commit -m "feat(report): monthly-report and yearly-report managed jobs"
```

---

## Phase 5 — Settings “Notifications” section

### Task 12: `NotificationsSection` + registry entry

**Files:**
- Create: `frontend/src/settings/sections/NotificationsSection.tsx`
- Modify: `frontend/src/settings/sections.ts`
- Modify: `frontend/src/settings/SettingsPage.tsx`
- Test: `frontend/src/__tests__/settings/sections/NotificationsSection.test.tsx`

**Interfaces:**
- Consumes: `GET /users/me` (profile now includes `monthlyReportEnabled`/`yearlyReportEnabled`, Task 8), `PUT /users/me/notifications`; `components/ui/Card`, `components/ui/Toggle`, `triggerToast`, `getApiErrorDetail`.
- Produces: settings section id `notifications` (deep-linkable as `/settings#notifications` — the report emails link here).

- [ ] **Step 1: Write the failing test** — `frontend/src/__tests__/settings/sections/NotificationsSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationsSection } from "../../../settings/sections/NotificationsSection";
import api from "../../../api/axiosConfig";

vi.mock("../../../api/axiosConfig", () => ({
  default: { get: vi.fn(), put: vi.fn() },
}));

const mockedApi = vi.mocked(api, true);

describe("NotificationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.get.mockResolvedValue({
      data: { monthlyReportEnabled: true, yearlyReportEnabled: false },
    });
    mockedApi.put.mockResolvedValue({
      data: { monthlyReportEnabled: false, yearlyReportEnabled: false },
    });
  });

  it("renders both toggles from the fetched profile", async () => {
    render(<NotificationsSection />);

    const monthly = await screen.findByRole("switch", { name: /monthly report/i });
    const yearly = screen.getByRole("switch", { name: /yearly wrap-up/i });
    expect(monthly).toHaveAttribute("aria-checked", "true");
    expect(yearly).toHaveAttribute("aria-checked", "false");
  });

  it("flipping a toggle PUTs both current values", async () => {
    const user = userEvent.setup();
    render(<NotificationsSection />);

    await user.click(await screen.findByRole("switch", { name: /monthly report/i }));

    await waitFor(() =>
      expect(mockedApi.put).toHaveBeenCalledWith("/users/me/notifications", {
        monthlyReportEnabled: false,
        yearlyReportEnabled: false,
      }),
    );
  });
});
```

- [ ] **Step 2: Run** — `cd frontend && npx vitest run src/__tests__/settings/sections/NotificationsSection.test.tsx` → FAIL (module not found).

- [ ] **Step 3: Implement**

`frontend/src/settings/sections/NotificationsSection.tsx`:
```tsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";

interface ReportPrefs {
  monthlyReportEnabled: boolean;
  yearlyReportEnabled: boolean;
}

const Row: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}> = ({ title, description, checked, onChange, ariaLabel, disabled }) => (
  <div className="flex items-center justify-between gap-4 bg-app-input px-4 py-3">
    <div className="min-w-0">
      <p className="m-0 text-sm font-semibold text-app-text">{title}</p>
      <p className="m-0 mt-0.5 text-xs text-app-muted">{description}</p>
    </div>
    <Toggle
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  </div>
);

export const NotificationsSection: React.FC = () => {
  const [prefs, setPrefs] = useState<ReportPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users/me");
        setPrefs({
          monthlyReportEnabled: res.data.monthlyReportEnabled,
          yearlyReportEnabled: res.data.yearlyReportEnabled,
        });
      } catch (err: unknown) {
        triggerToast(getApiErrorDetail(err, "Failed to load preferences"), false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (next: ReportPrefs) => {
    if (!prefs) return;
    const previous = prefs;
    setPrefs(next); // optimistic
    setSaving(true);
    try {
      await api.put("/users/me/notifications", next);
    } catch (err: unknown) {
      setPrefs(previous);
      triggerToast(getApiErrorDetail(err, "Failed to update preferences"), false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      {loading || !prefs ? (
        <div className="flex items-center justify-center py-10">
          <FontAwesomeIcon icon={faSpinner} spin className="text-app-muted" />
        </div>
      ) : (
        <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] border border-app-border">
          <Row
            title="Monthly report"
            description="A summary of every wallet, emailed at the start of each month with a PDF attached."
            checked={prefs.monthlyReportEnabled}
            disabled={saving}
            ariaLabel="Monthly report email"
            onChange={(v) => save({ ...prefs, monthlyReportEnabled: v })}
          />
          <Row
            title="Yearly wrap-up"
            description="Your year in money — best months, top categories and records, every January."
            checked={prefs.yearlyReportEnabled}
            disabled={saving}
            ariaLabel="Yearly wrap-up email"
            onChange={(v) => save({ ...prefs, yearlyReportEnabled: v })}
          />
        </div>
      )}
    </Card>
  );
};
```

`sections.ts` — import `faBell` from `@fortawesome/free-solid-svg-icons` and insert between `tokens` and `about`:
```ts
  {
    id: "notifications",
    label: "Notifications",
    icon: faBell,
    description: "Monthly and yearly report emails",
  },
```

`SettingsPage.tsx` — import `NotificationsSection` and add to the render switch (after the `tokens` line):
```tsx
                {s.id === "notifications" && <NotificationsSection />}
```

- [ ] **Step 4: Verify** — `cd frontend && npm run lint && npm test && npm run build` → all green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings frontend/src/__tests__/settings
git commit -m "feat(settings): Notifications section with report opt-in toggles"
```

**Milestone: email reports are fully shippable here.** Phases 6 is additive (push).

---

## Phase 6 — Web Push (greenfield)

### Task 13: Backend push infrastructure (VAPID, subscriptions, PushService)

**Files:**
- Modify: `backend/build.gradle`
- Modify: `backend/src/main/resources/application.properties`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/PushSubscription.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/PushSubscriptionRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/PushSubscriptionRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/WebPushService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/PushController.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/WebPushServiceTest.java`

**Interfaces:**
- Produces:
  - `GET /api/push/vapid-public-key` → `{"publicKey": "..."}"` (`""` when push is not configured)
  - `POST /api/push/subscriptions` body `{"endpoint","p256dh","auth"}` (upsert by endpoint for the authenticated user)
  - `DELETE /api/push/subscriptions` body `{"endpoint"}`
  - `WebPushService.pushEnabled(): boolean`; `WebPushService.sendToUser(UUID userId, String title, String body, String url)` — no-op when disabled; deletes subscriptions on HTTP 404/410; never throws.
- Env vars (add to root `.env`, all optional — push silently off when blank): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:noreply@busato.dev`). Generate once with `npx web-push generate-vapid-keys`.

- [ ] **Step 1: Dependencies + properties**

`build.gradle`:
```groovy
    // Web Push (VAPID) for report notifications
    implementation 'nl.martijndwars:web-push:5.1.1'
    implementation 'org.bouncycastle:bcprov-jdk18on:1.78.1'
```
`application.properties`:
```properties
# Web Push (VAPID) — blank disables push entirely
application.push.vapid.public-key=${VAPID_PUBLIC_KEY:}
application.push.vapid.private-key=${VAPID_PRIVATE_KEY:}
application.push.vapid.subject=${VAPID_SUBJECT:mailto:noreply@busato.dev}
```

- [ ] **Step 2: Write the failing tests** — `WebPushServiceTest.java`:

```java
package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WebPushServiceTest {

  @Mock private PushSubscriptionRepository repo;

  private WebPushService service(String pub, String priv) {
    return new WebPushService(repo, pub, priv, "mailto:test@example.com");
  }

  @Test
  void pushEnabled_FalseWhenKeysBlank() {
    assertFalse(service("", "").pushEnabled());
    assertFalse(service("pk", "").pushEnabled());
  }

  @Test
  void sendToUser_Disabled_NoRepositoryAccess() {
    service("", "").sendToUser(UUID.randomUUID(), "t", "b", "/dashboard");

    verifyNoInteractions(repo);
  }

  @Test
  void subscribe_NewEndpoint_SavesSubscription() {
    User user = User.builder().id(UUID.randomUUID()).username("n").email("n@x.com").password("p").build();
    when(repo.findByEndpoint("https://push/ep")).thenReturn(Optional.empty());
    when(repo.save(any(PushSubscription.class))).thenAnswer(i -> i.getArgument(0));

    service("pk", "sk").subscribe(user, new PushSubscriptionRequest("https://push/ep", "k1", "a1"));

    verify(repo)
        .save(
            argThat(
                s ->
                    s.getEndpoint().equals("https://push/ep")
                        && s.getP256dh().equals("k1")
                        && s.getAuth().equals("a1")
                        && s.getUser() == user));
  }

  @Test
  void subscribe_ExistingEndpoint_RebindsToUserAndKeys() {
    User owner = User.builder().id(UUID.randomUUID()).username("o").email("o@x.com").password("p").build();
    PushSubscription existing =
        PushSubscription.builder().endpoint("https://push/ep").p256dh("old").auth("old").build();
    when(repo.findByEndpoint("https://push/ep")).thenReturn(Optional.of(existing));
    when(repo.save(any(PushSubscription.class))).thenAnswer(i -> i.getArgument(0));

    service("pk", "sk").subscribe(owner, new PushSubscriptionRequest("https://push/ep", "k2", "a2"));

    assertEquals("k2", existing.getP256dh());
    assertEquals(owner, existing.getUser());
  }

  @Test
  void unsubscribe_DeletesByEndpointAndUser() {
    UUID userId = UUID.randomUUID();
    User user = User.builder().id(userId).username("n").email("n@x.com").password("p").build();

    service("pk", "sk").unsubscribe(user, "https://push/ep");

    verify(repo).deleteByUserIdAndEndpoint(userId, "https://push/ep");
  }
}
```
(The actual network send path is exercised manually — `nl.martijndwars.webpush.PushService` performs real HTTP and is wrapped so failures only log.)

- [ ] **Step 3: Run** — `./gradlew test --tests "*.WebPushServiceTest"` → COMPILE ERROR = red.

- [ ] **Step 4: Implement**

`PushSubscription.java`:
```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/** One browser's Web Push subscription (a user can have several — one per device/browser). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "push_subscriptions")
public class PushSubscription {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, unique = true, length = 512)
  private String endpoint;

  @Column(nullable = false, length = 256)
  private String p256dh;

  @Column(nullable = false, length = 256)
  private String auth;

  @CreationTimestamp
  @Column(updatable = false)
  private LocalDate createdAt;
}
```

`PushSubscriptionRepository.java`:
```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {
  List<PushSubscription> findAllByUserId(UUID userId);

  Optional<PushSubscription> findByEndpoint(String endpoint);

  void deleteByUserIdAndEndpoint(UUID userId, String endpoint);
}
```

`PushSubscriptionRequest.java`:
```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** Browser PushSubscription payload (endpoint + the two client keys). */
public record PushSubscriptionRequest(
    @NotBlank String endpoint, @NotBlank String p256dh, @NotBlank String auth) {}
```

`WebPushService.java`:
```java
package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import java.security.Security;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Web Push (VAPID) delivery. Disabled (all methods no-op / return false) when the VAPID env vars
 * are blank. Send failures are logged, never thrown — push is a best-effort companion to email.
 */
@Slf4j
@Service
public class WebPushService {

  private final PushSubscriptionRepository subscriptionRepository;
  private final String publicKey;
  private final String privateKey;
  private final String subject;
  private nl.martijndwars.webpush.PushService client;

  public WebPushService(
      PushSubscriptionRepository subscriptionRepository,
      @Value("${application.push.vapid.public-key:}") String publicKey,
      @Value("${application.push.vapid.private-key:}") String privateKey,
      @Value("${application.push.vapid.subject:}") String subject) {
    this.subscriptionRepository = subscriptionRepository;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.subject = subject;
  }

  public boolean pushEnabled() {
    return !publicKey.isBlank() && !privateKey.isBlank();
  }

  public String getPublicKey() {
    return publicKey;
  }

  @Transactional
  public void subscribe(User user, PushSubscriptionRequest req) {
    PushSubscription sub =
        subscriptionRepository
            .findByEndpoint(req.endpoint())
            .orElseGet(() -> PushSubscription.builder().endpoint(req.endpoint()).build());
    sub.setUser(user);
    sub.setP256dh(req.p256dh());
    sub.setAuth(req.auth());
    subscriptionRepository.save(sub);
  }

  @Transactional
  public void unsubscribe(User user, String endpoint) {
    subscriptionRepository.deleteByUserIdAndEndpoint(user.getId(), endpoint);
  }

  /** Sends {title, body, url} as JSON to every subscription of the user. Best-effort. */
  public void sendToUser(UUID userId, String title, String body, String url) {
    if (!pushEnabled()) return;
    String payload =
        """
        {"title":%s,"body":%s,"url":%s}"""
            .formatted(jsonString(title), jsonString(body), jsonString(url));
    for (PushSubscription sub : subscriptionRepository.findAllByUserId(userId)) {
      try {
        var response =
            client()
                .send(new Notification(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payload));
        int status = response.getStatusLine().getStatusCode();
        if (status == 404 || status == 410) {
          subscriptionRepository.delete(sub); // subscription expired on the push service
        } else if (status >= 400) {
          log.warn("[Push] status {} for subscription {}", status, sub.getId());
        }
      } catch (Exception e) {
        log.warn("[Push] send failed for subscription {}: {}", sub.getId(), e.getMessage());
      }
    }
  }

  private synchronized nl.martijndwars.webpush.PushService client() throws Exception {
    if (client == null) {
      if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
        Security.addProvider(new BouncyCastleProvider());
      }
      client = new nl.martijndwars.webpush.PushService(publicKey, privateKey, subject);
    }
    return client;
  }

  private static String jsonString(String s) {
    return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }
}
```

`PushController.java`:
```java
package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.WebPushService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Web Push subscription management for the authenticated user. */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

  private final WebPushService webPushService;

  /** VAPID public key for pushManager.subscribe(); empty string when push is not configured. */
  @GetMapping("/vapid-public-key")
  public ResponseEntity<Map<String, String>> vapidPublicKey() {
    return ResponseEntity.ok(
        Map.of("publicKey", webPushService.pushEnabled() ? webPushService.getPublicKey() : ""));
  }

  @PostMapping("/subscriptions")
  public ResponseEntity<Map<String, String>> subscribe(
      @AuthenticationPrincipal User user, @Valid @RequestBody PushSubscriptionRequest request) {
    webPushService.subscribe(user, request);
    return ResponseEntity.ok(Map.of("message", "Subscribed"));
  }

  @DeleteMapping("/subscriptions")
  public ResponseEntity<Map<String, String>> unsubscribe(
      @AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
    webPushService.unsubscribe(user, body.get("endpoint"));
    return ResponseEntity.ok(Map.of("message", "Unsubscribed"));
  }
}
```
Check `config/SecurityConfig.java`: `/api/push/**` must fall in the default **authenticated** bucket (it will unless an explicit permit-all matcher catches it — verify, don't add one).

- [ ] **Step 5: Run + commit**

```bash
cd backend && ./gradlew spotlessApply test
git add -A backend && git commit -m "feat(push): VAPID web-push service, subscription entity and endpoints"
```
Also add the three `VAPID_*` vars to the root `.env` (values from `npx web-push generate-vapid-keys`).

---

### Task 14: Custom service worker (injectManifest) with push handlers

**Files:**
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/sw.ts`
- Create: `frontend/src/utils/pushPayload.ts`
- Test: `frontend/src/__tests__/utils/pushPayload.test.ts`

**Interfaces:**
- Consumes: push payload JSON `{"title","body","url"}` sent by `WebPushService` (Task 13).
- Produces: `parsePushPayload(data: unknown): { title: string; body: string; url: string }` (safe defaults); `dist/sw.js` with the same precache+runtime caching as today **plus** `push`/`notificationclick` handlers.

- [ ] **Step 1: Write the failing test** — `frontend/src/__tests__/utils/pushPayload.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePushPayload } from "../../utils/pushPayload";

describe("parsePushPayload", () => {
  it("returns fields from a valid payload", () => {
    expect(
      parsePushPayload({ title: "Report", body: "June is ready", url: "/dashboard" }),
    ).toEqual({ title: "Report", body: "June is ready", url: "/dashboard" });
  });

  it("falls back to defaults for missing/invalid fields", () => {
    expect(parsePushPayload(null)).toEqual({
      title: "FinanceWebApp",
      body: "",
      url: "/dashboard",
    });
    expect(parsePushPayload({ title: 3 }).title).toBe("FinanceWebApp");
  });
});
```

- [ ] **Step 2: Run** — `npx vitest run src/__tests__/utils/pushPayload.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

`frontend/src/utils/pushPayload.ts`:
```ts
export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/** Defensive parse of the backend's push JSON — a malformed payload must never break the SW. */
export function parsePushPayload(data: unknown): PushPayload {
  const obj = (data ?? {}) as Record<string, unknown>;
  return {
    title: typeof obj.title === "string" ? obj.title : "FinanceWebApp",
    body: typeof obj.body === "string" ? obj.body : "",
    url: typeof obj.url === "string" ? obj.url : "/dashboard",
  };
}
```

Install the workbox runtime modules:
```bash
cd frontend && npm install -D workbox-precaching workbox-routing workbox-strategies workbox-expiration workbox-cacheable-response
```

`frontend/src/sw.ts` (reproduces today's generated SW behavior 1:1, then adds push):
```ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { parsePushPayload } from "./utils/pushPayload";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// registerType "prompt": the client sends SKIP_WAITING when the user accepts the update.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ── runtime caching (mirrors the previous generateSW config) ────────────────
registerRoute(
  ({ url }) => url.pathname === "/config.js",
  new StaleWhileRevalidate({ cacheName: "runtime-config" }),
);
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: "gstatic-fonts-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

// ── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let raw: unknown = null;
  try {
    raw = event.data?.json();
  } catch {
    raw = null;
  }
  const { title, body, url } = parsePushPayload(raw);
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
```

`vite.config.ts` — inside the `VitePWA({ ... })` options: add
```ts
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
```
and **replace** the whole `workbox: { ... }` block with
```ts
        injectManifest: {
          globIgnores: ["config.js", "**/config.js"],
        },
```
(the runtime-caching rules now live in `src/sw.ts`; the config.js precache exclusion keeps working via `injectManifest.globIgnores`).

- [ ] **Step 4: Verify** — `cd frontend && npm run lint && npm test && npm run build`, then confirm the SW was built from our source:
```bash
grep -c "notificationclick" dist/sw.js   # expected: ≥ 1
```
If `tsc -b` complains about SW types in `sw.ts`, keep the triple-slash `/// <reference lib="webworker" />` as the first line and ensure the file has no DOM-only imports.

- [ ] **Step 5: Commit**

```bash
git add frontend/vite.config.ts frontend/src/sw.ts frontend/src/utils/pushPayload.ts frontend/src/__tests__/utils/pushPayload.test.ts frontend/package.json frontend/package-lock.json
git commit -m "feat(pwa): custom injectManifest service worker with push handlers"
```

---

### Task 15: Push preferences + “Enable on this device” UI

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/User.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/NotificationPrefsRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/UserProfileResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/mappers/UserMapper.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/UserService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/UserController.java`
- Create: `frontend/src/utils/webPush.ts`
- Modify: `frontend/src/settings/sections/NotificationsSection.tsx`
- Test: `backend` — extend `UserServiceTest`/`UserMapperTest`; `frontend` — `frontend/src/__tests__/utils/webPush.test.ts` + extend `NotificationsSection.test.tsx`

**Interfaces:**
- Backend produces: `User.isMonthlyReportPushEnabled()/isYearlyReportPushEnabled()` (default true, same `columnDefinition = "boolean default true"` pattern); `NotificationPrefsRequest` grows to 4 `@NotNull Boolean` fields (update ALL constructor call sites: `UserController`, `UserServiceTest`); `UserService.updateNotificationPrefs(User, boolean, boolean, boolean, boolean)`; `UserProfileResponse` carries all 4.
- Frontend produces: `urlBase64ToUint8Array(base64: string): Uint8Array` in `utils/webPush.ts`; a "Push notifications" block in `NotificationsSection` that
  1. hides itself when `!("serviceWorker" in navigator) || !("PushManager" in window)` or when `GET /push/vapid-public-key` returns an empty key;
  2. "Enable on this device" → `Notification.requestPermission()` → `navigator.serviceWorker.ready` → `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })` → `POST /push/subscriptions` with `{ endpoint, p256dh: sub.toJSON().keys.p256dh, auth: sub.toJSON().keys.auth }`;
  3. "Disable on this device" → `subscription.unsubscribe()` + `DELETE /push/subscriptions` (axios: `api.delete("/push/subscriptions", { data: { endpoint } })`);
  4. two extra `Toggle` rows (Monthly report push / Yearly wrap-up push) included in the same `PUT /users/me/notifications` payload.

- [ ] **Step 1: Backend TDD** — extend `UserServiceTest.updateNotificationPrefs_SavesBothFlags` to the 4-arg call asserting all four flags; extend the mapper test with the two push booleans; run red → implement (mirror Task 8 exactly: two new `User` columns, request record fields, mapper lines, 4-arg service signature, controller pass-through) → run green:
```bash
cd backend && ./gradlew test --tests "*.UserServiceTest" --tests "*.UserMapperTest"
```

- [ ] **Step 2: Frontend failing test** — `frontend/src/__tests__/utils/webPush.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "../../utils/webPush";

describe("urlBase64ToUint8Array", () => {
  it("decodes url-safe base64 with padding", () => {
    // "hello" → aGVsbG8 (url-safe, unpadded)
    expect(Array.from(urlBase64ToUint8Array("aGVsbG8"))).toEqual([104, 101, 108, 108, 111]);
  });

  it("maps url-safe chars (- and _) to their base64 equivalents", () => {
    expect(() => urlBase64ToUint8Array("a-b_c123")).not.toThrow();
  });
});
```

- [ ] **Step 3: Implement frontend** — `frontend/src/utils/webPush.ts`:

```ts
/** Converts a URL-safe base64 VAPID key to the Uint8Array pushManager.subscribe expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```
Then extend `NotificationsSection.tsx` with the push block per the Interfaces list above (new `Row`s reuse the existing `Row` helper; the enable/disable button uses `components/ui/Button` `variant="secondary" size="sm"`). Update `NotificationsSection.test.tsx`: mock `api.get` for `/push/vapid-public-key` (`{ data: { publicKey: "" } }` in existing tests so the push block stays hidden and they pass unchanged), and add one test asserting the block is hidden when the key is empty.

- [ ] **Step 4: Verify** — backend `./gradlew check`; frontend `npm run lint && npm test && npm run build`.

- [ ] **Step 5: Commit**

```bash
git add -A backend frontend
git commit -m "feat(push): per-report push preferences and device enrollment UI"
```

---

### Task 16: Wire push into the report jobs

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/report/ReportService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/report/ReportServiceTest.java` (append)

**Interfaces:**
- Consumes: `WebPushService.sendToUser` (Task 13), push prefs (Task 15).
- Produces: after each successful email, a best-effort push: monthly → title `"Your <Month Year> report is ready"`, body `"Open FinanceWebApp to see how the month went — the PDF is in your inbox."`; yearly → title `"Your <year> wrap-up is here"`, body `"Best months, top categories and records — the PDF is in your inbox."`; url `"/dashboard"` for both. Sent only when the user's corresponding push pref is on.

- [ ] **Step 1: Write the failing tests** — append to `ReportServiceTest` (add `@Mock private WebPushService webPushService;`):

```java
  @Test
  void sendMonthlyReports_SendsPushAfterEmail_WhenPushPrefOn() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(any(), any(), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(any(), any(), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render(any())).thenReturn("%PDF".getBytes());

    reportService.sendMonthlyReports(period);

    verify(webPushService)
        .sendToUser(eq(user.getId()), eq("Your June 2026 report is ready"), anyString(), eq("/dashboard"));
  }

  @Test
  void sendMonthlyReports_NoPush_WhenPushPrefOff() throws Exception {
    user.setMonthlyReportPushEnabled(false);
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(any(), any(), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(any(), any(), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render(any())).thenReturn("%PDF".getBytes());

    reportService.sendMonthlyReports(period);

    verifyNoInteractions(webPushService);
  }
```

- [ ] **Step 2: Run** — `./gradlew test --tests "*.ReportServiceTest"` → red (missing dependency/behavior).

- [ ] **Step 3: Implement** — in `ReportService`: add `private final WebPushService webPushService;`; in the monthly sender, after `sendEmailService.sendReportEmail(...)`:
```java
          if (user.isMonthlyReportPushEnabled()) {
            webPushService.sendToUser(
                user.getId(),
                "Your " + ReportHtmlBuilder.monthLabel(period) + " report is ready",
                "Open FinanceWebApp to see how the month went — the PDF is in your inbox.",
                "/dashboard");
          }
```
and in the yearly sender:
```java
          if (user.isYearlyReportPushEnabled()) {
            webPushService.sendToUser(
                user.getId(),
                "Your " + year + " wrap-up is here",
                "Best months, top categories and records — the PDF is in your inbox.",
                "/dashboard");
          }
```

- [ ] **Step 4: Run** — `./gradlew check` → PASS (coverage ≥ 90%).

- [ ] **Step 5: Commit**

```bash
git add -A backend && git commit -m "feat(report): push companion notifications for report emails"
```

---

## Final verification (after the last task)

- [ ] `cd backend && ./gradlew check` — Spotless + tests + 90% coverage all green.
- [ ] `cd frontend && npm run lint && npm test && npm run build` — all green.
- [ ] Manual smoke (optional but recommended, via the `/verify` skill's throwaway stack or `docker-compose up -d`): log in as admin → Admin → System → the two new job cards show MONTHLY/YEARLY schedules → "Run now" on `monthly-report` → JobRun message reads `sent N, skipped N (no data), failed N`; check the received email + attached PDF (needs real `MAIL_*` vars). For push: set `VAPID_*` vars, enable push in `/settings#notifications`, run the job, expect the browser notification.
- [ ] `graphify update .` to refresh the knowledge graph.
- [ ] Do NOT merge: leave `feature/summary-reports` for the user to review and merge manually.

## Plan self-review notes (already applied)

- Spec coverage: scheduler extension (T1–T2), aggregation (T3–T4), PDF+templates (T5–T7), prefs+email+jobs (T8–T11), settings UI (T12), push (T13–T16). Skip rules, error counting, run-now semantics and demo exclusion are encoded in T10/T11 tests.
- `InvitationStatus` is the enum nested in `model/WalletAccess.java` (verified) — T10 imports `...model.WalletAccess.InvitationStatus`.
- `openhtmltopdf` version pin (`1.1.24`) may need bumping to the latest on Maven Central — flagged inline in T5.

