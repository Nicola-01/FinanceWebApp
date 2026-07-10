package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Budget;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetRequest {
  @NotBlank(message = "Name is required")
  @Size(min = 3, max = 25, message = "The name must be between 3 and 25 characters long.")
  private String name;

  // Null tracks the whole wallet; otherwise must match a tag of this wallet by name.
  private String tagName;

  @NotNull(message = "Limit amount is required")
  @DecimalMin(value = "0.01", message = "The limit must be greater than zero.")
  private BigDecimal limitAmount;

  @NotNull(message = "Period type is required")
  private Budget.PeriodType periodType;

  private LocalDate startDate; // null -> today
  private LocalDate endDate; // required iff CUSTOM
  private Boolean rollover; // null -> false; ignored (stored false) for CUSTOM
  private List<Integer> alertThresholds; // null -> [80,100]; empty -> alerts disabled
}
