package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * One wallet's section of the monthly report. {@code previousTotals} is null without prior data.
 */
public record WalletMonthlyReport(
    String walletName,
    String walletColor,
    String currency,
    YearMonth period,
    PeriodTotals totals,
    PeriodTotals previousTotals,
    BigDecimal endBalance,
    List<CategoryTotal> topExpenseCategories,
    List<CategoryTotal> topIncomeCategories,
    int transactionCount) {}
