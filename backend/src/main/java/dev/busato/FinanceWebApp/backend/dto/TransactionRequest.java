package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TransactionRequest {
    private String name;

    private String tag;

    private UUID subscriptionId;

    private BigDecimal amount;
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal exchangeValue;

    private String type;
    private String notes;

    private LocalDate transactionDate;;


}
