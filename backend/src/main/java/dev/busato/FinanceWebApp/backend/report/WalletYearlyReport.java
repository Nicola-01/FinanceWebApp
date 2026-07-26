package dev.busato.FinanceWebApp.backend.report;

import java.time.YearMonth;
import java.util.List;

/**
 * One wallet's section of the yearly wrap-up. {@code previousTotals} is null without prior data.
 */
public record WalletYearlyReport(
    String walletName,
    String walletColor,
    String currency,
    int year,
    PeriodTotals totals,
    PeriodTotals previousTotals,
    List<MonthRow> months,
    YearMonth bestMonth,
    YearMonth worstMonth,
    List<CategoryTotal> topExpenseCategories,
    List<CategoryTotal> topIncomeCategories,
    YearRecords records,
    int transactionCount) {}
