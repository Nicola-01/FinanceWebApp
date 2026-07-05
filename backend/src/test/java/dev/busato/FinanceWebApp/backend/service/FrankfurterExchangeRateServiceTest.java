package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class FrankfurterExchangeRateServiceTest {

  private static final String BASE_URL = "https://api.frankfurter.dev/v2";

  private MockRestServiceServer server;
  private FrankfurterExchangeRateService service;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder();
    server = MockRestServiceServer.bindTo(builder).build();
    Clock clock = Clock.fixed(Instant.parse("2026-07-04T10:00:00Z"), ZoneId.of("UTC"));
    service = new FrankfurterExchangeRateService(builder, BASE_URL, clock);
  }

  @Test
  void getRate_parsesV2ArrayAndCachesForTheDay() {
    server
        .expect(ExpectedCount.once(), requestTo(BASE_URL + "/rates?base=USD&quotes=EUR"))
        .andRespond(
            withSuccess(
                "[{\"date\":\"2026-07-04\",\"base\":\"USD\",\"quote\":\"EUR\",\"rate\":0.8738}]",
                MediaType.APPLICATION_JSON));

    Optional<BigDecimal> first = service.getRate("USD", "EUR");
    Optional<BigDecimal> second = service.getRate("USD", "EUR"); // served from the cache

    assertTrue(first.isPresent());
    assertEquals(0, first.get().compareTo(new BigDecimal("0.8738")));
    assertEquals(first, second);
    server.verify(); // exactly one HTTP call happened
  }

  @Test
  void getRate_sameCurrency_returnsOneWithoutCallingApi() {
    assertEquals(0, service.getRate("EUR", "EUR").orElseThrow().compareTo(BigDecimal.ONE));
    server.verify(); // no request expected
  }

  @Test
  void getRate_nullArgs_returnsEmpty() {
    assertTrue(service.getRate(null, "EUR").isEmpty());
    assertTrue(service.getRate("USD", null).isEmpty());
  }

  @Test
  void getRate_serverError_returnsEmpty() {
    server.expect(requestTo(BASE_URL + "/rates?base=USD&quotes=GBP")).andRespond(withServerError());

    assertTrue(service.getRate("USD", "GBP").isEmpty());
    server.verify();
  }

  @Test
  void getRate_emptyArray_returnsEmpty() {
    server
        .expect(requestTo(BASE_URL + "/rates?base=USD&quotes=CHF"))
        .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

    assertTrue(service.getRate("USD", "CHF").isEmpty());
    server.verify();
  }
}
