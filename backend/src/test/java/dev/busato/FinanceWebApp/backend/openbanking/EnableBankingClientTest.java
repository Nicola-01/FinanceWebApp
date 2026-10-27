package dev.busato.FinanceWebApp.backend.openbanking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class EnableBankingClientTest {

  private static KeyPair pair;
  private static Path pem;

  @BeforeAll
  static void key(@TempDir Path dir) throws Exception {
    KeyPairGenerator g = KeyPairGenerator.getInstance("RSA");
    g.initialize(2048);
    pair = g.generateKeyPair();
    pem = dir.resolve("key.pem");
    String b64 =
        Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(pair.getPrivate().getEncoded());
    Files.writeString(pem, "-----BEGIN PRIVATE KEY-----\n" + b64 + "\n-----END PRIVATE KEY-----\n");
  }

  private MockRestServiceServer server;

  private EnableBankingClient client() {
    RestClient.Builder b = RestClient.builder();
    server = MockRestServiceServer.bindTo(b).build();
    return new EnableBankingClient(
        b,
        new EnableBankingProperties("test-app", pem.toString(), "https://api.enablebanking.com"),
        Clock.systemUTC());
  }

  @Test
  void signsJwtWithKid() {
    EnableBankingClient c = client();
    AtomicReference<String> auth = new AtomicReference<>();
    server
        .expect(requestTo("https://api.enablebanking.com/aspsps?country=IT"))
        .andExpect(r -> auth.set(r.getHeaders().getFirst("Authorization")))
        .andRespond(withSuccess("{\"aspsps\":[]}", MediaType.APPLICATION_JSON));
    c.listAspsps("IT");

    String jwt = auth.get().substring("Bearer ".length());
    Jws<Claims> parsed =
        Jwts.parserBuilder().setSigningKey(pair.getPublic()).build().parseClaimsJws(jwt);
    assertThat(parsed.getHeader().getKeyId()).isEqualTo("test-app");
    assertThat(parsed.getBody().getAudience()).isEqualTo("api.enablebanking.com");
    assertThat(parsed.getBody().getIssuer()).isEqualTo("enablebanking.com");
  }

  @Test
  void listAspspsParsesMaxConsent() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/aspsps?country=IT"))
        .andRespond(
            withSuccess(
                "{\"aspsps\":[{\"name\":\"UniCredit\",\"country\":\"IT\",\"maximum_consent_validity\":15552000,\"x\":1}]}",
                MediaType.APPLICATION_JSON));
    assertThat(c.listAspsps("IT")).containsExactly(new Aspsp("UniCredit", "IT", 15552000L));
  }

  @Test
  void getTransactionsFlattensAndPaginates() {
    EnableBankingClient c = client();
    server
        .expect(
            requestTo(
                "https://api.enablebanking.com/accounts/acc1/transactions?date_from=2026-01-01"))
        .andRespond(
            withSuccess(
                "{\"transactions\":[{\"entry_reference\":\"e1\",\"transaction_amount\":{\"amount\":\"12.50\",\"currency\":\"EUR\"},"
                    + "\"credit_debit_indicator\":\"DBIT\",\"status\":\"BOOK\",\"booking_date\":\"2026-01-02\","
                    + "\"creditor\":{\"name\":\"ESSELUNGA\"},\"remittance_information\":[\"spesa\"]}],\"continuation_key\":\"k2\"}",
                MediaType.APPLICATION_JSON));
    EbTransactionPage page = c.getTransactions("acc1", LocalDate.of(2026, 1, 1), null, null);

    assertThat(page.continuationKey()).isEqualTo("k2");
    EbTransaction t = page.transactions().get(0);
    assertThat(t.amount()).isEqualByComparingTo(new BigDecimal("12.50"));
    assertThat(t.currency()).isEqualTo("EUR");
    assertThat(t.creditDebitIndicator()).isEqualTo("DBIT");
    assertThat(t.creditorName()).isEqualTo("ESSELUNGA");
    assertThat(t.bookingDate()).isEqualTo(LocalDate.of(2026, 1, 2));
    assertThat(t.remittanceInformation()).containsExactly("spesa");
  }

  @Test
  void psuHeadersSentWhenPresent() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/accounts/a/transactions"))
        .andExpect(header("Psu-Ip-Address", "1.2.3.4"))
        .andExpect(header("Psu-User-Agent", "UA"))
        .andRespond(withSuccess("{\"transactions\":[]}", MediaType.APPLICATION_JSON));
    c.getTransactions("a", null, null, new PsuContext("1.2.3.4", "UA"));
    server.verify();

    server.reset();
    server
        .expect(requestTo("https://api.enablebanking.com/accounts/a/transactions"))
        .andExpect(headerDoesNotExist("Psu-Ip-Address"))
        .andExpect(headerDoesNotExist("Psu-User-Agent"))
        .andRespond(withSuccess("{\"transactions\":[]}", MediaType.APPLICATION_JSON));
    c.getTransactions("a", null, null, null);
    server.verify();
  }

  @Test
  void non2xxThrowsWithStatus() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/sessions/s1"))
        .andRespond(withStatus(HttpStatus.UNAUTHORIZED));
    assertThatThrownBy(() -> c.getSession("s1"))
        .isInstanceOfSatisfying(
            EnableBankingException.class, e -> assertThat(e.status()).isEqualTo(401));
  }

  @Test
  void sessionFallsBackToAccountsData() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/sessions"))
        .andExpect(r -> assertThat(r.getMethod()).isEqualTo(HttpMethod.POST))
        .andRespond(
            withSuccess(
                "{\"session_id\":\"s\",\"accounts\":[],\"accounts_data\":[{\"uid\":\"u1\",\"account_id\":{\"iban\":\"IT00\"},\"currency\":\"EUR\"}]}",
                MediaType.APPLICATION_JSON));
    EbSession s = c.createSession("code");
    assertThat(s.sessionId()).isEqualTo("s");
    assertThat(s.accounts()).containsExactly(new EbAccount("u1", "IT00", null, "EUR"));
  }

  @Test
  void loadsPkcs1Key(@TempDir Path dir) throws Exception {
    // A 2048-bit PKCS#8 key is the PKCS#1 key behind a 26-byte header.
    byte[] pkcs8 = pair.getPrivate().getEncoded();
    byte[] pkcs1 = java.util.Arrays.copyOfRange(pkcs8, 26, pkcs8.length);
    Path p1 = dir.resolve("rsa.pem");
    Files.writeString(
        p1,
        "-----BEGIN RSA PRIVATE KEY-----\n"
            + Base64.getMimeEncoder().encodeToString(pkcs1)
            + "\n-----END RSA PRIVATE KEY-----\n");
    RestClient.Builder b = RestClient.builder();
    server = MockRestServiceServer.bindTo(b).build();
    EnableBankingClient c =
        new EnableBankingClient(
            b,
            new EnableBankingProperties("test-app", p1.toString(), "https://api.enablebanking.com"),
            Clock.systemUTC());
    AtomicReference<String> auth = new AtomicReference<>();
    server
        .expect(requestTo("https://api.enablebanking.com/aspsps?country=IT"))
        .andExpect(r -> auth.set(r.getHeaders().getFirst("Authorization")))
        .andRespond(withSuccess("{\"aspsps\":[]}", MediaType.APPLICATION_JSON));
    c.listAspsps("IT");
    Jwts.parserBuilder()
        .setSigningKey(pair.getPublic())
        .build()
        .parseClaimsJws(auth.get().substring(7));
  }

  @Test
  void notConfiguredWhenAppIdBlank() {
    EnableBankingClient c =
        new EnableBankingClient(
            RestClient.builder(),
            new EnableBankingProperties("", "", "https://api.enablebanking.com"),
            Clock.systemUTC());
    assertThat(c.configured()).isFalse();
  }

  @Test
  void continuationKeyIsStrictlyEncoded() {
    EnableBankingClient c = client();
    server
        .expect(
            requestTo(
                "https://api.enablebanking.com/accounts/a/transactions?date_from=2026-01-01&continuation_key=a%2Bb%2Fc%3D%26d%7Bx%7D"))
        .andRespond(withSuccess("{\"transactions\":[]}", MediaType.APPLICATION_JSON));
    c.getTransactions("a", LocalDate.of(2026, 1, 1), "a+b/c=&d{x}", null);
    server.verify();
  }

  @Test
  void startAuthSendsBodyAndReturnsUrl() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/auth"))
        .andExpect(method(HttpMethod.POST))
        .andExpect(jsonPath("$.access.valid_until").value("2026-05-01T10:00:00Z"))
        .andExpect(jsonPath("$.aspsp.name").value("UniCredit"))
        .andExpect(jsonPath("$.aspsp.country").value("IT"))
        .andExpect(jsonPath("$.state").value("st"))
        .andExpect(jsonPath("$.redirect_url").value("https://app/cb"))
        .andExpect(jsonPath("$.psu_type").value("personal"))
        .andRespond(withSuccess("{\"url\":\"https://bank/auth\"}", MediaType.APPLICATION_JSON));
    String url =
        c.startAuth(
            new Aspsp("UniCredit", "IT", null),
            Instant.parse("2026-05-01T10:00:00.123456Z"),
            "https://app/cb",
            "st");
    assertThat(url).isEqualTo("https://bank/auth");
  }

  @Test
  void emptyBodyThrows() {
    EnableBankingClient c = client();
    server.expect(requestTo("https://api.enablebanking.com/sessions/s1")).andRespond(withSuccess());
    assertThatThrownBy(() -> c.getSession("s1")).isInstanceOf(EnableBankingException.class);
  }

  @Test
  void deleteSessionSendsDeleteAndSwallowsErrors() {
    EnableBankingClient c = client();
    server
        .expect(requestTo("https://api.enablebanking.com/sessions/s1"))
        .andExpect(method(HttpMethod.DELETE))
        .andRespond(withStatus(HttpStatus.NO_CONTENT));
    c.deleteSession("s1");
    server.verify();

    server.reset();
    server
        .expect(requestTo("https://api.enablebanking.com/sessions/s1"))
        .andRespond(withStatus(HttpStatus.NOT_FOUND));
    c.deleteSession("s1");
    server.verify();
  }

  @Test
  void jwtIsCachedAndRefreshedBeforeExpiry() {
    var now =
        new java.util.concurrent.atomic.AtomicReference<>(Instant.parse("2026-01-01T00:00:00Z"));
    Clock clock =
        new Clock() {
          public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
          }

          public Clock withZone(java.time.ZoneId z) {
            return this;
          }

          public Instant instant() {
            return now.get();
          }
        };
    RestClient.Builder b = RestClient.builder();
    server = MockRestServiceServer.bindTo(b).build();
    EnableBankingClient c =
        new EnableBankingClient(
            b,
            new EnableBankingProperties(
                "test-app", pem.toString(), "https://api.enablebanking.com"),
            clock);
    java.util.List<String> tokens = new java.util.ArrayList<>();
    for (int i = 0; i < 3; i++) {
      server
          .expect(requestTo("https://api.enablebanking.com/aspsps?country=IT"))
          .andExpect(r -> tokens.add(r.getHeaders().getFirst("Authorization")))
          .andRespond(withSuccess("{\"aspsps\":[]}", MediaType.APPLICATION_JSON));
    }
    c.listAspsps("IT");
    now.set(now.get().plusSeconds(3600 - 301));
    c.listAspsps("IT");
    now.set(now.get().plusSeconds(2));
    c.listAspsps("IT");
    assertThat(tokens.get(1)).isEqualTo(tokens.get(0));
    assertThat(tokens.get(2)).isNotEqualTo(tokens.get(0));
  }
}
