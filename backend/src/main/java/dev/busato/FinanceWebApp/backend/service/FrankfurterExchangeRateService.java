package dev.busato.FinanceWebApp.backend.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Fetches daily reference rates from the Frankfurter <b>v2</b> API ({@code GET
 * /rates?base=B&quotes=Q} → {@code [{date, base, quote, rate}]}). Results are memoised per pair for
 * the current day: Frankfurter publishes rates ~once a day, so one network call per pair per day is
 * enough (and keeps a cron run that touches many subscriptions cheap).
 */
@Slf4j
@Service
public class FrankfurterExchangeRateService implements ExchangeRateService {

  private final RestClient restClient;
  private final Clock clock;
  private final Map<String, CachedRate> cache = new ConcurrentHashMap<>();

  public FrankfurterExchangeRateService(
      RestClient.Builder builder,
      @Value("${application.exchange.url:https://api.frankfurter.dev/v2}") String baseUrl,
      Clock clock) {
    this.restClient = builder.baseUrl(baseUrl).build();
    this.clock = clock;
  }

  @Override
  public Optional<BigDecimal> getRate(String base, String quote) {
    if (base == null || quote == null) return Optional.empty();
    if (base.equals(quote)) return Optional.of(BigDecimal.ONE);

    String today = LocalDate.now(clock).toString();
    String key = base + "|" + quote;
    CachedRate cached = cache.get(key);
    if (cached != null && cached.date().equals(today)) return Optional.of(cached.rate());

    try {
      FrankfurterRate[] rows =
          restClient
              .get()
              .uri("/rates?base={base}&quotes={quote}", base, quote)
              .retrieve()
              .body(FrankfurterRate[].class);
      if (rows != null && rows.length > 0 && rows[0].rate() != null) {
        BigDecimal rate = rows[0].rate();
        cache.put(key, new CachedRate(rate, today));
        return Optional.of(rate);
      }
      log.warn("Frankfurter returned no rate for {} -> {}", base, quote);
    } catch (Exception e) {
      log.warn("Failed to fetch exchange rate {} -> {}: {}", base, quote, e.getMessage());
    }
    return Optional.empty();
  }

  private record CachedRate(BigDecimal rate, String date) {}

  /** One row of the Frankfurter v2 {@code /rates} response. */
  record FrankfurterRate(String date, String base, String quote, BigDecimal rate) {}
}
