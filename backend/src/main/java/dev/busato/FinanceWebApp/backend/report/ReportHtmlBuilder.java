package dev.busato.FinanceWebApp.backend.report;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Fills the report templates ({@code {{token}}} replace, same mechanism as SendEmailService).
 * Repeated blocks (wallet sections, category rows) are built here and injected as single tokens.
 * Everything user-controlled is escaped; wallet colors are constrained to hex literals because they
 * land inside style attributes.
 */
@Component
public class ReportHtmlBuilder {

  private static final java.util.regex.Pattern HEX_COLOR =
      java.util.regex.Pattern.compile("^#[0-9a-fA-F]{6}$");
  private static final String FALLBACK_COLOR = "#b829ff";

  @Value("${application.frontend.url}")
  private String frontendUrl;

  // ── monthly ───────────────────────────────────────────────────────────────

  public String monthlyEmailBody(
      String username, YearMonth period, List<WalletMonthlyReport> reports) {
    StringBuilder highlights = new StringBuilder();
    for (WalletMonthlyReport r : reports) {
      highlights.append(emailHighlightRow(r));
    }
    return load("templates/email/monthlyReportEmail.html")
        .replace("{{period}}", monthLabel(period))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{appUrl}}", frontendUrl)
        .replace("{{highlights}}", highlights.toString());
  }

  public String monthlyPdfHtml(
      String username, YearMonth period, List<WalletMonthlyReport> reports) {
    StringBuilder sections = new StringBuilder();
    for (WalletMonthlyReport r : reports) {
      sections.append(monthlySection(r));
    }
    return load("templates/report/monthlyReportPdf.html")
        .replace("{{period}}", monthLabel(period))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{walletSections}}", sections.toString());
  }

  private String emailHighlightRow(WalletMonthlyReport r) {
    String netClass = r.totals().net().signum() < 0 ? "#dc2626" : "#059669";
    return """
        <div style="display:flex; justify-content:space-between; padding:10px 12px; \
        border:1px solid #e2e8f0; border-left:4px solid %s; border-radius:8px; margin-bottom:8px;">\
        <span style="font-weight:600;">%s</span>\
        <span style="font-weight:700; color:%s;">%s</span></div>"""
        .formatted(
            sanitizeHexColor(r.walletColor()),
            HtmlUtils.htmlEscape(r.walletName()),
            netClass,
            formatAmount(r.totals().net(), r.currency()));
  }

  private String monthlySection(WalletMonthlyReport r) {
    StringBuilder s = new StringBuilder();
    s.append("<div class=\"wallet\">");
    s.append("<h2 style=\"border-left-color:")
        .append(sanitizeHexColor(r.walletColor()))
        .append(";\">")
        .append(HtmlUtils.htmlEscape(r.walletName()))
        .append("</h2>");
    s.append("<table class=\"kpi\">");
    s.append(
        kpiRow(
            "Income",
            r.totals().income(),
            r.previousTotals() == null ? null : r.previousTotals().income(),
            r.currency(),
            false));
    s.append(
        kpiRow(
            "Expenses",
            r.totals().expense(),
            r.previousTotals() == null ? null : r.previousTotals().expense(),
            r.currency(),
            false));
    s.append(
        kpiRow(
            "Net",
            r.totals().net(),
            r.previousTotals() == null ? null : r.previousTotals().net(),
            r.currency(),
            true));
    s.append(kpiRow("Balance at end of month", r.endBalance(), null, r.currency(), true));
    s.append("</table>");
    s.append(
        categoryBlock("Top expense categories", r.topExpenseCategories(), r.currency(), "#dc2626"));
    s.append(
        categoryBlock("Top income categories", r.topIncomeCategories(), r.currency(), "#059669"));
    s.append("</div>");
    return s.toString();
  }

  // ── shared fragment helpers (also used by the yearly builder in Task 7) ───

  String kpiRow(
      String label, BigDecimal value, BigDecimal previous, String currency, boolean signed) {
    String cls = signed ? (value.signum() < 0 ? " neg" : " pos") : "";
    StringBuilder row = new StringBuilder();
    row.append("<tr><td class=\"label\">")
        .append(label)
        .append("</td><td class=\"amount")
        .append(cls)
        .append("\">")
        .append(formatAmount(value, currency));
    if (previous != null) {
      BigDecimal diff = value.subtract(previous);
      row.append("<div class=\"delta\">")
          .append(diff.signum() >= 0 ? "+" : "")
          .append(formatAmount(diff, currency))
          .append(" vs previous month</div>");
    }
    row.append("</td></tr>");
    return row.toString();
  }

  String categoryBlock(
      String title, List<CategoryTotal> categories, String currency, String barColor) {
    if (categories.isEmpty()) return "";
    StringBuilder s = new StringBuilder("<h3>").append(title).append("</h3>");
    for (CategoryTotal c : categories) {
      s.append("<div class=\"catrow\"><span class=\"catname\">")
          .append(HtmlUtils.htmlEscape(c.name()))
          .append(
              "</span><span class=\"barwrap\"><span class=\"bar\" style=\"display:block; width:")
          .append(Math.max(2, Math.min(100, (int) Math.round(c.percentOfTotal()))))
          .append("%; background:")
          .append(barColor)
          .append(";\"></span></span><span class=\"catamount\">")
          .append(formatAmount(c.amount(), currency))
          .append(" · ")
          .append(String.format(Locale.ENGLISH, "%.1f", c.percentOfTotal()))
          .append("%</span></div>");
    }
    return s.toString();
  }

  static String monthLabel(YearMonth period) {
    return period.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        + " "
        + period.getYear();
  }

  static String formatAmount(BigDecimal amount, String currency) {
    NumberFormat nf = NumberFormat.getNumberInstance(Locale.ENGLISH);
    nf.setMinimumFractionDigits(2);
    nf.setMaximumFractionDigits(2);
    return nf.format(amount) + " " + (currency == null ? "" : currency);
  }

  static String sanitizeHexColor(String color) {
    return color != null && HEX_COLOR.matcher(color).matches() ? color : FALLBACK_COLOR;
  }

  // ── yearly ────────────────────────────────────────────────────────────────

  public String yearlyEmailBody(String username, int year, List<WalletYearlyReport> reports) {
    StringBuilder highlights = new StringBuilder();
    for (WalletYearlyReport r : reports) {
      highlights.append(yearlyHighlightRow(r));
    }
    return load("templates/email/yearlyReportEmail.html")
        .replace("{{year}}", String.valueOf(year))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{appUrl}}", frontendUrl)
        .replace("{{highlights}}", highlights.toString());
  }

  public String yearlyPdfHtml(String username, int year, List<WalletYearlyReport> reports) {
    StringBuilder sections = new StringBuilder();
    for (WalletYearlyReport r : reports) {
      sections.append(yearlySection(r));
    }
    return load("templates/report/yearlyReportPdf.html")
        .replace("{{year}}", String.valueOf(year))
        .replace("{{username}}", HtmlUtils.htmlEscape(username))
        .replace("{{walletSections}}", sections.toString());
  }

  private String yearlyHighlightRow(WalletYearlyReport r) {
    String netColor = r.totals().net().signum() < 0 ? "#dc2626" : "#059669";
    return """
        <div style="display:flex; justify-content:space-between; padding:10px 12px; \
        border:1px solid #e2e8f0; border-left:4px solid %s; border-radius:8px; margin-bottom:8px;">\
        <span style="font-weight:600;">%s</span>\
        <span style="font-weight:700; color:%s;">%s</span></div>"""
        .formatted(
            sanitizeHexColor(r.walletColor()),
            HtmlUtils.htmlEscape(r.walletName()),
            netColor,
            formatAmount(r.totals().net(), r.currency()));
  }

  private String yearlySection(WalletYearlyReport r) {
    StringBuilder s = new StringBuilder();
    s.append("<div class=\"wallet\">");
    s.append("<h2 style=\"border-left-color:")
        .append(sanitizeHexColor(r.walletColor()))
        .append(";\">")
        .append(HtmlUtils.htmlEscape(r.walletName()))
        .append("</h2>");
    s.append("<table class=\"kpi\">");
    s.append(
        yearKpiRow(
            "Income",
            r.totals().income(),
            r.previousTotals() == null ? null : r.previousTotals().income(),
            r.currency(),
            false));
    s.append(
        yearKpiRow(
            "Expenses",
            r.totals().expense(),
            r.previousTotals() == null ? null : r.previousTotals().expense(),
            r.currency(),
            false));
    s.append(
        yearKpiRow(
            "Net",
            r.totals().net(),
            r.previousTotals() == null ? null : r.previousTotals().net(),
            r.currency(),
            true));
    s.append("</table>");
    s.append(monthTable(r));
    s.append(
        categoryBlock("Top expense categories", r.topExpenseCategories(), r.currency(), "#dc2626"));
    s.append(
        categoryBlock("Top income categories", r.topIncomeCategories(), r.currency(), "#059669"));
    s.append(recordsBlock(r.records(), r.currency()));
    s.append("</div>");
    return s.toString();
  }

  /** Same as kpiRow but the delta line reads "vs previous year". */
  private String yearKpiRow(
      String label, BigDecimal value, BigDecimal previous, String currency, boolean signed) {
    return kpiRow(label, value, previous, currency, signed)
        .replace("vs previous month", "vs previous year");
  }

  private String monthTable(WalletYearlyReport r) {
    StringBuilder s =
        new StringBuilder(
            "<h3>Month by month</h3><table class=\"months\">"
                + "<tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th></tr>");
    for (MonthRow m : r.months()) {
      String cls =
          m.month().equals(r.bestMonth())
              ? " class=\"best\""
              : m.month().equals(r.worstMonth()) ? " class=\"worst\"" : "";
      s.append("<tr")
          .append(cls)
          .append("><td>")
          .append(m.month().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
          .append("</td><td>")
          .append(formatAmount(m.income(), r.currency()))
          .append("</td><td>")
          .append(formatAmount(m.expense(), r.currency()))
          .append("</td><td>")
          .append(formatAmount(m.net(), r.currency()))
          .append("</td></tr>");
    }
    s.append("</table>");
    return s.toString();
  }

  private String recordsBlock(YearRecords rec, String currency) {
    StringBuilder s = new StringBuilder("<h3>Records &amp; fun facts</h3><div class=\"records\">");
    if (rec.biggestExpenseName() != null) {
      s.append(
          record(
              "Biggest expense",
              HtmlUtils.htmlEscape(rec.biggestExpenseName())
                  + " — "
                  + formatAmount(rec.biggestExpenseAmount(), currency)));
      s.append(
          record(
              "Most expensive day",
              rec.mostExpensiveDay()
                  + " — "
                  + formatAmount(rec.mostExpensiveDayTotal(), currency)));
    }
    if (rec.mostActiveMonth() != null) {
      s.append(
          record(
              "Most active month",
              rec.mostActiveMonth().getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
                  + " — "
                  + rec.mostActiveMonthCount()
                  + " transactions"));
    }
    s.append(record("Total transactions", String.valueOf(rec.totalTransactions())));
    if (rec.fastestGrowingCategory() != null) {
      s.append(
          record(
              "Fastest growing category",
              HtmlUtils.htmlEscape(rec.fastestGrowingCategory())
                  + " (+"
                  + formatAmount(rec.fastestGrowingIncrease(), currency)
                  + ")"));
    }
    s.append("</div>");
    return s.toString();
  }

  private static String record(String label, String value) {
    return "<span class=\"record\"><span class=\"label\">"
        + label
        + "</span><span class=\"value\">"
        + value
        + "</span></span>";
  }

  String load(String path) {
    try {
      return new String(
          new ClassPathResource(path).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IllegalStateException("Error loading report template " + path, e);
    }
  }
}
