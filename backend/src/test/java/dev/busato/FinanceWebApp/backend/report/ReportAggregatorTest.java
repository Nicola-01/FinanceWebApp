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

  @Test
  void monthly_ExcludesAmountPendingReminders() {
    Transaction pending =
        Transaction.builder()
            .name("rent reminder")
            .amount(BigDecimal.ZERO)
            .amountPending(true)
            .type(Transaction.Type.EXPENSE)
            .transactionDate(LocalDate.of(2026, 6, 4))
            .build();
    List<Transaction> all =
        List.of(
            tx("rent", "800.00", Transaction.Type.EXPENSE, LocalDate.of(2026, 6, 3), null),
            pending);

    WalletMonthlyReport r = aggregator.monthly(wallet, all, YearMonth.of(2026, 6));

    // The pending placeholder is not counted or summed.
    assertEquals(1, r.transactionCount());
    assertEquals(new BigDecimal("800.00"), r.totals().expense());
    assertEquals(1, r.topExpenseCategories().size());
  }

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
}
