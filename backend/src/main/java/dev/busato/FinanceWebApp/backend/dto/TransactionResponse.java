package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID id;

    private String name;

    private TagDTO tag;

    private BigDecimal amount;
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal exchangeVale;

    private String type;
    private String notes;

    private LocalDate transactionDate;;


}
