package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/**
 * Chart data for one wallet's report section (period {@code from..to} inclusive).
 *
 * @param dailyExpense expense total per day, only days with spending (subscriptions included)
 * @param weekdayAverages average spent per weekday, Monday first (7 entries), subscriptions
 *     excluded, averaged over every occurrence of that weekday in the period
 * @param fixedVsEveryday one entry per month of the period
 * @param savingsRate (income − expense) / income in %, null when there is no income
 * @param previousSavingsRate same for the previous period, null without data or income
 */
public record ReportCharts(
    LocalDate from,
    LocalDate to,
    Map<LocalDate, BigDecimal> dailyExpense,
    List<BigDecimal> weekdayAverages,
    List<FixedSplit> fixedVsEveryday,
    Double savingsRate,
    Double previousSavingsRate) {

  /** A month's spending split: subscription-generated ({@code fixed}) vs everything else. */
  public record FixedSplit(YearMonth month, BigDecimal fixed, BigDecimal everyday) {
    public BigDecimal total() {
      return fixed.add(everyday);
    }
  }
}
