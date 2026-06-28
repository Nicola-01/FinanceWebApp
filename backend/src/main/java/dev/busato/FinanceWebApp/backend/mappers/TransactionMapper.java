package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TransactionMapper {

    private final TagMapper tagMapper;

    public TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .name(transaction.getName())
                .amount(transaction.getAmount())
                .originalAmount(transaction.getOriginalAmount())
                .originalCurrency(transaction.getOriginalCurrency())
                .exchangeValue(transaction.getExchangeValue())
                .tag(transaction.getTag() != null ? tagMapper.mapToResponse(transaction.getTag()) : null)
                .subscriptionId(transaction.getSubscription() != null ? transaction.getSubscription().getId() : null)
                .transactionDate(transaction.getTransactionDate())
                .type(transaction.getType().toString())
                .notes(transaction.getNotes())
                .build();
    }
}
