package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;

import java.io.StringReader;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.xml.sax.InputSource;

class ReportChartHtmlTest {

  private static BigDecimal bd(String v) {
    return new BigDecimal(v);
  }

  private static ReportCharts monthCharts() {
    Map<LocalDate, BigDecimal> daily = new TreeMap<>();
    daily.put(LocalDate.of(2026, 6, 1), bd("20.00"));
    daily.put(LocalDate.of(2026, 6, 12), bd("230.00"));
    daily.put(LocalDate.of(2026, 6, 20), bd("60.00"));
    return new ReportCharts(
        LocalDate.of(2026, 6, 1),
        LocalDate.of(2026, 6, 30),
        daily,
        List.of(bd("4.00"), bd("0"), bd("0"), bd("0"), bd("57.50"), bd("15.00"), bd("0")),
        List.of(new ReportCharts.FixedSplit(YearMonth.of(2026, 6), bd("40.00"), bd("270.00"))),
        42.0,
        -5.0);
  }

  private static ReportCharts yearCharts() {
    Map<LocalDate, BigDecimal> daily = new TreeMap<>();
    for (LocalDate d = LocalDate.of(2025, 1, 1); d.getYear() == 2025; d = d.plusDays(3)) {
      daily.put(d, bd(String.valueOf(d.getDayOfYear() % 50 + 1)));
    }
    List<ReportCharts.FixedSplit> months = new ArrayList<>();
    for (int m = 1; m <= 12; m++) {
      // July is an outlier (10k) → capped at 1.5× the next month
      months.add(
          new ReportCharts.FixedSplit(
              YearMonth.of(2025, m),
              bd("300"),
              m == 7 ? bd("10100") : bd(String.valueOf(500 + m * 20))));
    }
    return new ReportCharts(
        LocalDate.of(2025, 1, 1),
        LocalDate.of(2025, 12, 31),
        daily,
        Collections.nCopies(7, bd("12.00")),
        months,
        18.5,
        null);
  }

  private static void assertWellFormed(String fragment) throws Exception {
    DocumentBuilderFactory.newInstance()
        .newDocumentBuilder()
        .parse(new InputSource(new StringReader("<root>" + fragment + "</root>")));
  }

  @Test
  void level_FiveStepScale() {
    assertEquals(0, ReportChartHtml.level(null, bd("100")));
    assertEquals(0, ReportChartHtml.level(BigDecimal.ZERO, bd("100")));
    assertEquals(1, ReportChartHtml.level(bd("1"), bd("100")));
    assertEquals(2, ReportChartHtml.level(bd("50"), bd("100")));
    assertEquals(4, ReportChartHtml.level(bd("100"), bd("100")));
  }

  @Test
  void barCap_CapsOutlierAtOneAndHalfTimesSecond() {
    assertEquals(
        0,
        bd("1200")
            .compareTo(
                ReportChartHtml.barCap(
                    List.of(
                        new ReportCharts.FixedSplit(YearMonth.of(2025, 1), bd("0"), bd("10000")),
                        new ReportCharts.FixedSplit(YearMonth.of(2025, 2), bd("0"), bd("800"))))));
    assertEquals(
        0,
        bd("900")
            .compareTo(
                ReportChartHtml.barCap(
                    List.of(
                        new ReportCharts.FixedSplit(YearMonth.of(2025, 1), bd("0"), bd("900")),
                        new ReportCharts.FixedSplit(YearMonth.of(2025, 2), bd("0"), bd("800"))))));
  }

  @Test
  void compact_ShortensLargeNumbers() {
    assertEquals("950", ReportChartHtml.compact(bd("950")));
    assertEquals("1.2k", ReportChartHtml.compact(bd("1234")));
    assertEquals("10k", ReportChartHtml.compact(bd("10400")));
    assertEquals("2.5M", ReportChartHtml.compact(bd("2500000")));
  }

  @Test
  void widthPercent_KeepsTinyValuesVisible() {
    assertEquals(0, ReportChartHtml.widthPercent(BigDecimal.ZERO, bd("10")));
    assertEquals(1, ReportChartHtml.widthPercent(bd("0.01"), bd("1000")));
    assertEquals(100, ReportChartHtml.widthPercent(bd("10"), bd("10")));
  }

  @Test
  void monthlyBlock_EmailHasBigPercentAndNoSvg() throws Exception {
    String html = ReportChartHtml.block(monthCharts(), "EUR", false);

    assertTrue(html.contains("Spending calendar"));
    assertTrue(html.contains("Highest day: 12 June — 230.00 EUR"));
    assertTrue(html.contains("By day of the week"));
    assertTrue(html.contains("Fixed (subscriptions)"));
    assertTrue(html.contains("42%"));
    assertTrue(html.contains("vs -5% in May 2026"));
    assertFalse(html.contains("<svg"));
    assertWellFormed(html);
  }

  @Test
  void monthlyBlock_PdfHasRings() throws Exception {
    String html = ReportChartHtml.block(monthCharts(), "EUR", true);

    assertEquals(2, html.split("<svg", -1).length - 1, "current + previous ring");
    assertTrue(html.contains("#dc2626"), "negative rate in danger colour");
    assertWellFormed(html);
  }

  @Test
  void yearlyBlock_GridBarsAndCappedLabel() throws Exception {
    String html = ReportChartHtml.block(yearCharts(), "EUR", true);

    assertTrue(html.contains(">Jan<") && html.contains(">Dec<"), "month header");
    assertTrue(html.contains("10k"), "outlier labelled with its real total");
    assertTrue(html.contains("cut short"));
    assertEquals(1, html.split("<svg", -1).length - 1, "no previous year ring");
    assertWellFormed(html);
  }

  @Test
  void block_HidesChartsWithoutData() {
    ReportCharts empty =
        new ReportCharts(
            LocalDate.of(2026, 6, 1),
            LocalDate.of(2026, 6, 30),
            Map.of(),
            Collections.nCopies(7, BigDecimal.ZERO),
            List.of(
                new ReportCharts.FixedSplit(
                    YearMonth.of(2026, 6), BigDecimal.ZERO, BigDecimal.ZERO)),
            null,
            null);

    assertEquals("", ReportChartHtml.block(empty, "EUR", true));
    assertEquals("", ReportChartHtml.block(null, "EUR", true));
  }

  /** Renders full PDFs with charts (proves the XHTML + SVG pipeline) into build/report-preview. */
  @Test
  void fullPdfs_RenderWithCharts() throws Exception {
    ReportHtmlBuilder builder = new ReportHtmlBuilder();
    ReflectionTestUtils.setField(builder, "frontendUrl", "http://localhost:5173");
    ReportPdfRenderer renderer = new ReportPdfRenderer();
    PeriodTotals totals = new PeriodTotals(bd("1000.00"), bd("580.00"), bd("420.00"));
    WalletMonthlyReport m =
        new WalletMonthlyReport(
            "Main",
            "#8b5cf6",
            "EUR",
            YearMonth.of(2026, 6),
            totals,
            null,
            bd("5000.00"),
            List.of(),
            List.of(),
            3,
            monthCharts());
    List<MonthRow> rows = new ArrayList<>();
    for (int i = 1; i <= 12; i++) {
      rows.add(new MonthRow(YearMonth.of(2025, i), bd("100"), bd("50"), bd("50"), 1));
    }
    WalletYearlyReport y =
        new WalletYearlyReport(
            "Main",
            "#8b5cf6",
            "EUR",
            2025,
            totals,
            null,
            rows,
            null,
            null,
            List.of(),
            List.of(),
            new YearRecords(null, null, null, null, null, null, 0, 12, null, null),
            12,
            yearCharts());

    byte[] monthly =
        renderer.render(builder.monthlyPdfHtml("nicola", YearMonth.of(2026, 6), List.of(m)));
    byte[] yearly = renderer.render(builder.yearlyPdfHtml("nicola", 2025, List.of(y)));

    assertTrue(monthly.length > 1000 && yearly.length > 1000);
    Path out = Path.of("build", "report-preview");
    Files.createDirectories(out);
    Files.write(out.resolve("monthly.pdf"), monthly);
    Files.write(out.resolve("yearly.pdf"), yearly);
    Files.writeString(
        out.resolve("monthly-email.html"),
        builder.monthlyEmailBody("nicola", YearMonth.of(2026, 6), List.of(m)));
    Files.writeString(
        out.resolve("yearly-email.html"), builder.yearlyEmailBody("nicola", 2025, List.of(y)));
  }
}
