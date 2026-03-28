package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SubscriptionResponse {
    private UUID id;
    private String name;
    private TagResponse tag;
    private BigDecimal amount;
    private BigDecimal originalAmount;
    private String originalCurrency;
    private BigDecimal exchangeValue;
    private boolean autoExchangeRate;
    private String type;
    private String notes;
    private String status;

    private LocalDate startDate;
    private LocalDate nextExecutionDate;
    private LocalDate lastExecutionDate;

    private String frequencyType;
    private int frequencyInterval;
    private Integer monthlySpecificDay;
    private boolean lastWorkingDayOfMonth;

    private String duration;
    private Integer durationTimes;
    private int executedTimes;
    private LocalDate durationUntil;
}