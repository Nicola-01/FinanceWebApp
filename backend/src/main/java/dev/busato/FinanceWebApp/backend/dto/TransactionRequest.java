package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionRequest {
  @NotBlank(message = "Name is required")
  private String name;

  private String tag;

  private UUID subscriptionId;

  private BigDecimal amount;
  private BigDecimal originalAmount;
  private String originalCurrency;
  private BigDecimal exchangeValue;

  private String type;
  private String notes;

  private LocalDate transactionDate;
  ;
}
