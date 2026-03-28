package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class SubscriptionRequest {
    private String name;
    private String tag; // Nome del tag
    private BigDecimal amount;
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal exchangeValue;
    private boolean autoExchangeRate;
    private String type; // INCOME, EXPENSE
    private String notes;
    private String status; // ACTIVE, PAUSED, COMPLETED

    // Regole di Schedulazione
    private LocalDate startDate;
    private String frequencyType; // DAILY, WEEKLY, MONTHLY, YEARLY
    private int frequencyInterval; // Es: ogni 1 mese, ogni 2 settimane

    // Opzioni avanzate (possono essere null)
    private Integer monthlySpecificDay;
    private boolean lastWorkingDayOfMonth;

    // Regole di Durata
    private String duration; // FOREVER, TIMES, UNTIL
    private Integer durationTimes;
    private LocalDate durationUntil;
}