package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;

/**
 * One (root) category's total for a period. {@code percentOfTotal} is the share of the period's
 * income or expense total; {@code previousAmount} is the previous-year figure (yearly report only,
 * null elsewhere or when there is no previous data).
 */
public record CategoryTotal(
    String name, BigDecimal amount, double percentOfTotal, BigDecimal previousAmount) {}
