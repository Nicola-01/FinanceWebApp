package dev.busato.FinanceWebApp.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

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

  private List<TransactionResponse> history;
}
