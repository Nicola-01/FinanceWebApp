package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionMapperTest {
    @Mock
    private TagMapper tagMapper;
    @InjectMocks
    private TransactionMapper transactionMapper;

    @Test
    void mapToResponse_WithAllFields_ShouldMapCorrectly() {
        Tag mockTag = new Tag();
        mockTag.setName("TestTag");
        TagResponse mockTagResponse = TagResponse.builder().name("TestTag").build();
        when(tagMapper.mapToResponse(mockTag)).thenReturn(mockTagResponse);
        Subscription subscription = new Subscription();
        subscription.setId(UUID.randomUUID());
        Transaction transaction = new Transaction();
        transaction.setId(UUID.randomUUID());
        transaction.setName("Test Transaction");
        transaction.setAmount(BigDecimal.valueOf(100.0));
        transaction.setOriginalAmount(BigDecimal.valueOf(100.0));
        transaction.setOriginalCurrency("EUR");
        transaction.setExchangeValue(BigDecimal.valueOf(1.0));
        transaction.setTag(mockTag);
        transaction.setSubscription(subscription);
        transaction.setTransactionDate(LocalDate.now());
        transaction.setType(Transaction.Type.EXPENSE);
        transaction.setNotes("Notes");
        TransactionResponse response = transactionMapper.mapToResponse(transaction);
        assertNotNull(response);
        assertEquals(transaction.getId(), response.getId());
        assertEquals("Test Transaction", response.getName());
        assertEquals(BigDecimal.valueOf(100.0), response.getAmount());
        assertEquals(BigDecimal.valueOf(100.0), response.getOriginalAmount());
        assertEquals("EUR", response.getOriginalCurrency());
        assertEquals(BigDecimal.valueOf(1.0), response.getExchangeValue());
        assertEquals(mockTagResponse, response.getTag());
        assertEquals(subscription.getId(), response.getSubscriptionId());
        assertEquals(transaction.getTransactionDate(), response.getTransactionDate());
        assertEquals("EXPENSE", response.getType());
        assertEquals("Notes", response.getNotes());
    }

    @Test
    void mapToResponse_WithNullTagAndSubscription_ShouldMapCorrectly() {
        Transaction transaction = new Transaction();
        transaction.setId(UUID.randomUUID());
        transaction.setType(Transaction.Type.INCOME);
        transaction.setTag(null);
        transaction.setSubscription(null);
        TransactionResponse response = transactionMapper.mapToResponse(transaction);
        assertNotNull(response);
        assertNull(response.getTag());
        assertNull(response.getSubscriptionId());
        assertEquals("INCOME", response.getType());
    }
}
