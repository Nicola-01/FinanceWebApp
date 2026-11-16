package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.report.ReportInsights.Bucket;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.CategoryRow;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Payee;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Slice;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.Stats;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.SubBreakdown;
import dev.busato.FinanceWebApp.backend.report.ReportInsights.TxLine;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * PDF-only extended report sections (SVG charts via Batik + XHTML tables). Each section is wrapped
 * in a no-page-break block and omitted when it has no data. Every user-controlled string goes
 * through {@link ReportHtmlBuilder#esc}.
 */
final class ReportInsightsHtml {

  /** Categorical palette (distinct hues); the last entry is the "Other" bucket. */
  static final String[] PALETTE = {
    "#7c3aed", "#0ea5e9", "#f59e0b", "#ec4899", "#10b981", "#ef4444", "#6366f1", "#84cc16"
  };

  static final String OTHER = "#94a3b8";
  private static final String INCOME = "#10b981";
  private static final String EXPENSE = "#ef4444";
  private static final String MAIN = "#7c3aed";
  private static final String MUTED = "#718096";
  private static final String GRID = "#e2e8f0";
  private static final String CAPTION =
      "<p style=\"color:#718096; font-size:9px; margin:4px 0 0 0;\">";
  private static final String TH =
      "<th style=\"text-align:left; color:#718096; text-transform:uppercase; font-size:8px;"
          + " letter-spacing:1px; padding:3px 4px; border-bottom:1px solid #e2e8f0;\">";
  private static final String TD =
      "<td style=\"padding:3px 4px; border-bottom:1px solid #edf2f7;\">";
  private static final String TDR =
      "<td style=\"padding:3px 4px; border-bottom:1px solid #edf2f7; text-align:right;\">";

  private final String currency;
  private final boolean yearly;
  private final String prevLabel;
  private int section;

  private ReportInsightsHtml(String currency, boolean yearly, String prevLabel) {
    this.currency = currency;
    this.yearly = yearly;
    this.prevLabel = prevLabel;
  }

  static String block(ReportInsights in, String currency, boolean yearly, String prevLabel) {
    if (in == null) return "";
    return new ReportInsightsHtml(currency, yearly, prevLabel).render(in);
  }

  private String render(ReportInsights in) {
    StringBuilder s = new StringBuilder();
    s.append(statsTiles(in.stats()));
    s.append(donutSection("Where the money went", in.expenseCategories(), true));
    s.append(donutSection("Where the money came from", in.incomeCategories(), false));
    s.append(categoryChanges(in.expenseCategories()));
    s.append(subcategories(in.subcategories()));
    s.append(cumulativeChart(in.cumulativeSpend(), in.previousCumulativeSpend()));
    s.append(balanceChart(in.balanceSeries()));
    s.append(incomeExpenseBars(in.incomeSeries(), in.expenseSeries()));
    s.append(heatmap(in.categoryByMonth()));
    s.append(txTable("Biggest expenses", in.biggestExpenses(), "of spending"));
    s.append(txTable("Biggest income", in.biggestIncomes(), "of income"));
    s.append(payeeTable("Top places &amp; payees", in.topPayees()));
    s.append(payeeTable("Subscriptions & recurring costs".replace("&", "&amp;"), in.recurring()));
    s.append(sizeDistribution(in.sizeDistribution()));
    s.append(weekendSplit(in.stats()));
    return s.toString();
  }

  private String open(String title) {
    section++;
    return "<div style=\"page-break-inside:avoid; margin-top:14px;\"><h3>"
        + section
        + " · "
        + title
        + "</h3>";
  }

  private static final String CLOSE = "</div>";

  private String money(BigDecimal v) {
    return ReportHtmlBuilder.formatAmount(v, currency);
  }

  private static String pct(double p) {
    return String.format(Locale.ENGLISH, "%.1f%%", p);
  }

  // ── 1. key stats ──────────────────────────────────────────────────────────

  private String statsTiles(Stats st) {
    if (st.expenseCount() + st.incomeCount() == 0) return "";
    String[][] tiles = {
      {"Avg spent per day", money(st.avgDailySpend())},
      {"Avg expense", money(st.avgExpense())},
      {"Median expense", money(st.medianExpense())},
      {"Largest income", money(st.largestIncome())},
      {"Expenses", String.valueOf(st.expenseCount())},
      {"Incomes", String.valueOf(st.incomeCount())},
      {"No-spend days", String.valueOf(st.noSpendDays())},
      {"Longest no-spend streak", st.longestNoSpendStreak() + " days"},
      {"Categories used", String.valueOf(st.categoriesUsed())},
      {"Uncategorized spending", money(st.uncategorizedSpend())},
    };
    StringBuilder s = new StringBuilder(open("Key numbers"));
    s.append(
        "<table cellspacing=\"4\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;\">");
    for (int i = 0; i < tiles.length; i++) {
      if (i % 5 == 0) s.append(i == 0 ? "<tr>" : "</tr><tr>");
      s.append(
              "<td style=\"border:1px solid #e2e8f0; border-radius:6px; padding:6px 7px;"
                  + " vertical-align:top;\"><div style=\"font-size:7px; color:#718096;"
                  + " text-transform:uppercase; letter-spacing:0.5px;\">")
          .append(tiles[i][0])
          .append("</div><div style=\"font-size:11px; font-weight:bold; margin-top:2px;\">")
          .append(tiles[i][1])
          .append("</div></td>");
    }
    return s.append("</tr></table>").append(CLOSE).toString();
  }

  // ── 2–3. category donuts ──────────────────────────────────────────────────

  /** Top 7 + "Other" so the donut never needs more than the palette. */
  static List<Slice> donutSlices(List<Slice> all) {
    if (all.size() <= PALETTE.length) return all;
    List<Slice> out = new ArrayList<>(all.subList(0, PALETTE.length - 1));
    BigDecimal rest = BigDecimal.ZERO;
    double restPct = 0;
    for (Slice x : all.subList(PALETTE.length - 1, all.size())) {
      rest = rest.add(x.amount());
      restPct += x.percent();
    }
    out.add(new Slice("Other", rest, restPct, null));
    return out;
  }

  /** Colour of slice {@code i}; a trailing grouped "Other" (from {@link #donutSlices}) is grey. */
  private static String color(List<Slice> slices, int i) {
    boolean groupedOther =
        i == PALETTE.length - 1
            && slices.size() == PALETTE.length
            && "Other".equals(slices.get(i).name());
    return groupedOther ? OTHER : PALETTE[i % PALETTE.length];
  }

  private static String swatch(String color) {
    return "<span style=\"display:inline-block; width:8px; height:8px; border-radius:2px; background:"
        + color
        + ";\"></span>";
  }

  private String donutSection(String title, List<Slice> all, boolean showDelta) {
    if (all.isEmpty()) return "";
    List<Slice> slices = donutSlices(all);
    StringBuilder s = new StringBuilder(open(title));
    s.append("<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%;\"><tr>")
        .append("<td style=\"width:150px; vertical-align:top;\">")
        .append(donut(slices))
        .append("</td><td style=\"vertical-align:top;\">");
    // Legend lists every category (not only the donut's top 7).
    s.append("<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; font-size:9px;\"><tr>")
        .append(TH)
        .append("Category</th>")
        .append(TH)
        .append("Amount</th>")
        .append(TH)
        .append("Share</th>");
    boolean delta = showDelta && all.get(0).previous() != null;
    if (delta) s.append(TH).append("vs ").append(prevLabel).append("</th>");
    s.append("</tr>");
    for (int i = 0; i < all.size(); i++) {
      Slice x = all.get(i);
      // Categories folded into the donut's "Other" slice share its grey swatch.
      String sw = all.size() <= PALETTE.length || i < PALETTE.length - 1 ? PALETTE[i] : OTHER;
      s.append("<tr>")
          .append(TD)
          .append(swatch(sw))
          .append(" ")
          .append(ReportHtmlBuilder.esc(x.name()))
          .append("</td>")
          .append(TD)
          .append(money(x.amount()))
          .append("</td>")
          .append(TD)
          .append(pct(x.percent()))
          .append("</td>");
      if (delta) {
        BigDecimal d = x.amount().subtract(x.previous());
        s.append("<td style=\"padding:3px 4px; border-bottom:1px solid #edf2f7; color:")
            .append(d.signum() > 0 ? EXPENSE : d.signum() < 0 ? INCOME : MUTED)
            .append(";\">")
            .append(d.signum() > 0 ? "+" : "")
            .append(money(d))
            .append("</td>");
      }
      s.append("</tr>");
    }
    s.append("</table></td></tr></table>");
    return s.append(CLOSE).toString();
  }

  /** Donut via stroke-dasharray circles (one per slice), labelled with the top share. */
  private static String donut(List<Slice> slices) {
    double r = 50;
    double c = 2 * Math.PI * r;
    double total = slices.stream().mapToDouble(x -> x.amount().doubleValue()).sum();
    StringBuilder s =
        new StringBuilder(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"140\" height=\"140\""
                + " viewBox=\"0 0 140 140\"><g transform=\"rotate(-90 70 70)\">");
    double offset = 0;
    for (int i = 0; i < slices.size(); i++) {
      double len = total <= 0 ? 0 : slices.get(i).amount().doubleValue() / total * c;
      s.append(
          String.format(
              Locale.ENGLISH,
              "<circle cx=\"70\" cy=\"70\" r=\"50\" fill=\"none\" stroke=\"%s\""
                  + " stroke-width=\"24\" stroke-dasharray=\"%.2f %.2f\" stroke-dashoffset=\"%.2f\"/>",
              color(slices, i),
              len,
              c,
              -offset));
      offset += len;
    }
    s.append("</g>")
        .append(
            String.format(
                Locale.ENGLISH,
                "<text x=\"70\" y=\"68\" text-anchor=\"middle\" font-family=\"sans-serif\""
                    + " font-size=\"16\" font-weight=\"bold\" fill=\"#1a202c\">%.0f%%</text>"
                    + "<text x=\"70\" y=\"82\" text-anchor=\"middle\" font-family=\"sans-serif\""
                    + " font-size=\"8\" fill=\"#718096\">top category</text>",
                slices.get(0).percent()))
        .append("</svg>");
    return s.toString();
  }

  // ── 4. changes vs previous period ─────────────────────────────────────────

  private String categoryChanges(List<Slice> all) {
    if (all.isEmpty() || all.get(0).previous() == null) return "";
    List<Slice> moved =
        all.stream()
            .filter(x -> x.amount().compareTo(x.previous()) != 0)
            .sorted(
                (a, b) ->
                    b.amount()
                        .subtract(b.previous())
                        .abs()
                        .compareTo(a.amount().subtract(a.previous()).abs()))
            .limit(8)
            .toList();
    if (moved.isEmpty()) return "";
    BigDecimal max = moved.get(0).amount().subtract(moved.get(0).previous()).abs();
    StringBuilder s = new StringBuilder(open("Biggest changes vs " + prevLabel));
    s.append("<table cellspacing=\"0\" cellpadding=\"2\" style=\"width:100%; font-size:9px;\">");
    for (Slice x : moved) {
      BigDecimal d = x.amount().subtract(x.previous());
      int w = ReportChartHtml.widthPercent(d.abs(), max);
      String bar =
          "<div style=\"height:9px; border-radius:2px; width:"
              + w
              + "%; background:"
              + (d.signum() > 0 ? EXPENSE : INCOME)
              + ";"
              + (d.signum() < 0 ? " margin-left:" + (100 - w) + "%;" : "")
              + "\"></div>";
      s.append("<tr><td style=\"width:24%;\">")
          .append(ReportHtmlBuilder.esc(x.name()))
          .append("</td><td style=\"width:28%;\">")
          .append(d.signum() < 0 ? bar : "")
          .append("</td><td style=\"width:28%; border-left:1px solid #cbd5e0;\">")
          .append(d.signum() > 0 ? bar : "")
          .append("</td><td style=\"width:20%; text-align:right; color:")
          .append(d.signum() > 0 ? EXPENSE : INCOME)
          .append(";\">")
          .append(d.signum() > 0 ? "+" : "")
          .append(money(d))
          .append("</td></tr>");
    }
    s.append("</table>")
        .append(CAPTION)
        .append("Green = spent less, red = spent more than in ")
        .append(prevLabel)
        .append(".</p>");
    return s.append(CLOSE).toString();
  }

  // ── 5. subcategories ──────────────────────────────────────────────────────

  private String subcategories(List<SubBreakdown> subs) {
    if (subs.isEmpty()) return "";
    StringBuilder s = new StringBuilder(open("Inside the top categories"));
    for (SubBreakdown b : subs) {
      s.append("<div style=\"font-size:9px; font-weight:bold; margin:6px 0 2px 0;\">")
          .append(ReportHtmlBuilder.esc(b.category()))
          .append(" <span style=\"color:#718096; font-weight:normal;\">")
          .append(money(b.total()))
          .append("</span></div>");
      s.append(
          "<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;\"><tr>");
      List<Slice> kids = donutSlices(b.children());
      for (int i = 0; i < kids.size(); i++) {
        int w = Math.max(1, (int) Math.round(kids.get(i).percent()));
        s.append("<td style=\"height:10px; font-size:0; line-height:0; width:")
            .append(w)
            .append("%; background:")
            .append(color(kids, i))
            .append(";\">&#160;</td>");
      }
      s.append("</tr></table><div style=\"font-size:8px; color:#4a5568; margin-top:2px;\">");
      for (int i = 0; i < kids.size(); i++) {
        s.append("<span style=\"margin-right:8px;\">")
            .append(swatch(color(kids, i)))
            .append(" ")
            .append(ReportHtmlBuilder.esc(kids.get(i).name()))
            .append(" ")
            .append(money(kids.get(i).amount()))
            .append(" (")
            .append(Math.round(kids.get(i).percent()))
            .append("%)</span>");
      }
      s.append("</div>");
    }
    return s.append(CLOSE).toString();
  }

  // ── 6–8. time-series charts ───────────────────────────────────────────────

  private List<String> xLabels(int n) {
    List<String> out = new ArrayList<>(n);
    for (int i = 0; i < n; i++) {
      out.add(
          yearly
              ? Month.of(i + 1).getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
              : (i == 0 || (i + 1) % 5 == 0 ? String.valueOf(i + 1) : ""));
    }
    return out;
  }

  private String cumulativeChart(List<BigDecimal> current, List<BigDecimal> previous) {
    if (current.isEmpty() || current.get(current.size() - 1).signum() <= 0) return "";
    StringBuilder s = new StringBuilder(open("Spending build-up"));
    s.append(LineChart.svg(current, previous, xLabels(current.size()), MAIN, true));
    s.append(CAPTION)
        .append("<span style=\"color:" + MAIN + "; font-weight:bold;\">This period</span>")
        .append(
            previous == null
                ? ""
                : " vs <span style=\"color:#94a3b8; font-weight:bold;\">"
                    + prevLabel
                    + "</span> (dashed)")
        .append(" — cumulative spending.</p>");
    return s.append(CLOSE).toString();
  }

  private String balanceChart(List<BigDecimal> balance) {
    if (balance.isEmpty()) return "";
    StringBuilder s = new StringBuilder(open("Balance over time"));
    s.append(LineChart.svg(balance, null, xLabels(balance.size()), "#0ea5e9", false));
    s.append(CAPTION)
        .append("Start ")
        .append(money(balance.get(0)))
        .append(" to end ")
        .append(money(balance.get(balance.size() - 1)))
        .append(" (wallet balance at the end of each ")
        .append(yearly ? "month" : "day")
        .append(").</p>");
    return s.append(CLOSE).toString();
  }

  private String incomeExpenseBars(List<BigDecimal> income, List<BigDecimal> expense) {
    BigDecimal max =
        java.util.stream.Stream.concat(income.stream(), expense.stream())
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    if (max.signum() <= 0) return "";
    int n = income.size();
    double w = 520;
    double h = 130;
    double left = 44;
    double plotW = w - left - 6;
    double plotH = h - 22;
    double group = plotW / n;
    double bw = Math.max(1.5, group * 0.36);
    StringBuilder svg = LineChart.frame(w, h, left, plotH, BigDecimal.ZERO, max);
    for (int i = 0; i < n; i++) {
      double x = left + i * group + group * 0.1;
      svg.append(rect(x, plotH, bw, income.get(i), max, plotH, INCOME));
      svg.append(rect(x + bw, plotH, bw, expense.get(i), max, plotH, EXPENSE));
      String label = xLabels(n).get(i);
      if (!label.isEmpty()) {
        svg.append(LineChart.text(left + i * group + group / 2, h - 6, label, "middle"));
      }
    }
    svg.append("</svg>");
    StringBuilder s =
        new StringBuilder(
            open(yearly ? "Income vs expenses by month" : "Income vs expenses by day"));
    s.append(svg)
        .append(CAPTION)
        .append("<span style=\"color:" + INCOME + "; font-weight:bold;\">Income</span> and ")
        .append("<span style=\"color:" + EXPENSE + "; font-weight:bold;\">expenses</span> per ")
        .append(yearly ? "month" : "day")
        .append(".</p>");
    return s.append(CLOSE).toString();
  }

  private static String rect(
      double x, double base, double bw, BigDecimal v, BigDecimal max, double plotH, String color) {
    if (v.signum() <= 0) return "";
    double bh = Math.max(0.8, v.doubleValue() / max.doubleValue() * (plotH - 6));
    return String.format(
        Locale.ENGLISH,
        "<rect x=\"%.1f\" y=\"%.1f\" width=\"%.1f\" height=\"%.1f\" fill=\"%s\"/>",
        x,
        base - bh,
        bw,
        bh,
        color);
  }

  // ── 9. category × month heatmap (yearly) ──────────────────────────────────

  private String heatmap(List<CategoryRow> rows) {
    if (rows.isEmpty()) return "";
    BigDecimal max =
        rows.stream()
            .flatMap(r -> r.months().stream())
            .max(BigDecimal::compareTo)
            .orElse(BigDecimal.ZERO);
    StringBuilder s = new StringBuilder(open("Categories month by month"));
    s.append("<table cellspacing=\"2\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;")
        .append(" font-size:7px;\"><tr><td style=\"width:18%;\"></td>");
    for (Month m : Month.values()) {
      s.append("<td style=\"text-align:center; color:#718096;\">")
          .append(m.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
          .append("</td>");
    }
    s.append("</tr>");
    for (CategoryRow r : rows) {
      s.append("<tr><td style=\"font-size:8px;\">")
          .append(ReportHtmlBuilder.esc(r.category()))
          .append("</td>");
      for (BigDecimal v : r.months()) {
        int lv = ReportChartHtml.level(v, max);
        s.append("<td style=\"height:16px; text-align:center; border-radius:3px; background:")
            .append(ReportChartHtml.SCALE[lv])
            .append("; color:")
            .append(lv >= 3 ? "#ffffff" : "#1a202c")
            .append(";\">")
            .append(v.signum() > 0 ? ReportChartHtml.compact(v) : "")
            .append("</td>");
      }
      s.append("</tr>");
    }
    s.append("</table>")
        .append(CAPTION)
        .append("Top categories; darker = more spent that month.</p>");
    return s.append(CLOSE).toString();
  }

  // ── 10–13. rankings ───────────────────────────────────────────────────────

  private String txTable(String title, List<TxLine> lines, String shareOf) {
    if (lines.isEmpty()) return "";
    StringBuilder s = new StringBuilder(open(title));
    s.append("<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; font-size:9px;\"><tr>")
        .append(TH)
        .append("#</th>")
        .append(TH)
        .append("Date</th>")
        .append(TH)
        .append("Name</th>")
        .append(TH)
        .append("Category</th>")
        .append(TH)
        .append("Amount</th>")
        .append(TH)
        .append("Share ")
        .append(shareOf)
        .append("</th></tr>");
    int i = 1;
    for (TxLine t : lines) {
      s.append("<tr>")
          .append(TD)
          .append(i++)
          .append("</td>")
          .append(TD)
          .append(t.date())
          .append("</td>")
          .append(TD)
          .append(ReportHtmlBuilder.esc(t.name() == null ? "(no name)" : t.name()))
          .append("</td>")
          .append(TD)
          .append(ReportHtmlBuilder.esc(t.category()))
          .append("</td>")
          .append(TDR)
          .append("<b>")
          .append(money(t.amount()))
          .append("</b></td>")
          .append(TD)
          .append(miniBar(t.percentOfTotal(), MAIN))
          .append(" ")
          .append(pct(t.percentOfTotal()))
          .append("</td></tr>");
    }
    s.append("</table>");
    return s.append(CLOSE).toString();
  }

  private static String miniBar(double percent, String color) {
    int w = (int) Math.max(1, Math.min(40, Math.round(percent * 0.4)));
    return "<span style=\"display:inline-block; width:"
        + w
        + "px; height:6px; border-radius:2px; background:"
        + color
        + ";\"></span>";
  }

  private String payeeTable(String title, List<Payee> payees) {
    if (payees.isEmpty()) return "";
    StringBuilder s = new StringBuilder(open(title));
    s.append("<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; font-size:9px;\"><tr>")
        .append(TH)
        .append("Name</th>")
        .append(TH)
        .append("Times</th>")
        .append(TH)
        .append("Total</th>")
        .append(TH)
        .append("Average</th></tr>");
    for (Payee p : payees) {
      s.append("<tr>")
          .append(TD)
          .append(ReportHtmlBuilder.esc(p.name()))
          .append("</td>")
          .append(TD)
          .append(p.count())
          .append("×</td>")
          .append(TD)
          .append("<b>")
          .append(money(p.total()))
          .append("</b></td>")
          .append(TD)
          .append(money(p.total().divide(BigDecimal.valueOf(p.count()), 2, RoundingMode.HALF_UP)))
          .append("</td></tr>");
    }
    s.append("</table>");
    return s.append(CLOSE).toString();
  }

  // ── 14–15. distribution & split ───────────────────────────────────────────

  private String sizeDistribution(List<Bucket> buckets) {
    int maxCount = buckets.stream().mapToInt(Bucket::count).max().orElse(0);
    if (maxCount == 0) return "";
    StringBuilder s = new StringBuilder(open("Expense sizes"));
    s.append("<table cellspacing=\"0\" cellpadding=\"2\" style=\"width:100%; font-size:9px;\">");
    for (int i = 0; i < buckets.size(); i++) {
      Bucket b = buckets.get(i);
      int w =
          ReportChartHtml.widthPercent(BigDecimal.valueOf(b.count()), BigDecimal.valueOf(maxCount));
      s.append("<tr><td style=\"width:14%;\">")
          .append(b.label())
          .append(" ")
          .append(currency == null ? "" : currency)
          .append(
              "</td><td style=\"width:50%;\"><div style=\"height:10px; border-radius:2px; width:")
          .append(w)
          .append("%; background:")
          .append(ReportChartHtml.SCALE[Math.min(4, i + 1)])
          .append(";\"></div></td><td style=\"width:12%; text-align:right;\">")
          .append(b.count())
          .append("×</td><td style=\"width:24%; text-align:right;\">")
          .append(money(b.total()))
          .append("</td></tr>");
    }
    s.append("</table>")
        .append(CAPTION)
        .append("How many expenses fall in each size range, and how much they add up to.</p>");
    return s.append(CLOSE).toString();
  }

  private String weekendSplit(Stats st) {
    BigDecimal total = st.weekdaySpend().add(st.weekendSpend());
    if (total.signum() <= 0) return "";
    double weekendPct = ReportAggregator.percent(st.weekendSpend(), total);
    StringBuilder s = new StringBuilder(open("Weekdays vs weekend"));
    s.append(
        "<table cellspacing=\"0\" cellpadding=\"0\" style=\"width:100%; table-layout:fixed;\"><tr>");
    if (st.weekdaySpend().signum() > 0) {
      s.append(
          "<td style=\"height:12px; font-size:0; line-height:0; background:#6366f1;\">&#160;</td>");
    }
    if (st.weekendSpend().signum() > 0) {
      s.append("<td style=\"height:12px; font-size:0; line-height:0; width:")
          .append(Math.max(1, Math.round(weekendPct)))
          .append("%; background:#f59e0b;\">&#160;</td>");
    }
    s.append("</tr></table>")
        .append(CAPTION)
        .append("<span style=\"color:#6366f1; font-weight:bold;\">Mon–Fri</span> ")
        .append(money(st.weekdaySpend()))
        .append(" · ")
        .append(pct(100 - weekendPct))
        .append(" &#160; <span style=\"color:#f59e0b; font-weight:bold;\">Sat–Sun</span> ")
        .append(money(st.weekendSpend()))
        .append(" · ")
        .append(pct(weekendPct))
        .append(" (2 of 7 days = 28.6% if spending were even).</p>");
    return s.append(CLOSE).toString();
  }

  // ── SVG line chart helper ─────────────────────────────────────────────────

  static final class LineChart {
    private LineChart() {}

    static StringBuilder frame(
        double w, double h, double left, double plotH, BigDecimal min, BigDecimal max) {
      StringBuilder s =
          new StringBuilder(
              String.format(
                  Locale.ENGLISH,
                  "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%.0f\" height=\"%.0f\""
                      + " viewBox=\"0 0 %.0f %.0f\">",
                  w,
                  h,
                  w,
                  h));
      for (int g = 0; g <= 3; g++) {
        double y = 6 + (plotH - 6) * g / 3.0;
        BigDecimal v = max.subtract(max.subtract(min).multiply(BigDecimal.valueOf(g / 3.0)));
        s.append(
            String.format(
                Locale.ENGLISH,
                "<line x1=\"%.1f\" y1=\"%.1f\" x2=\"%.1f\" y2=\"%.1f\" stroke=\"%s\""
                    + " stroke-width=\"0.6\"/>",
                left,
                y,
                w - 4,
                y,
                GRID));
        s.append(text(left - 4, y + 3, ReportChartHtml.compact(v), "end"));
      }
      return s;
    }

    static String text(double x, double y, String label, String anchor) {
      return String.format(
          Locale.ENGLISH,
          "<text x=\"%.1f\" y=\"%.1f\" text-anchor=\"%s\" font-family=\"sans-serif\""
              + " font-size=\"7\" fill=\"%s\">%s</text>",
          x,
          y,
          anchor,
          MUTED,
          label);
    }

    static String svg(
        List<BigDecimal> main,
        List<BigDecimal> secondary,
        List<String> labels,
        String color,
        boolean fromZero) {
      double w = 520;
      double h = 140;
      double left = 44;
      double plotH = h - 20;
      List<BigDecimal> all = new ArrayList<>(main);
      if (secondary != null) all.addAll(secondary);
      BigDecimal max = all.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ONE);
      BigDecimal min =
          fromZero ? BigDecimal.ZERO : all.stream().min(BigDecimal::compareTo).orElseThrow();
      if (max.compareTo(min) == 0) max = min.add(BigDecimal.ONE);
      int n = Math.max(main.size(), secondary == null ? 0 : secondary.size());
      StringBuilder s = frame(w, h, left, plotH, min, max);
      if (secondary != null) {
        s.append(
            polyline(
                secondary, n, w, left, plotH, min, max, "#94a3b8", " stroke-dasharray=\"4 3\""));
      }
      String pts = points(main, n, w, left, plotH, min, max);
      if (fromZero) {
        double lastX = x(main.size() - 1, n, w, left);
        s.append(
            String.format(
                Locale.ENGLISH,
                "<polygon points=\"%.1f,%.1f %s %.1f,%.1f\" fill=\"%s\" fill-opacity=\"0.12\"/>",
                left,
                plotH,
                pts,
                lastX,
                plotH,
                color));
      }
      s.append("<polyline points=\"")
          .append(pts)
          .append("\" fill=\"none\" stroke=\"")
          .append(color)
          .append("\" stroke-width=\"2\"/>");
      for (int i = 0; i < labels.size(); i++) {
        if (!labels.get(i).isEmpty())
          s.append(text(x(i, n, w, left), h - 6, labels.get(i), "middle"));
      }
      return s.append("</svg>").toString();
    }

    private static double x(int i, int n, double w, double left) {
      return left + (n <= 1 ? 0 : i * (w - left - 8) / (n - 1));
    }

    private static String points(
        List<BigDecimal> v,
        int n,
        double w,
        double left,
        double plotH,
        BigDecimal min,
        BigDecimal max) {
      StringBuilder s = new StringBuilder();
      double range = max.subtract(min).doubleValue();
      for (int i = 0; i < v.size(); i++) {
        double y = 6 + (plotH - 6) * (1 - (v.get(i).subtract(min).doubleValue() / range));
        s.append(String.format(Locale.ENGLISH, "%.1f,%.1f ", x(i, n, w, left), y));
      }
      return s.toString().trim();
    }

    private static String polyline(
        List<BigDecimal> v,
        int n,
        double w,
        double left,
        double plotH,
        BigDecimal min,
        BigDecimal max,
        String color,
        String extra) {
      return "<polyline points=\""
          + points(v, n, w, left, plotH, min, max)
          + "\" fill=\"none\" stroke=\""
          + color
          + "\" stroke-width=\"1.5\""
          + extra
          + "/>";
    }
  }
}
