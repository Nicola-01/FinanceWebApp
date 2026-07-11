package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ReportHtmlBuilderTest {

  private final ReportHtmlBuilder builder = new ReportHtmlBuilder();

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(builder, "frontendUrl", "http://localhost:5173");
  }

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
        builder.monthlyEmailBody(
            "nicola", YearMonth.of(2026, 6), List.of(report("Main", "#8b5cf6")));

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
        List.of(
            new CategoryTotal("Food", new BigDecimal("300.00"), 50.0, new BigDecimal("250.00"))),
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
        new ReportPdfRenderer()
            .render(builder.yearlyPdfHtml("nicola", 2025, List.of(yearlyReport())));
    assertTrue(pdf.length > 500);
  }
}
