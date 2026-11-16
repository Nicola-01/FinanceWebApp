package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Bucket;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.CategoryRow;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Payee;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Slice;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Stats;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.SubBreakdown;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.TxLine;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/** Pure computation of {@link ReportInsights} (split out of ReportAggregator to keep it small). */
final class ReportInsightsAggregator {

  static final int TOP_TX = 10;
  static final int TOP_PAYEES = 8;
  static final int SUB_ROOTS = 3;
  static final int HEATMAP_ROWS = 6;
  static final BigDecimal[] BUCKET_EDGES = {
    new BigDecimal("10"), new BigDecimal("50"), new BigDecimal("100"), new BigDecimal("500")
  };
  static final String[] BUCKET_LABELS = {"under 10", "10–50", "50–100", "100–500", "500+"};

  private ReportInsightsAggregator() {}

  /**
   * @param settled every settled transaction of the wallet (for the running balance)
   * @param inPeriod / inPrevious the period's and previous period's transactions
   * @param yearly series per month instead of per day
   */
  static ReportInsights compute(
      List<Transaction> settled,
      List<Transaction> inPeriod,
      List<Transaction> inPrevious,
      LocalDate from,
      LocalDate to,
      boolean yearly) {
    List<Transaction> expenses = ofType(inPeriod, Transaction.Type.EXPENSE);
    List<Transaction> incomes = ofType(inPeriod, Transaction.Type.INCOME);
    BigDecimal expenseTotal = sum(expenses);
    BigDecimal incomeTotal = sum(incomes);
    boolean hasPrev = !inPrevious.isEmpty();

    // Series buckets: day index (monthly) or month index (yearly).
    LocalDate prevFrom = yearly ? from.minusYears(1) : from.minusMonths(1);
    int points = yearly ? 12 : to.getDayOfMonth();
    int prevPoints = yearly ? 12 : YearMonth.from(prevFrom).lengthOfMonth();
    Function<LocalDate, Integer> idx = d -> yearly ? d.getMonthValue() - 1 : d.getDayOfMonth() - 1;

    return new ReportInsights(
        slices(
            expenses, expenseTotal, hasPrev ? ofType(inPrevious, Transaction.Type.EXPENSE) : null),
        slices(incomes, incomeTotal, hasPrev ? ofType(inPrevious, Transaction.Type.INCOME) : null),
        subcategories(expenses),
        topTx(expenses, expenseTotal, TOP_TX),
        topTx(incomes, incomeTotal, 5),
        payees(expenses, t -> t.getName() == null ? "(no name)" : t.getName().trim(), TOP_PAYEES),
        payees(
            expenses.stream().filter(t -> t.getSubscription() != null).toList(),
            t -> t.getSubscription().getName(),
            Integer.MAX_VALUE),
        cumulative(perIndex(expenses, idx, points)),
        hasPrev
            ? cumulative(perIndex(ofType(inPrevious, Transaction.Type.EXPENSE), idx, prevPoints))
            : null,
        balance(settled, inPeriod, from, idx, points),
        perIndex(incomes, idx, points),
        perIndex(expenses, idx, points),
        buckets(expenses),
        yearly ? heatmap(expenses) : List.of(),
        stats(expenses, incomes, expenseTotal, from, to));
  }

  // ── categories ────────────────────────────────────────────────────────────

  private static List<Slice> slices(
      List<Transaction> txs, BigDecimal total, List<Transaction> previous) {
    Map<String, BigDecimal> prev = previous == null ? null : byRoot(previous);
    return byRoot(txs).entrySet().stream()
        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
        .map(
            e ->
                new Slice(
                    e.getKey(),
                    e.getValue(),
                    ReportAggregator.percent(e.getValue(), total),
                    prev == null ? null : prev.getOrDefault(e.getKey(), BigDecimal.ZERO)))
        .toList();
  }

  private static Map<String, BigDecimal> byRoot(List<Transaction> txs) {
    Map<String, BigDecimal> out = new LinkedHashMap<>();
    for (Transaction t : txs)
      out.merge(ReportAggregator.rootCategory(t), t.getAmount(), BigDecimal::add);
    return out;
  }

  /** Direct child under the root on the tag's path; "General" when tagged on the root itself. */
  static String subCategory(Transaction t) {
    Tag tag = t.getTag();
    if (tag == null || tag.isPlaceholder() || tag.getParent() == null) return "General";
    while (tag.getParent().getParent() != null) tag = tag.getParent();
    return tag.getName();
  }

  private static List<SubBreakdown> subcategories(List<Transaction> expenses) {
    Map<String, Map<String, BigDecimal>> tree = new LinkedHashMap<>();
    Map<String, BigDecimal> rootTotals = byRoot(expenses);
    for (Transaction t : expenses) {
      tree.computeIfAbsent(ReportAggregator.rootCategory(t), k -> new LinkedHashMap<>())
          .merge(subCategory(t), t.getAmount(), BigDecimal::add);
    }
    return rootTotals.entrySet().stream()
        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
        .filter(e -> tree.get(e.getKey()).size() > 1) // nothing to split otherwise
        .limit(SUB_ROOTS)
        .map(
            e ->
                new SubBreakdown(
                    e.getKey(),
                    e.getValue(),
                    tree.get(e.getKey()).entrySet().stream()
                        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                        .map(
                            c ->
                                new Slice(
                                    c.getKey(),
                                    c.getValue(),
                                    ReportAggregator.percent(c.getValue(), e.getValue()),
                                    null))
                        .toList()))
        .toList();
  }

  private static List<CategoryRow> heatmap(List<Transaction> expenses) {
    Map<String, BigDecimal[]> rows = new LinkedHashMap<>();
    for (Transaction t : expenses) {
      BigDecimal[] m =
          rows.computeIfAbsent(
              ReportAggregator.rootCategory(t),
              k -> {
                BigDecimal[] z = new BigDecimal[12];
                java.util.Arrays.fill(z, BigDecimal.ZERO);
                return z;
              });
      int i = t.getTransactionDate().getMonthValue() - 1;
      m[i] = m[i].add(t.getAmount());
    }
    return rows.entrySet().stream()
        .sorted(
            Comparator.comparing(
                    (Map.Entry<String, BigDecimal[]> e) ->
                        java.util.Arrays.stream(e.getValue())
                            .reduce(BigDecimal.ZERO, BigDecimal::add))
                .reversed())
        .limit(HEATMAP_ROWS)
        .map(e -> new CategoryRow(e.getKey(), List.of(e.getValue())))
        .toList();
  }

  // ── rankings ──────────────────────────────────────────────────────────────

  private static List<TxLine> topTx(List<Transaction> txs, BigDecimal total, int limit) {
    return txs.stream()
        .sorted(Comparator.comparing(Transaction::getAmount).reversed())
        .limit(limit)
        .map(
            t ->
                new TxLine(
                    t.getTransactionDate(),
                    t.getName(),
                    ReportAggregator.rootCategory(t),
                    t.getAmount(),
                    ReportAggregator.percent(t.getAmount(), total)))
        .toList();
  }

  private static List<Payee> payees(
      List<Transaction> txs, Function<Transaction, String> key, int limit) {
    Map<String, int[]> counts = new LinkedHashMap<>();
    Map<String, BigDecimal> totals = new LinkedHashMap<>();
    for (Transaction t : txs) {
      String k = key.apply(t);
      if (k == null || k.isBlank()) k = "(no name)";
      counts.computeIfAbsent(k, x -> new int[1])[0]++;
      totals.merge(k, t.getAmount(), BigDecimal::add);
    }
    return totals.entrySet().stream()
        .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
        .limit(limit)
        .map(e -> new Payee(e.getKey(), counts.get(e.getKey())[0], e.getValue()))
        .toList();
  }

  private static List<Bucket> buckets(List<Transaction> expenses) {
    int[] counts = new int[BUCKET_LABELS.length];
    BigDecimal[] totals = new BigDecimal[BUCKET_LABELS.length];
    java.util.Arrays.fill(totals, BigDecimal.ZERO);
    for (Transaction t : expenses) {
      int b = 0;
      while (b < BUCKET_EDGES.length && t.getAmount().compareTo(BUCKET_EDGES[b]) >= 0) b++;
      counts[b]++;
      totals[b] = totals[b].add(t.getAmount());
    }
    List<Bucket> out = new ArrayList<>();
    for (int i = 0; i < BUCKET_LABELS.length; i++) {
      out.add(new Bucket(BUCKET_LABELS[i], counts[i], totals[i]));
    }
    return out;
  }

  // ── series ────────────────────────────────────────────────────────────────

  private static List<BigDecimal> perIndex(
      List<Transaction> txs, Function<LocalDate, Integer> idx, int points) {
    BigDecimal[] out = new BigDecimal[points];
    java.util.Arrays.fill(out, BigDecimal.ZERO);
    for (Transaction t : txs) {
      int i = idx.apply(t.getTransactionDate());
      if (i >= 0 && i < points) out[i] = out[i].add(t.getAmount());
    }
    return List.of(out);
  }

  static List<BigDecimal> cumulative(List<BigDecimal> values) {
    List<BigDecimal> out = new ArrayList<>(values.size());
    BigDecimal run = BigDecimal.ZERO;
    for (BigDecimal v : values) {
      run = run.add(v);
      out.add(run);
    }
    return out;
  }

  /** Running balance at the end of each point (all history before the period is the start). */
  private static List<BigDecimal> balance(
      List<Transaction> settled,
      List<Transaction> inPeriod,
      LocalDate from,
      Function<LocalDate, Integer> idx,
      int points) {
    BigDecimal start = ReportAggregator.balanceUpTo(settled, from.minusDays(1));
    BigDecimal[] delta = new BigDecimal[points];
    java.util.Arrays.fill(delta, BigDecimal.ZERO);
    for (Transaction t : inPeriod) {
      int i = idx.apply(t.getTransactionDate());
      if (i < 0 || i >= points) continue;
      delta[i] =
          t.getType() == Transaction.Type.INCOME
              ? delta[i].add(t.getAmount())
              : delta[i].subtract(t.getAmount());
    }
    List<BigDecimal> out = new ArrayList<>(points);
    BigDecimal run = start;
    for (BigDecimal d : delta) {
      run = run.add(d);
      out.add(run);
    }
    return out;
  }

  // ── stats ─────────────────────────────────────────────────────────────────

  private static Stats stats(
      List<Transaction> expenses,
      List<Transaction> incomes,
      BigDecimal expenseTotal,
      LocalDate from,
      LocalDate to) {
    int days = (int) (to.toEpochDay() - from.toEpochDay()) + 1;
    Set<LocalDate> spendDays = new HashSet<>();
    BigDecimal weekend = BigDecimal.ZERO;
    BigDecimal uncategorized = BigDecimal.ZERO;
    for (Transaction t : expenses) {
      spendDays.add(t.getTransactionDate());
      DayOfWeek d = t.getTransactionDate().getDayOfWeek();
      if (d == DayOfWeek.SATURDAY || d == DayOfWeek.SUNDAY) weekend = weekend.add(t.getAmount());
      if ("Uncategorized".equals(ReportAggregator.rootCategory(t)))
        uncategorized = uncategorized.add(t.getAmount());
    }
    int streak = 0;
    int longest = 0;
    for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
      streak = spendDays.contains(d) ? 0 : streak + 1;
      longest = Math.max(longest, streak);
    }
    List<BigDecimal> sorted = expenses.stream().map(Transaction::getAmount).sorted().toList();
    BigDecimal median = BigDecimal.ZERO;
    if (!sorted.isEmpty()) {
      int n = sorted.size();
      median =
          n % 2 == 1
              ? sorted.get(n / 2)
              : sorted
                  .get(n / 2 - 1)
                  .add(sorted.get(n / 2))
                  .divide(BigDecimal.TWO, 2, RoundingMode.HALF_UP);
    }
    return new Stats(
        expenses.size(),
        incomes.size(),
        expenseTotal.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP),
        expenses.isEmpty()
            ? BigDecimal.ZERO
            : expenseTotal.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP),
        median,
        incomes.stream()
            .map(Transaction::getAmount)
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO),
        days - spendDays.size(),
        longest,
        expenseTotal.subtract(weekend),
        weekend,
        uncategorized,
        byRoot(expenses).size());
  }

  private static List<Transaction> ofType(List<Transaction> txs, Transaction.Type type) {
    return txs.stream().filter(t -> t.getType() == type).toList();
  }

  private static BigDecimal sum(List<Transaction> txs) {
    return txs.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
  }
}
