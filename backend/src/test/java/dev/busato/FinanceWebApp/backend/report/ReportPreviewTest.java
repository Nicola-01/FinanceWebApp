package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * End-to-end render of the full report (aggregator → builder → PDF) on a realistic, seeded fake
 * wallet. Proves every section renders as valid XHTML (accented names included) and writes the
 * result to {@code build/report_preview/} for eyeballing.
 */
class ReportPreviewTest {

  private static Tag tag(String name, Tag parent) {
    return Tag.builder().name(name).parent(parent).build();
  }

  private static Transaction tx(
      String name,
      double amount,
      Transaction.Type type,
      LocalDate date,
      Tag tag,
      Subscription sub) {
    return Transaction.builder()
        .name(name)
        .amount(BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP))
        .type(type)
        .transactionDate(date)
        .tag(tag)
        .subscription(sub)
        .build();
  }

  /** Two years (2024–2025) of plausible personal-finance data, deterministic. */
  static List<Transaction> fakeHistory() {
    Random rnd = new Random(42);
    Tag food = tag("Food", null);
    Tag groceries = tag("Groceries", food);
    Tag restaurants = tag("Restaurants", food);
    Tag coffee = tag("Caffè & bar", food);
    Tag home = tag("Home", null);
    Tag rent = tag("Rent", home);
    Tag utilities = tag("Utilities", home);
    Tag transport = tag("Transport", null);
    Tag fuel = tag("Fuel", transport);
    Tag train = tag("Train", transport);
    Tag fun = tag("Leisure", null);
    Tag health = tag("Health", null);
    Tag shopping = tag("Shopping", null);
    Tag tech = tag("Tech", null);
    Tag travel = tag("Travel", null);
    Tag salary = tag("Salary", null);
    Tag side = tag("Side income", null);
    Subscription netflix = Subscription.builder().name("Netflix").build();
    Subscription spotify = Subscription.builder().name("Spotify").build();
    Subscription gym = Subscription.builder().name("Palestra Più").build();
    Subscription phone = Subscription.builder().name("Phone plan").build();

    String[] shops = {"Esselunga", "Coop", "Lidl", "Conad"};
    String[] places = {"Trattoria Da Mario", "Sushi Kō", "Pizzeria Bella", "Burger Joint"};
    List<Transaction> out = new ArrayList<>();
    for (LocalDate d = LocalDate.of(2024, 1, 1); d.getYear() <= 2025; d = d.plusDays(1)) {
      int dom = d.getDayOfMonth();
      boolean weekend = d.getDayOfWeek().getValue() >= 6;
      if (dom == 27)
        out.add(tx("Stipendio", 2450 + rnd.nextInt(80), Transaction.Type.INCOME, d, salary, null));
      if (dom == 1) out.add(tx("Affitto", 780, Transaction.Type.EXPENSE, d, rent, null));
      if (dom == 5) out.add(tx("Netflix", 12.99, Transaction.Type.EXPENSE, d, fun, netflix));
      if (dom == 9) out.add(tx("Spotify", 10.99, Transaction.Type.EXPENSE, d, fun, spotify));
      if (dom == 3) out.add(tx("Palestra Più", 45, Transaction.Type.EXPENSE, d, health, gym));
      if (dom == 15) out.add(tx("Phone plan", 9.99, Transaction.Type.EXPENSE, d, utilities, phone));
      if (dom == 20)
        out.add(
            tx("Luce e gas", 60 + rnd.nextInt(90), Transaction.Type.EXPENSE, d, utilities, null));
      if (rnd.nextDouble() < 0.35)
        out.add(
            tx(
                shops[rnd.nextInt(4)],
                15 + rnd.nextInt(70),
                Transaction.Type.EXPENSE,
                d,
                groceries,
                null));
      if (rnd.nextDouble() < (weekend ? 0.45 : 0.12))
        out.add(
            tx(
                places[rnd.nextInt(4)],
                18 + rnd.nextInt(45),
                Transaction.Type.EXPENSE,
                d,
                restaurants,
                null));
      if (!weekend && rnd.nextDouble() < 0.6)
        out.add(
            tx("Bar Centrale", 1.2 + rnd.nextInt(4), Transaction.Type.EXPENSE, d, coffee, null));
      if (rnd.nextDouble() < 0.07)
        out.add(tx("Eni", 40 + rnd.nextInt(30), Transaction.Type.EXPENSE, d, fuel, null));
      if (rnd.nextDouble() < 0.05)
        out.add(tx("Trenitalia", 9 + rnd.nextInt(40), Transaction.Type.EXPENSE, d, train, null));
      if (rnd.nextDouble() < 0.06)
        out.add(tx("Amazon", 10 + rnd.nextInt(120), Transaction.Type.EXPENSE, d, shopping, null));
      if (rnd.nextDouble() < 0.03)
        out.add(tx("Cinema", 9.5, Transaction.Type.EXPENSE, d, fun, null));
      if (rnd.nextDouble() < 0.02)
        out.add(tx("Farmacia", 8 + rnd.nextInt(30), Transaction.Type.EXPENSE, d, health, null));
      if (rnd.nextDouble() < 0.02)
        out.add(tx("Misc", 5 + rnd.nextInt(30), Transaction.Type.EXPENSE, d, null, null));
      if (rnd.nextDouble() < 0.025)
        out.add(
            tx("Freelance gig", 150 + rnd.nextInt(400), Transaction.Type.INCOME, d, side, null));
    }
    out.add(
        tx("MacBook Pro", 2399, Transaction.Type.EXPENSE, LocalDate.of(2025, 4, 12), tech, null));
    out.add(
        tx("Volo Tokyo", 1180, Transaction.Type.EXPENSE, LocalDate.of(2025, 8, 2), travel, null));
    out.add(
        tx("Hotel Kyoto", 940, Transaction.Type.EXPENSE, LocalDate.of(2025, 8, 9), travel, null));
    out.add(tx("Bonus", 1500, Transaction.Type.INCOME, LocalDate.of(2025, 12, 18), salary, null));
    return out;
  }

  @Test
  void renderPreviewPdfs() throws Exception {
    ReportAggregator aggregator = new ReportAggregator();
    ReportHtmlBuilder builder = new ReportHtmlBuilder();
    ReflectionTestUtils.setField(builder, "frontendUrl", "http://localhost:5173");
    ReportPdfRenderer renderer = new ReportPdfRenderer();
    Wallet wallet =
        Wallet.builder().name("Conto principale").color("#8b5cf6").currency("EUR").build();
    List<Transaction> all = fakeHistory();
    YearMonth june = YearMonth.of(2025, 6);

    WalletMonthlyReport monthly = aggregator.monthly(wallet, all, june);
    WalletYearlyReport yearly = aggregator.yearly(wallet, all, 2025);
    byte[] monthlyPdf = renderer.render(builder.monthlyPdfHtml("nicola", june, List.of(monthly)));
    byte[] yearlyPdf = renderer.render(builder.yearlyPdfHtml("nicola", 2025, List.of(yearly)));

    assertTrue(monthlyPdf.length > 5000 && yearlyPdf.length > 5000);
    assertFalse(monthly.insights().subcategories().isEmpty());
    assertFalse(yearly.insights().recurring().isEmpty());
    Path out = Path.of("build", "report_preview");
    Files.createDirectories(out);
    Files.write(out.resolve("monthly-2025-06.pdf"), monthlyPdf);
    Files.write(out.resolve("yearly-2025.pdf"), yearlyPdf);
    Files.writeString(
        out.resolve("monthly-email.html"),
        builder.monthlyEmailBody("nicola", june, List.of(monthly)));
    Files.writeString(
        out.resolve("yearly-email.html"), builder.yearlyEmailBody("nicola", 2025, List.of(yearly)));
  }
}
