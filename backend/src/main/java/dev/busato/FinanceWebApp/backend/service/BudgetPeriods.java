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

  /**
   * One tracked period: inclusive bounds, its alert-log key, and how many periods have elapsed from
   * the budget's first period through this one (inclusive).
   */
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
        int elapsed = (int) ChronoUnit.WEEKS.between(startDate.with(DayOfWeek.MONDAY), start) + 1;
        yield new Period(start, start.plusDays(6), key, elapsed);
      }
      case MONTHLY -> {
        YearMonth ym = YearMonth.from(today);
        int elapsed =
            (int) ChronoUnit.MONTHS.between(YearMonth.from(startDate).atDay(1), ym.atDay(1)) + 1;
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

  /**
   * Recurring: active from the start of the calendar period containing startDate. CUSTOM: active
   * only within the (inclusive) range.
   */
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
