package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Wrapped-style records for the yearly report. {@code fastestGrowingCategory}/{@code
 * fastestGrowingIncrease} are null when the previous year has no transactions; the expense records
 * are null for a year without expenses.
 */
public record YearRecords(
    String biggestExpenseName,
    LocalDate biggestExpenseDate,
    BigDecimal biggestExpenseAmount,
    LocalDate mostExpensiveDay,
    BigDecimal mostExpensiveDayTotal,
    YearMonth mostActiveMonth,
    long mostActiveMonthCount,
    long totalTransactions,
    String fastestGrowingCategory,
    BigDecimal fastestGrowingIncrease) {}
