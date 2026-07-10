package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionMapperTest {
  @Mock private TagMapper tagMapper;
  @Mock private TransactionMapper transactionMapper;
  @InjectMocks private SubscriptionMapper subscriptionMapper;

  @Test
  void mapToResponse_WithAllFields_ShouldMapCorrectly() {
    Tag mockTag = new Tag();
    mockTag.setName("TestTag");
    TagResponse mockTagResponse = TagResponse.builder().name("TestTag").build();
    when(tagMapper.mapToResponse(mockTag)).thenReturn(mockTagResponse);
    Subscription subscription = new Subscription();
    subscription.setId(UUID.randomUUID());
    subscription.setName("Test Sub");
    subscription.setTag(mockTag);
    subscription.setAmount(BigDecimal.valueOf(100.0));
    subscription.setOriginalAmount(BigDecimal.valueOf(100.0));
    subscription.setOriginalCurrency("EUR");
    subscription.setExchangeValue(BigDecimal.valueOf(1.0));
    subscription.setAutoExchangeRate(true);
    subscription.setType(Subscription.Type.EXPENSE);
    subscription.setNotes("Notes");
    subscription.setStatus(Subscription.Status.ACTIVE);
    subscription.setFrequencyType(Subscription.Frequency.MONTHLY);
    subscription.setFrequencyInterval(1);
    subscription.setMonthlySpecificDay(15);
    subscription.setLastWorkingDayOfMonth(false);
    subscription.setDuration(Subscription.Duration.FOREVER);
    subscription.setHistory(null);
    Instant updatedAt = Instant.now();
    subscription.setUpdatedAt(updatedAt);
    SubscriptionResponse response = subscriptionMapper.mapToResponse(subscription);
    assertNotNull(response);
    assertEquals(subscription.getId(), response.getId());
    assertEquals("Test Sub", response.getName());
    assertEquals(mockTagResponse, response.getTag());
    assertEquals(BigDecimal.valueOf(100.0), response.getAmount());
    assertEquals(BigDecimal.valueOf(100.0), response.getOriginalAmount());
    assertEquals("EUR", response.getOriginalCurrency());
    assertEquals(BigDecimal.valueOf(1.0), response.getExchangeValue());
    assertTrue(response.isAutoExchangeRate());
    assertEquals("EXPENSE", response.getType());
    assertEquals("Notes", response.getNotes());
    assertEquals("ACTIVE", response.getStatus());
    assertEquals("MONTHLY", response.getFrequencyType());
    assertEquals(1, response.getFrequencyInterval());
    assertEquals(15, response.getMonthlySpecificDay());
    assertFalse(response.isLastWorkingDayOfMonth());
    assertEquals("FOREVER", response.getDuration());
    assertNull(response.getHistory());
    assertEquals(updatedAt, response.getUpdatedAt());
  }

  @Test
  void mapToResponse_WithNulls_ShouldMapCorrectly() {
    Subscription subscription = new Subscription();
    subscription.setId(UUID.randomUUID());
    subscription.setType(Subscription.Type.INCOME);
    subscription.setStatus(Subscription.Status.PAUSED);
    subscription.setFrequencyType(Subscription.Frequency.YEARLY);
    subscription.setDuration(Subscription.Duration.UNTIL);
    subscription.setTag(null);
    subscription.setHistory(null);
    SubscriptionResponse response = subscriptionMapper.mapToResponse(subscription);
    assertNotNull(response);
    assertNull(response.getTag());
    assertNull(response.getHistory());
    assertEquals("INCOME", response.getType());
  }

  @Test
  void mapToResponse_ReminderSubscription_MapsAmountPending() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Salary");
    sub.setAmount(BigDecimal.ZERO);
    sub.setOriginalAmount(BigDecimal.ZERO);
    sub.setAmountPending(true);
    sub.setType(Subscription.Type.INCOME);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setDuration(Subscription.Duration.FOREVER);

    SubscriptionResponse response = subscriptionMapper.mapToResponse(sub);

    assertTrue(response.isAmountPending());
  }
}
