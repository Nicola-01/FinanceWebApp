package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubscriptionMapper {

  private final TagMapper tagMapper;
  private final TransactionMapper transactionMapper;

  public SubscriptionResponse mapToResponse(Subscription sub) {
    return SubscriptionResponse.builder()
        .id(sub.getId())
        .name(sub.getName())
        .tag(sub.getTag() != null ? tagMapper.mapToResponse(sub.getTag()) : null)
        .amount(sub.getAmount())
        .amountPending(sub.isAmountPending())
        .originalAmount(sub.getOriginalAmount())
        .originalCurrency(sub.getOriginalCurrency())
        .exchangeValue(sub.getExchangeValue())
        .autoExchangeRate(sub.isAutoExchangeRate())
        .type(sub.getType().toString())
        .notes(sub.getNotes())
        .status(sub.getStatus().toString())
        .bankRuleId(sub.getBankRule() == null ? null : sub.getBankRule().getId())
        .bankRuleName(sub.getBankRule() == null ? null : sub.getBankRule().getName())
        .bankDriven(sub.isBankDriven())
        .startDate(sub.getStartDate())
        .nextExecutionDate(sub.getNextExecutionDate())
        .lastExecutionDate(sub.getLastExecutionDate())
        .frequencyType(sub.getFrequencyType().toString())
        .frequencyInterval(sub.getFrequencyInterval())
        .monthlySpecificDay(sub.getMonthlySpecificDay())
        .lastWorkingDayOfMonth(sub.isLastWorkingDayOfMonth())
        .monthlyWorkingDay(sub.getMonthlyWorkingDay())
        .monthlyWeekday(sub.getMonthlyWeekday())
        .monthlyWeekdayOrdinal(sub.getMonthlyWeekdayOrdinal())
        .duration(sub.getDuration().toString())
        .durationTimes(sub.getDurationTimes())
        .executedTimes(sub.getExecutedTimes())
        .durationUntil(sub.getDurationUntil())
        .history(
            sub.getHistory() != null
                ? sub.getHistory().stream().map(transactionMapper::mapToResponse).toList()
                : null)
        .updatedAt(sub.getUpdatedAt())
        .build();
  }
}
