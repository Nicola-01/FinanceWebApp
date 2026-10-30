package dev.busato.FinanceWebApp.backend.openbanking;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Thin client for the EnableBanking (PSD2) API, authenticating with a self-signed RS256 JWT. */
@Slf4j
@Component
@EnableConfigurationProperties(EnableBankingProperties.class)
public class EnableBankingClient {

  private static final long TOKEN_TTL_SECONDS = 3600;
  private static final long REFRESH_MARGIN_SECONDS = 300;

  private final RestClient restClient;
  private final EnableBankingProperties props;
  private final Clock clock;

  private PrivateKey key;
  private String token;
  private Instant tokenExpiry = Instant.EPOCH;

  public EnableBankingClient(
      RestClient.Builder builder, EnableBankingProperties props, Clock clock) {
    this.props = props;
    this.clock = clock;
    this.restClient = builder.baseUrl(props.apiUrl()).build();
  }

  public boolean configured() {
    return notBlank(props.appId()) && notBlank(props.privateKeyPath());
  }

  public List<Aspsp> listAspsps(String country) {
    RawAspsps r = send(restClient.get().uri("/aspsps?country={c}", country), RawAspsps.class);
    return r == null || r.aspsps == null ? List.of() : r.aspsps;
  }

  /** Starts the PSU authorization and returns the bank URL to redirect the user to. */
  public String startAuth(Aspsp aspsp, Instant validUntil, String redirectUrl, String state) {
    Map<String, Object> body =
        Map.of(
            "access",
            Map.of("valid_until", validUntil.truncatedTo(ChronoUnit.SECONDS).toString()),
            "aspsp",
            Map.of("name", aspsp.name(), "country", aspsp.country()),
            "state",
            state,
            "redirect_url",
            redirectUrl,
            "psu_type",
            "personal");
    return required(send(restClient.post().uri("/auth").body(body), RawAuth.class)).url;
  }

  public EbSession createSession(String code) {
    return toSession(
        required(
            send(restClient.post().uri("/sessions").body(Map.of("code", code)), RawSession.class)));
  }

  public EbSession getSession(String sessionId) {
    return toSession(
        required(send(restClient.get().uri("/sessions/{id}", sessionId), RawSession.class)));
  }

  public EbTransactionPage getTransactions(
      String accountUid, LocalDate dateFrom, String continuationKey, PsuContext psu) {
    // Values go in as URI variables so they are strictly encoded (+, &, =, /, { ...).
    Map<String, Object> vars = new HashMap<>();
    vars.put("uid", accountUid);
    StringBuilder tpl = new StringBuilder("/accounts/{uid}/transactions");
    String sep = "?";
    if (dateFrom != null) {
      tpl.append(sep).append("date_from={from}");
      vars.put("from", dateFrom.toString());
      sep = "&";
    }
    if (continuationKey != null) {
      tpl.append(sep).append("continuation_key={ck}");
      vars.put("ck", continuationKey);
    }
    RestClient.RequestHeadersSpec<?> spec = restClient.get().uri(tpl.toString(), vars);
    if (psu != null) {
      spec =
          spec.header("Psu-Ip-Address", psu.ipAddress()).header("Psu-User-Agent", psu.userAgent());
    }
    RawTxPage r = send(spec, RawTxPage.class);
    List<EbTransaction> txs =
        r == null || r.transactions == null
            ? List.of()
            : r.transactions.stream().map(RawTx::toDto).toList();
    return new EbTransactionPage(txs, r == null ? null : r.continuationKey);
  }

  /** Best effort: failures (including 404 for an already-gone session) are only logged. */
  public void deleteSession(String sessionId) {
    try {
      restClient
          .delete()
          .uri("/sessions/{id}", sessionId)
          .header("Authorization", "Bearer " + jwt())
          .retrieve()
          .toBodilessEntity();
    } catch (Exception e) {
      log.debug("Ignoring EnableBanking session delete failure: {}", e.getMessage());
    }
  }

  // ---- plumbing ----

  private <T> T send(RestClient.RequestHeadersSpec<?> spec, Class<T> type) {
    return spec.header("Authorization", "Bearer " + jwt())
        .retrieve()
        .onStatus(
            HttpStatusCode::isError,
            (req, res) -> {
              // Body only goes to the log: the exception message is surfaced in the UI.
              String body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
              log.warn(
                  "EnableBanking {} {} -> {}: {}",
                  req.getMethod(),
                  req.getURI().getPath(),
                  res.getStatusCode(),
                  body.length() > 1000 ? body.substring(0, 1000) : body);
              throw new EnableBankingException(
                  res.getStatusCode().value(),
                  "EnableBanking "
                      + req.getMethod()
                      + " "
                      + req.getURI().getPath()
                      + " failed: "
                      + res.getStatusCode());
            })
        .body(type);
  }

  private static <T> T required(T body) {
    if (body == null) throw new EnableBankingException(502, "EnableBanking returned an empty body");
    return body;
  }

  private synchronized String jwt() {
    Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
    if (token == null || now.isAfter(tokenExpiry.minusSeconds(REFRESH_MARGIN_SECONDS))) {
      tokenExpiry = now.plusSeconds(TOKEN_TTL_SECONDS);
      token =
          Jwts.builder()
              .setHeaderParam("kid", props.appId())
              .setIssuer("enablebanking.com")
              .setAudience("api.enablebanking.com")
              .setIssuedAt(Date.from(now))
              .setExpiration(Date.from(tokenExpiry))
              .signWith(privateKey(), SignatureAlgorithm.RS256)
              .compact();
    }
    return token;
  }

  private PrivateKey privateKey() {
    if (key == null) {
      try {
        String pem = Files.readString(Path.of(props.privateKeyPath()));
        boolean pkcs1 = pem.contains("BEGIN RSA PRIVATE KEY");
        byte[] der =
            Base64.getMimeDecoder()
                .decode(pem.replaceAll("-----[A-Z ]+-----", "").getBytes(StandardCharsets.UTF_8));
        key =
            KeyFactory.getInstance("RSA")
                .generatePrivate(new PKCS8EncodedKeySpec(pkcs1 ? wrapPkcs1(der) : der));
      } catch (Exception e) {
        throw new IllegalStateException("Cannot load EnableBanking private key", e);
      }
    }
    return key;
  }

  /** Wraps a PKCS#1 RSAPrivateKey DER in a PKCS#8 PrivateKeyInfo envelope. */
  private static byte[] wrapPkcs1(byte[] pkcs1) {
    // version 0 + rsaEncryption AlgorithmIdentifier
    byte[] head = {
      0x02,
      0x01,
      0x00,
      0x30,
      0x0d,
      0x06,
      0x09,
      0x2a,
      (byte) 0x86,
      0x48,
      (byte) 0x86,
      (byte) 0xf7,
      0x0d,
      0x01,
      0x01,
      0x01,
      0x05,
      0x00
    };
    ByteArrayOutputStream octet = new ByteArrayOutputStream();
    octet.write(0x04);
    writeLen(octet, pkcs1.length);
    octet.writeBytes(pkcs1);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    out.write(0x30);
    writeLen(out, head.length + octet.size());
    out.writeBytes(head);
    out.writeBytes(octet.toByteArray());
    return out.toByteArray();
  }

  private static void writeLen(ByteArrayOutputStream o, int len) {
    if (len < 128) {
      o.write(len);
    } else if (len < 256) {
      o.write(0x81);
      o.write(len);
    } else if (len < 65536) {
      o.write(0x82);
      o.write(len >> 8);
      o.write(len & 0xff);
    } else {
      o.write(0x83);
      o.write(len >> 16);
      o.write((len >> 8) & 0xff);
      o.write(len & 0xff);
    }
  }

  private static boolean notBlank(String s) {
    return s != null && !s.isBlank();
  }

  private static EbSession toSession(RawSession r) {
    // Some banks (e.g. UniCredit) return `accounts` empty and fill `accounts_data` instead.
    List<RawAccount> raw =
        r.accounts != null && !r.accounts.isEmpty() ? r.accounts : r.accountsData;
    List<EbAccount> accounts =
        raw == null
            ? List.of()
            : raw.stream()
                .map(
                    a ->
                        new EbAccount(
                            a.uid,
                            a.accountId == null ? null : a.accountId.iban,
                            a.name,
                            a.currency,
                            a.identificationHash))
                .toList();
    return new EbSession(r.sessionId, accounts);
  }

  // ---- raw wire records ----

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawAspsps(List<Aspsp> aspsps) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawAuth(String url) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawIban(String iban) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawAccount(
      String uid,
      @JsonProperty("account_id") RawIban accountId,
      String name,
      String currency,
      @JsonProperty("identification_hash") String identificationHash) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawSession(
      @JsonProperty("session_id") String sessionId,
      List<RawAccount> accounts,
      @JsonProperty("accounts_data") List<RawAccount> accountsData) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawAmount(BigDecimal amount, String currency) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawParty(String name) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawTx(
      @JsonProperty("entry_reference") String entryReference,
      @JsonProperty("transaction_id") String transactionId,
      @JsonProperty("transaction_amount") RawAmount transactionAmount,
      @JsonProperty("credit_debit_indicator") String creditDebitIndicator,
      String status,
      @JsonProperty("booking_date") LocalDate bookingDate,
      @JsonProperty("value_date") LocalDate valueDate,
      RawParty creditor,
      RawParty debtor,
      @JsonProperty("remittance_information") List<String> remittanceInformation) {
    EbTransaction toDto() {
      return new EbTransaction(
          entryReference,
          transactionId,
          transactionAmount == null ? null : transactionAmount.amount,
          transactionAmount == null ? null : transactionAmount.currency,
          creditDebitIndicator,
          status,
          bookingDate,
          valueDate,
          creditor == null ? null : creditor.name,
          debtor == null ? null : debtor.name,
          remittanceInformation == null ? List.of() : remittanceInformation);
    }
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  private record RawTxPage(
      List<RawTx> transactions, @JsonProperty("continuation_key") String continuationKey) {}
}
