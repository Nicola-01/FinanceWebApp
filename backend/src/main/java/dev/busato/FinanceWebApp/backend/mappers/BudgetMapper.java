package dev.busato.FinanceWebApp.backend.mappers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BudgetMapper {

  public static final List<Integer> DEFAULT_THRESHOLDS = List.of(80, 100);
  private static final int MAX_THRESHOLDS = 5;

  private final ObjectMapper objectMapper;

  /**
   * Validates, dedupes and sorts the thresholds, then serializes them for the column. Null means
   * "use the default"; an explicit empty list disables alerts.
   */
  public String thresholdsToJson(List<Integer> thresholds) {
    List<Integer> effective = thresholds == null ? DEFAULT_THRESHOLDS : thresholds;
    if (effective.stream().anyMatch(t -> t == null || t < 1 || t > 200))
      throw new IllegalArgumentException("Alert thresholds must be between 1 and 200.");
    List<Integer> clean = effective.stream().distinct().sorted().toList();
    if (clean.size() > MAX_THRESHOLDS)
      throw new IllegalArgumentException("At most " + MAX_THRESHOLDS + " alert thresholds.");
    try {
      return objectMapper.writeValueAsString(clean);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid alert thresholds.", e);
    }
  }

  public List<Integer> thresholdsFromJson(String json) {
    if (json == null || json.isBlank()) return List.of();
    try {
      return objectMapper.readValue(json, new TypeReference<List<Integer>>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  /** Entity-field half of the response; the service fills in the computed fields. */
  public BudgetStatusResponse.BudgetStatusResponseBuilder baseResponse(Budget budget) {
    return BudgetStatusResponse.builder()
        .id(budget.getId())
        .name(budget.getName())
        .tagName(budget.getTag() != null ? budget.getTag().getName() : null)
        .limitAmount(budget.getLimitAmount())
        .periodType(budget.getPeriodType())
        .startDate(budget.getStartDate())
        .endDate(budget.getEndDate())
        .rollover(budget.isRollover())
        .alertThresholds(thresholdsFromJson(budget.getAlertThresholds()));
  }
}
