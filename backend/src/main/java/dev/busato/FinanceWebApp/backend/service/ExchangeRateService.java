package dev.busato.FinanceWebApp.backend.service;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Provides currency conversion rates ({@code base -> quote}). Used at subscription execution time
 * to convert a foreign-currency amount with the day's rate when the subscription opts in.
 */
public interface ExchangeRateService {

  /**
   * @return the {@code base -> quote} rate, or empty when it can't be determined (bad input,
   *     network/API failure). Callers should fall back to a stored value rather than fail.
   */
  Optional<BigDecimal> getRate(String base, String quote);
}
