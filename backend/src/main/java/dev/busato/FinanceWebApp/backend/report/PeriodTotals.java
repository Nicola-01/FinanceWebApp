package dev.busato.FinanceWebApp.backend.report;

import java.math.BigDecimal;

/**
 * Totals for one report period, in the wallet currency. Income and expense exclude investment tags;
 * {@code invested} (bought) and {@code cashedOut} are the investment-tagged flows.
 */
public record PeriodTotals(
    BigDecimal income,
    BigDecimal expense,
    BigDecimal net,
    BigDecimal invested,
    BigDecimal cashedOut) {

  /** Invested net: money put into investments minus money taken back out. */
  public BigDecimal investedNet() {
    return invested.subtract(cashedOut);
  }

  /** What is left in cash after spending and the net investment flow. */
  public BigDecimal liquidityLeft() {
    return income.subtract(expense).subtract(investedNet());
  }
}
