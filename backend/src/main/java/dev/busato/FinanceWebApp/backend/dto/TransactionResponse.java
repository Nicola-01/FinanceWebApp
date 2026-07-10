package dev.busato.FinanceWebApp.backend.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionResponse {
  private UUID id;

  private String name;

  private TagResponse tag;

  private UUID subscriptionId;

  private BigDecimal amount;
  private boolean amountPending;
  private BigDecimal originalAmount;
  private String originalCurrency;
  private BigDecimal exchangeValue;

  private String type;
  private String notes;

  private LocalDate transactionDate;

  private Instant updatedAt;
}
