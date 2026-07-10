package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetStatusResponse {
  // Entity fields
  private UUID id;
  private String name;
  private String tagName; // null = whole-wallet budget
  private BigDecimal limitAmount;
  private Budget.PeriodType periodType;
  private LocalDate startDate;
  private LocalDate endDate;
  private boolean rollover;
  private List<Integer> alertThresholds;

  // Computed for the current period (see spec §2.2)
  private LocalDate periodStart;
  private LocalDate periodEnd;
  private BigDecimal spent;
  private BigDecimal effectiveLimit; // limitAmount + rollover carry
  private BigDecimal remaining;
  private int percentUsed; // floored; pinned to 100 when effectiveLimit <= 0
  private String status; // "OK" | "WARNING" | "EXCEEDED"
  private List<Integer> crossedThresholds;
  private boolean active;
}
