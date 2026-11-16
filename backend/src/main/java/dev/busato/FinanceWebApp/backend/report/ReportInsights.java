package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Extended data for the PDF report: full category breakdowns, rankings, time series and stats.
 * Series are per day (monthly report) or per month (yearly report).
 */
public record ReportInsights(
    List<Slice> expenseCategories,
    List<Slice> incomeCategories,
    List<SubBreakdown> subcategories,
    List<TxLine> biggestExpenses,
    List<TxLine> biggestIncomes,
    List<Payee> topPayees,
    List<Payee> recurring,
    List<BigDecimal> cumulativeSpend,
    List<BigDecimal> previousCumulativeSpend,
    List<BigDecimal> balanceSeries,
    List<BigDecimal> incomeSeries,
    List<BigDecimal> expenseSeries,
    List<Bucket> sizeDistribution,
    List<CategoryRow> categoryByMonth,
    Stats stats) {

  /** One category: amount, share of the type total, previous-period amount (null = none). */
  public record Slice(String name, BigDecimal amount, double percent, BigDecimal previous) {}

  /** A root category split into its direct children ("General" = tagged on the root itself). */
  public record SubBreakdown(String category, BigDecimal total, List<Slice> children) {}

  public record TxLine(
      LocalDate date, String name, String category, BigDecimal amount, double percentOfTotal) {}

  public record Payee(String name, int count, BigDecimal total) {}

  public record Bucket(String label, int count, BigDecimal total) {}

  /** Yearly heatmap row: one category's expense per month (12 entries). */
  public record CategoryRow(String category, List<BigDecimal> months) {}

  public record Stats(
      int expenseCount,
      int incomeCount,
      BigDecimal avgDailySpend,
      BigDecimal avgExpense,
      BigDecimal medianExpense,
      BigDecimal largestIncome,
      int noSpendDays,
      int longestNoSpendStreak,
      BigDecimal weekdaySpend,
      BigDecimal weekendSpend,
      BigDecimal uncategorizedSpend,
      int categoriesUsed) {}
}
