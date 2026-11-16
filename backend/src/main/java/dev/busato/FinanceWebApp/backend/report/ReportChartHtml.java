package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Report charts as plain HTML tables with inline styles: the same markup works in the email body
 * (Gmail/Outlook strip SVG and most CSS) and in the PDF (openhtmltopdf parses it as XML, so the
 * output must stay well-formed XHTML — hence {@code &#160;}, never {@code &nbsp;}). Only the
 * savings-rate ring uses SVG, and only in the PDF. A chart with no data is omitted.
 */
final class ReportChartHtml {

  /** 5-step single-hue scale, monotonic in lightness so it survives greyscale printing. */
  static final String[] SCALE = {"#edf2f7", "#e9d5ff", "#c084fc", "#9333ea", "#581c87"};

  private static final String BAR = "#c084fc";
  private static final String BAR_PEAK = "#7e22ce";
  private static final String FIXED = "#581c87";
  private static final String POS = "#059669";
  private static final String NEG = "#dc2626";
  private static final String MUTED = "#718096";
  private static final String H3 =
      "<h3 style=\"font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#718096;"
          + " margin:14px 0 6px 0;\">";
  private static final String CAPTION =
      "<p style=\"color:#718096; font-size:10px; margin:4px 0 0 0;\">";
  private static final int BAR_HEIGHT = 90;

  private ReportChartHtml() {}

  /**
   * @param svg true for the PDF (savings-rate ring), false for the email (big % only)
   */
  static String block(ReportCharts c, String currency, boolean svg) {
    if (c == null) return "";
    boolean yearly = ChronoUnit.DAYS.between(c.from(), c.to()) > 31;
    StringBuilder s = new StringBuilder();
    if (!c.dailyExpense().isEmpty()) {
      s.append(keep(yearly ? yearGrid(c, currency) : monthCalendar(c, currency)));
    }
    s.append(keep(weekdayBars(c.weekdayAverages(), currency)));
    s.append(keep(yearly ? fixedBarsYear(c.fixedVsEveryday(), currency) : fixedMonth(c, currency)));
    s.append(keep(savings(c, yearly, svg)));
    return s.toString();
  }

  /** Keeps a chart's heading and body on the same PDF page (ignored by email clients). */
  private static String keep(String section) {
    return section.isEmpty() ? "" : "<div style=\"page-break-inside:avoid;\">" + section + "</div>";
  }

  // ── spending calendar ─────────────────────────────────────────────────────

  static int level(BigDecimal amount, BigDecimal max) {
    if (amount == null || amount.signum() <= 0 || max.signum() <= 0) return 0;
    double ratio = amount.doubleValue() / max.doubleValue();
    return Math.max(1, Math.min(4, (int) Math.ceil(ratio * 4)));
  }

  private static BigDecimal max(Map<LocalDate, BigDecimal> daily) {
    return daily.values().stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
  }

  private static String monthCalendar(ReportCharts c, String currency) {
    BigDecimal max = max(c.dailyExpense());
    StringBuilder s = new StringBuilder(H3).append("Spending calendar</h3>");
    s.append(
        "<table cellspacing=\"3\" cellpadding=\"0\" style=\"width:100%; border-collapse:separate;"
            + " table-layout:fixed;\"><tr>");
    for (DayOfWeek d : DayOfWeek.values()) {
      s.append("<td style=\"text-align:center; font-size:9px; color:#718096;\">")
          .append(d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
          .append("</td>");
    }
    s.append("</tr><tr>");
    int lead = c.from().getDayOfWeek().getValue() - 1;
    for (int i = 0; i < lead; i++) s.append("<td>&#160;</td>");
    int col = lead;
    for (LocalDate d = c.from(); !d.isAfter(c.to()); d = d.plusDays(1)) {
      if (col == 7) {
        s.append("</tr><tr>");
        col = 0;
      }
      int lv = level(c.dailyExpense().get(d), max);
      s.append("<td style=\"height:24px; text-align:center; font-size:10px; border-radius:4px;")
          .append(" background:")
          .append(SCALE[lv])
          .append("; color:")
          .append(lv >= 3 ? "#ffffff" : "#1a202c")
          .append(";\">")
          .append(d.getDayOfMonth())
          .append("</td>");
      col++;
    }
    for (; col < 7; col++) s.append("<td>&#160;</td>");
    s.append("</tr></table>");
    s.append(legend()).append(peakCaption(c.dailyExpense(), currency));
    return s.toString();
  }

  private static String yearGrid(ReportCharts c, String currency) {
    BigDecimal max = max(c.dailyExpense());
    LocalDate start = c.from().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    int weeks = (int) (ChronoUnit.DAYS.between(start, c.to()) / 7) + 1;
    String cell = "width:8px; height:8px; font-size:0; line-height:0; border-radius:2px;";
    StringBuilder s = new StringBuilder(H3).append("Spending calendar</h3>");
    s.append(
        "<table cellspacing=\"2\" cellpadding=\"0\" style=\"border-collapse:separate;"
            + " table-layout:fixed;\">");
    // Month header: consecutive week columns grouped under the month they start in.
    s.append("<tr><td style=\"width:10px;\"></td>");
    int w = 0;
    while (w < weeks) {
      YearMonth m = YearMonth.from(max(start.plusWeeks(w), c.from()));
      int span = 0;
      while (w < weeks && YearMonth.from(max(start.plusWeeks(w), c.from())).equals(m)) {
        span++;
        w++;
      }
      s.append("<td colspan=\"")
          .append(span)
          .append("\" style=\"font-size:8px; color:#718096; overflow:hidden;\">")
          .append(span >= 2 ? m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) : "")
          .append("</td>");
    }
    s.append("</tr>");
    for (int row = 0; row < 7; row++) {
      s.append("<tr><td style=\"font-size:7px; color:#718096; line-height:8px;\">")
          .append(
              row % 2 == 0 && row < 6
                  ? DayOfWeek.of(row + 1).getDisplayName(TextStyle.NARROW, Locale.ENGLISH)
                  : "")
          .append("</td>");
      for (int col = 0; col < weeks; col++) {
        LocalDate d = start.plusWeeks(col).plusDays(row);
        boolean inRange = !d.isBefore(c.from()) && !d.isAfter(c.to());
        s.append("<td style=\"")
            .append(cell)
            .append(" background:")
            .append(inRange ? SCALE[level(c.dailyExpense().get(d), max)] : "transparent")
            .append(";\">&#160;</td>");
      }
      s.append("</tr>");
    }
    s.append("</table>");
    s.append(legend()).append(peakCaption(c.dailyExpense(), currency));
    return s.toString();
  }

  private static LocalDate max(LocalDate a, LocalDate b) {
    return a.isAfter(b) ? a : b;
  }

  private static String legend() {
    StringBuilder s =
        new StringBuilder(
            "<table cellspacing=\"2\" cellpadding=\"0\" style=\"margin-top:4px;\"><tr>"
                + "<td style=\"font-size:9px; color:#718096; padding-right:4px;\">Less</td>");
    for (String color : SCALE) {
      s.append(
              "<td style=\"width:10px; height:10px; font-size:0; line-height:0; border-radius:2px;")
          .append(" background:")
          .append(color)
          .append(";\">&#160;</td>");
    }
    return s.append(
            "<td style=\"font-size:9px; color:#718096; padding-left:4px;\">More</td></tr></table>")
        .toString();
  }

  private static String peakCaption(Map<LocalDate, BigDecimal> daily, String currency) {
    Map.Entry<LocalDate, BigDecimal> peak =
        daily.entrySet().stream().max(Map.Entry.comparingByValue()).orElseThrow();
    return CAPTION
        + "Highest day: "
        + peak.getKey().getDayOfMonth()
        + " "
        + peak.getKey().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        + " — "
        + ReportHtmlBuilder.formatAmount(peak.getValue(), currency)
        + "</p>";
  }

  // ── by day of the week ────────────────────────────────────────────────────

  private static String weekdayBars(List<BigDecimal> averages, String currency) {
    BigDecimal max = averages.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    if (max.signum() <= 0) return "";
    int peak = averages.indexOf(max);
    StringBuilder s = new StringBuilder(H3).append("By day of the week</h3>");
    s.append("<table cellspacing=\"0\" cellpadding=\"2\" style=\"width:100%;\">");
    for (int i = 0; i < 7; i++) {
      boolean isPeak = i == peak;
      String weight = isPeak ? " font-weight:bold;" : "";
      s.append("<tr><td style=\"width:12%; font-size:10px;")
          .append(weight)
          .append("\">")
          .append(DayOfWeek.of(i + 1).getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
          .append(
              "</td><td style=\"width:63%;\"><div style=\"height:10px; border-radius:3px; width:")
          .append(widthPercent(averages.get(i), max))
          .append("%; background:")
          .append(isPeak ? BAR_PEAK : BAR)
          .append(";\"></div></td><td style=\"width:25%; text-align:right; font-size:10px;")
          .append(weight)
          .append("\">")
          .append(ReportHtmlBuilder.formatAmount(averages.get(i), currency))
          .append("</td></tr>");
    }
    s.append("</table>")
        .append(CAPTION)
        .append("Average spent per day; subscriptions excluded.</p>");
    return s.toString();
  }

  /** Bar width 0..100; a non-zero value never collapses below 1% so it stays visible. */
  static int widthPercent(BigDecimal value, BigDecimal max) {
    if (value.signum() <= 0 || max.signum() <= 0) return 0;
    return Math.max(1, (int) Math.round(value.doubleValue() / max.doubleValue() * 100));
  }

  // ── fixed vs everyday ─────────────────────────────────────────────────────

  private static String fixedMonth(ReportCharts c, String currency) {
    ReportCharts.FixedSplit m = c.fixedVsEveryday().get(0);
    BigDecimal total = m.total();
    if (total.signum() <= 0) return "";
    int fixedPct = (int) Math.round(ReportAggregator.percent(m.fixed(), total));
    StringBuilder s = new StringBuilder(H3).append("Fixed vs everyday</h3>");
    s.append(
        "<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;\"><tr>");
    if (m.fixed().signum() > 0) {
      s.append("<td style=\"height:12px; font-size:0; line-height:0; width:")
          .append(fixedPct)
          .append("%; background:")
          .append(FIXED)
          .append(";\">&#160;</td>");
    }
    if (m.everyday().signum() > 0) {
      s.append("<td style=\"height:12px; font-size:0; line-height:0; background:")
          .append(BAR)
          .append(";\">&#160;</td>");
    }
    s.append("</tr></table>");
    s.append(splitCaption(m.fixed(), m.everyday(), currency));
    return s.toString();
  }

  private static String splitCaption(BigDecimal fixed, BigDecimal everyday, String currency) {
    BigDecimal total = fixed.add(everyday);
    return CAPTION
        + "<span style=\"color:"
        + FIXED
        + "; font-weight:bold;\">Fixed (subscriptions)</span> "
        + ReportHtmlBuilder.formatAmount(fixed, currency)
        + " · "
        + Math.round(ReportAggregator.percent(fixed, total))
        + "% &#160; <span style=\"color:#9333ea; font-weight:bold;\">Everyday</span> "
        + ReportHtmlBuilder.formatAmount(everyday, currency)
        + " · "
        + Math.round(ReportAggregator.percent(everyday, total))
        + "%</p>";
  }

  /**
   * Bar scale for the yearly stacked bars: an outlier month (above 1.5× the second-highest) is
   * capped at 1.5× the second-highest so it doesn't flatten every other bar.
   */
  static BigDecimal barCap(List<ReportCharts.FixedSplit> months) {
    List<BigDecimal> totals =
        months.stream()
            .map(ReportCharts.FixedSplit::total)
            .sorted((a, b) -> b.compareTo(a))
            .toList();
    BigDecimal first = totals.isEmpty() ? BigDecimal.ZERO : totals.get(0);
    BigDecimal second = totals.size() < 2 ? BigDecimal.ZERO : totals.get(1);
    BigDecimal cap = second.multiply(BigDecimal.valueOf(1.5));
    return second.signum() > 0 && first.compareTo(cap) > 0 ? cap : first;
  }

  private static String fixedBarsYear(List<ReportCharts.FixedSplit> months, String currency) {
    BigDecimal cap = barCap(months);
    if (cap.signum() <= 0) return "";
    BigDecimal fixedSum = BigDecimal.ZERO;
    BigDecimal everydaySum = BigDecimal.ZERO;
    boolean capped = false;
    StringBuilder bars = new StringBuilder("<tr>");
    StringBuilder labels = new StringBuilder("<tr>");
    for (ReportCharts.FixedSplit m : months) {
      fixedSum = fixedSum.add(m.fixed());
      everydaySum = everydaySum.add(m.everyday());
      BigDecimal total = m.total();
      boolean over = total.compareTo(cap) > 0;
      capped |= over;
      // Scale both parts so the whole bar fits the cap, keeping their proportion.
      double scale = total.signum() <= 0 ? 0 : Math.min(1, cap.doubleValue() / total.doubleValue());
      int fixedH = px(m.fixed(), cap, scale);
      int everydayH = px(m.everyday(), cap, scale);
      bars.append("<td style=\"vertical-align:bottom; text-align:center; padding:0 2px;\">");
      if (over) {
        bars.append("<div style=\"font-size:8px; font-weight:bold; color:#1a202c;\">")
            .append(compact(total))
            .append("</div>");
      }
      if (everydayH > 0) bars.append(bar(everydayH, BAR, "3px 3px 0 0"));
      if (fixedH > 0) bars.append(bar(fixedH, FIXED, everydayH > 0 ? "0" : "3px 3px 0 0"));
      bars.append("</td>");
      labels
          .append("<td style=\"text-align:center; font-size:8px; color:#718096;\">")
          .append(m.month().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
          .append("</td>");
    }
    StringBuilder s = new StringBuilder(H3).append("Fixed vs everyday</h3>");
    s.append("<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;")
        .append(" height:")
        .append(BAR_HEIGHT + 14)
        .append("px;\">")
        .append(bars)
        .append("</tr>")
        .append(labels)
        .append("</tr></table>");
    s.append(splitCaption(fixedSum, everydaySum, currency));
    if (capped) {
      s.append(CAPTION)
          .append("An unusually high month is cut short; its label shows the real total.</p>");
    }
    return s.toString();
  }

  private static int px(BigDecimal value, BigDecimal cap, double scale) {
    if (value.signum() <= 0) return 0;
    return Math.max(
        1, (int) Math.round(value.doubleValue() / cap.doubleValue() * scale * BAR_HEIGHT));
  }

  private static String bar(int height, String color, String radius) {
    return "<div style=\"height:"
        + height
        + "px; background:"
        + color
        + "; border-radius:"
        + radius
        + "; font-size:0; line-height:0;\"></div>";
  }

  /** 950 → "950", 1234 → "1.2k", 10400 → "10k", 2500000 → "2.5M". */
  static String compact(BigDecimal value) {
    double v = value.doubleValue();
    if (Math.abs(v) >= 1_000_000) return trim(v / 1_000_000) + "M";
    if (Math.abs(v) >= 1_000) return trim(v / 1_000) + "k";
    return String.valueOf(value.setScale(0, RoundingMode.HALF_UP).intValue());
  }

  private static String trim(double v) {
    return Math.abs(v) >= 10
        ? String.valueOf(Math.round(v))
        : String.format(Locale.ENGLISH, "%.1f", v).replace(".0", "");
  }

  // ── savings rate ──────────────────────────────────────────────────────────

  private static String savings(ReportCharts c, boolean yearly, boolean svg) {
    if (c.savingsRate() == null) return "";
    String current;
    String previous;
    if (yearly) {
      current = String.valueOf(c.from().getYear());
      previous = String.valueOf(c.from().getYear() - 1);
    } else {
      YearMonth period = YearMonth.from(c.from());
      current = ReportHtmlBuilder.monthLabel(period);
      previous = ReportHtmlBuilder.monthLabel(period.minusMonths(1));
    }
    StringBuilder s = new StringBuilder(H3).append("Savings rate</h3>");
    if (svg) {
      s.append("<table cellspacing=\"0\" cellpadding=\"0\"><tr>");
      s.append(ringCell(c.savingsRate(), current));
      if (c.previousSavingsRate() != null) s.append(ringCell(c.previousSavingsRate(), previous));
      s.append("</tr></table>");
    } else {
      s.append("<div style=\"font-size:32px; font-weight:bold; color:")
          .append(rateColor(c.savingsRate()))
          .append(";\">")
          .append(formatRate(c.savingsRate()))
          .append("</div>");
      if (c.previousSavingsRate() != null) {
        s.append(CAPTION)
            .append("vs ")
            .append(formatRate(c.previousSavingsRate()))
            .append(" in ")
            .append(previous)
            .append("</p>");
      }
    }
    s.append(CAPTION).append("Share of income kept after expenses.</p>");
    return s.toString();
  }

  private static String ringCell(double rate, String label) {
    return "<td style=\"text-align:center; padding-right:24px;\">"
        + ring(rate)
        + "<div style=\"font-size:10px; color:"
        + MUTED
        + ";\">"
        + label
        + "</div></td>";
  }

  /** SVG ring (PDF only): arc = |rate| capped at 100%, green when ≥ 0, danger when negative. */
  static String ring(double rate) {
    double circumference = 2 * Math.PI * 36;
    double arc = Math.min(Math.abs(rate), 100) / 100 * circumference;
    String color = rateColor(rate);
    return String.format(
        Locale.ENGLISH,
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"90\" height=\"90\" viewBox=\"0 0 90 90\">"
            + "<circle cx=\"45\" cy=\"45\" r=\"36\" fill=\"none\" stroke=\"#edf2f7\" stroke-width=\"10\"/>"
            + "<circle cx=\"45\" cy=\"45\" r=\"36\" fill=\"none\" stroke=\"%s\" stroke-width=\"10\""
            + " stroke-dasharray=\"%.2f %.2f\" transform=\"rotate(-90 45 45)\"/>"
            + "<text x=\"45\" y=\"51\" text-anchor=\"middle\" font-family=\"sans-serif\""
            + " font-size=\"17\" font-weight=\"bold\" fill=\"%s\">%s</text></svg>",
        color,
        arc,
        circumference,
        color,
        formatRate(rate));
  }

  private static String rateColor(double rate) {
    return rate < 0 ? NEG : POS;
  }

  static String formatRate(double rate) {
    return Math.round(rate) + "%";
  }
}
