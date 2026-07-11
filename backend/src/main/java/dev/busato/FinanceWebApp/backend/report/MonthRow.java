package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;
import java.time.YearMonth;

/** One month's line in the yearly wrap-up. */
public record MonthRow(
    YearMonth month,
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net,
    long transactionCount) {}
