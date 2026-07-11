package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;

/** Income / expense / net for one report period, in the wallet currency. */
public record PeriodTotals(BigDecimal income, BigDecimal expense, BigDecimal net) {}
