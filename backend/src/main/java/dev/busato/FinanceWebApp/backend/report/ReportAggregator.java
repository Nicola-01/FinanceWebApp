package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
    List<Transaction> settled = settled(allTransactions);
    List<Transaction> inPeriod = between(settled, period.atDay(1), period.atEndOfMonth());
    YearMonth prev = period.minusMonths(1);
    List<Transaction> inPrevious = between(settled, prev.atDay(1), prev.atEndOfMonth());
    PeriodTotals totals = totals(inPeriod);

    return new WalletMonthlyReport(
        wallet.getName(),
        wallet.getColor(),
        wallet.getCurrency(),
        period,
        totals,
        inPrevious.isEmpty() ? null : totals(inPrevious),
        balanceUpTo(settled, period.atEndOfMonth()),
        topCategories(inPeriod, Transaction.Type.EXPENSE, totals.expense(), Map.of()),
        topCategories(inPeriod, Transaction.Type.INCOME, totals.income(), Map.of()),
        inPeriod.size());
  }

  // ── shared helpers (package-private: reused by the yearly report) ─────────

  /**
   * Amount-pending reminder transactions ({@link Transaction#isAmountPending()}) carry no real
   * value yet — they are placeholders awaiting an amount, so they are excluded from every report
   * figure (totals, balance, categories, counts, records).
   */
  static List<Transaction> settled(List<Transaction> all) {
    return all.stream().filter(t -> !t.isAmountPending()).toList();
  }

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

  // ── Yearly wrap-up ──────────────────────────────────────────────────────────

  public WalletYearlyReport yearly(Wallet wallet, List<Transaction> allTransactions, int year) {
    List<Transaction> settled = settled(allTransactions);
    LocalDate from = LocalDate.of(year, 1, 1);
    LocalDate to = LocalDate.of(year, 12, 31);
    List<Transaction> inYear = between(settled, from, to);
    List<Transaction> inPrevious =
        between(settled, LocalDate.of(year - 1, 1, 1), LocalDate.of(year - 1, 12, 31));
    PeriodTotals totals = totals(inYear);
    Map<String, BigDecimal> prevExpenseByCat =
        inPrevious.isEmpty() ? Map.of() : byCategory(inPrevious, Transaction.Type.EXPENSE);
    Map<String, BigDecimal> prevIncomeByCat =
        inPrevious.isEmpty() ? Map.of() : byCategory(inPrevious, Transaction.Type.INCOME);

    List<MonthRow> months = new ArrayList<>(12);
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
                Collectors.groupingBy(
                    Transaction::getTransactionDate,
                    Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)))
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
}
