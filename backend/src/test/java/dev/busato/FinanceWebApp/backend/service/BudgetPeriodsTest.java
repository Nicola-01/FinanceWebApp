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
            budget(Budget.PeriodType.CUSTOM, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 8, 31))));
  }
}
