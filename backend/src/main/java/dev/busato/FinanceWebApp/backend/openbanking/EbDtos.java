package dev.busato.FinanceWebApp.backend.openbanking;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Public, flattened views of the EnableBanking API objects used by the open-banking feature. */
public final class EbDtos {

  private EbDtos() {}

  /** A bank; {@code maximumConsentValidity} is in seconds and may be null. */
  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Aspsp(
      String name,
      String country,
      @JsonProperty("maximum_consent_validity") Long maximumConsentValidity) {}

  /**
   * {@code uid} is only valid within its session; {@code identificationHash} identifies the same
   * account across sessions (EnableBanking: "can be used for matching accounts between multiple
   * sessions").
   */
  public record EbAccount(
      String uid, String iban, String name, String currency, String identificationHash) {}

  public record EbSession(String sessionId, List<EbAccount> accounts) {}

  public record EbTransaction(
      String entryReference,
      String transactionId,
      BigDecimal amount,
      String currency,
      String creditDebitIndicator,
      String status,
      LocalDate bookingDate,
      LocalDate valueDate,
      String creditorName,
      String debtorName,
      List<String> remittanceInformation) {}

  public record EbTransactionPage(List<EbTransaction> transactions, String continuationKey) {}

  /** End-user context forwarded to the bank; a null context means an unattended call. */
  public record PsuContext(String ipAddress, String userAgent) {}
}
