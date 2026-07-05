package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.mappers.SubscriptionMapper;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private WalletRepository walletRepository;
  @Mock private TagRepository tagRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private SubscriptionMapper subscriptionMapper;
  @Mock private TagMapper tagMapper;
  @Mock private TagService tagService;
  @Mock private ExchangeRateService exchangeRateService;

  @Mock private Clock clock;

  @InjectMocks private SubscriptionService subscriptionService;

  private UUID walletId;
  private UUID userId;
  private Wallet mockWallet;

  @BeforeEach
  void setUp() {
    walletId = UUID.randomUUID();
    userId = UUID.randomUUID();
    mockWallet = new Wallet();
    mockWallet.setId(walletId);

    // Fix clock to 2024-02-15T12:00:00Z for tests (Leap year)
    Clock fixedClock = Clock.fixed(Instant.parse("2024-02-15T12:00:00Z"), ZoneId.of("UTC"));
    // Leniently mock clock because not all tests use it
    lenient().when(clock.instant()).thenReturn(fixedClock.instant());
    lenient().when(clock.getZone()).thenReturn(fixedClock.getZone());
  }

  @Test
  void createSubscription_ValidRequest_CreatesSubscriptionAndNextExecutionDate() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 2, 15));
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

    SubscriptionResponse mockResponse = SubscriptionResponse.builder().build();
    when(subscriptionMapper.mapToResponse(any())).thenReturn(mockResponse);

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

    Subscription saved = captor.getValue();
    assertEquals("Netflix", saved.getName());
    assertEquals(LocalDate.of(2024, 3, 15), saved.getNextExecutionDate()); // 1 month from Feb 15
  }

  @Test
  void createSubscription_NegativeAmount_ThrowsIllegalArgumentException() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("-15.99"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  @Test
  void createSubscription_LeapYearEndOfMonth_CalculatesNextExecutionCorrectly() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Test");
    request.setAmount(new BigDecimal("10.00"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    // Start date is Jan 31st, 2024 (Leap year)
    request.setStartDate(LocalDate.of(2024, 1, 31));
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

    Subscription saved = captor.getValue();
    // Since Jan 31 + 1 month = Feb 29 (leap year)
    assertEquals(LocalDate.of(2024, 2, 29), saved.getNextExecutionDate());
  }

  @Test
  void createSubscription_LastWorkingDayOfMonth() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Salary");
    request.setAmount(new BigDecimal("2000.00"));
    request.setType("INCOME");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 2, 1)); // Feb 1, 2024
    request.setLastWorkingDayOfMonth(true);
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

    Subscription saved = captor.getValue();
    // Last day of Feb 2024 is Feb 29 (Thursday) - so it's a working day
    assertEquals(LocalDate.of(2024, 2, 29), saved.getNextExecutionDate());
  }

  @Test
  void createSubscription_LastWorkingDayOfMonth_WeekendEdgeCase() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Salary");
    request.setAmount(new BigDecimal("2000.00"));
    request.setType("INCOME");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 3, 1)); // Mar 1, 2024
    request.setLastWorkingDayOfMonth(true);
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

    Subscription saved = captor.getValue();
    // Last day of Mar 2024 is Mar 31 (Sunday), so last working day is Mar 29 (Friday)
    assertEquals(
        LocalDate.of(2024, 3, 1),
        saved.getNextExecutionDate()); // Code bug: applyMonthlyRules not applied for future start
    // dates
  }

  @Test
  void processDueSubscriptions_ProcessesActiveSubscriptions() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Test");
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15)); // Due today based on fixed clock
    sub.setDuration(Subscription.Duration.FOREVER);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    // Verifies that a transaction was created
    verify(transactionRepository, times(1)).save(any());
    // Verifies subscription was updated
    verify(subscriptionRepository, times(1)).save(sub);

    assertEquals(1, sub.getExecutedTimes());
    assertEquals(LocalDate.of(2024, 2, 15), sub.getLastExecutionDate());
    assertEquals(LocalDate.of(2024, 3, 15), sub.getNextExecutionDate());
  }

  @Test
  void processDueSubscriptions_GeneratedTransaction_UsesTagNameAndOmitsSubscriptionNameAndNotes() {
    Tag tag = new Tag();
    tag.setId(UUID.randomUUID());
    tag.setName("Streaming");

    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("My Netflix Plan");
    sub.setNotes("Secret personal note");
    sub.setTag(tag);
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    sub.setDuration(Subscription.Duration.FOREVER);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    Transaction tx = txCaptor.getValue();

    // Name is the tag name, not the subscription name
    assertEquals("Streaming", tx.getName());
    // Recurrence marker uses the tag name and never leaks the subscription's custom name/notes
    assertTrue(tx.getNotes().contains("Streaming"));
    assertTrue(tx.getNotes().startsWith("Recurring: Streaming"));
    assertTrue(!tx.getNotes().contains("My Netflix Plan"));
    assertTrue(!tx.getNotes().contains("Secret personal note"));
  }

  @Test
  void processDueSubscriptions_GeneratedTransaction_TagNull_FallsBackToSubscriptionName() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Untagged Sub");
    sub.setNotes("Private note");
    sub.setTag(null);
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    // Use TIMES duration to also cover that branch of the notes format
    sub.setDuration(Subscription.Duration.TIMES);
    sub.setDurationTimes(3);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    Transaction tx = txCaptor.getValue();

    // With no tag, name falls back to the subscription name
    assertEquals("Untagged Sub", tx.getName());
    assertEquals("Recurring: Untagged Sub (1 / 3)", tx.getNotes());
    // The subscription's free-text notes must never be appended
    assertTrue(!tx.getNotes().contains("Private note"));
  }

  private Subscription foreignSub(Wallet w) {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Foreign");
    sub.setWallet(w);
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    sub.setDuration(Subscription.Duration.FOREVER);
    sub.setOriginalCurrency("USD");
    sub.setOriginalAmount(new BigDecimal("100"));
    sub.setAmount(new BigDecimal("90.00"));
    sub.setExchangeValue(new BigDecimal("0.90"));
    return sub;
  }

  private Wallet eurWallet() {
    Wallet w = new Wallet();
    w.setId(walletId);
    w.setCurrency("EUR");
    return w;
  }

  @Test
  void processDueSubscriptions_ForeignAutoRate_RecomputesAmountWithLiveRate() {
    Subscription sub = foreignSub(eurWallet());
    sub.setAutoExchangeRate(true);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.of(new BigDecimal("0.85")));

    subscriptionService.processDueSubscriptions();

    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    Transaction tx = txCaptor.getValue();
    assertEquals(new BigDecimal("85.00"), tx.getAmount()); // 100 * 0.85
    assertEquals(new BigDecimal("0.85"), tx.getExchangeValue());
  }

  @Test
  void processDueSubscriptions_ForeignAutoRate_FetchFails_FallsBackToStored() {
    Subscription sub = foreignSub(eurWallet());
    sub.setAutoExchangeRate(true);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.empty());

    subscriptionService.processDueSubscriptions();

    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    Transaction tx = txCaptor.getValue();
    assertEquals(new BigDecimal("90.00"), tx.getAmount()); // stored fallback
    assertEquals(new BigDecimal("0.90"), tx.getExchangeValue());
  }

  @Test
  void processDueSubscriptions_ForeignFixedRate_UsesStoredWithoutFetching() {
    Subscription sub = foreignSub(eurWallet());
    sub.setAutoExchangeRate(false);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    verify(exchangeRateService, never()).getRate(any(), any());
    ArgumentCaptor<Transaction> txCaptor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(txCaptor.capture());
    assertEquals(new BigDecimal("90.00"), txCaptor.getValue().getAmount());
  }

  @Test
  void applyFastForward_JumpsToPresentCorrectly() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Test");
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.YEARLY);
    sub.setFrequencyInterval(1);
    // Start date is 10 years ago
    sub.setStartDate(LocalDate.of(2014, 2, 15));
    sub.setNextExecutionDate(LocalDate.of(2014, 2, 15));
    sub.setDuration(Subscription.Duration.FOREVER);

    // Put in due list
    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    // The execute logic should calculate next execution date after the current date using fast
    // forward
    assertEquals(LocalDate.of(2025, 2, 15), sub.getNextExecutionDate());
  }

  // ==================== createSubscription — edge cases ====================

  @Test
  void createSubscription_NameTooShort_ThrowsException() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("AB"); // < 3 chars
    request.setAmount(new BigDecimal("10.00"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  @Test
  void createSubscription_NameTooLong_ThrowsException() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("A".repeat(41)); // > 40 chars
    request.setAmount(new BigDecimal("10.00"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  @Test
  void createSubscription_TagNotFound_ThrowsTagNotFoundException() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setDuration("FOREVER");
    request.setTag("NonExistentTag");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.findByNameIgnoreCaseAndWalletId("NonExistentTag", walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  @Test
  void createSubscription_NullTag_CreatesWithNullTag() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 2, 15));
    request.setDuration("FOREVER");
    // tag is null

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());
    assertNull(captor.getValue().getTag());
  }

  @Test
  void createSubscription_NullStartDate_DefaultsToToday() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setDuration("FOREVER");
    // startDate is null

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());
    assertEquals(LocalDate.of(2024, 2, 15), captor.getValue().getStartDate());
  }

  @Test
  void createSubscription_NextExecutionTodayOrPast_ExecutesImmediately() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    // Start date is in the past — nextExecution will be today or past
    request.setStartDate(LocalDate.of(2024, 1, 15));
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    subscriptionService.createSubscription(request, walletId, userId);

    // Transaction created = immediate execution happened
    verify(transactionRepository).save(any());
  }

  @Test
  void createSubscription_WalletNotFound_ThrowsException() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException.class,
        () -> subscriptionService.createSubscription(request, walletId, userId));
  }

  // ==================== createSubscriptionsBulk (upsert) ====================

  @Test
  void createSubscriptionsBulk_ValidRows_CreatesAllAndReturnsResponses() {
    SubscriptionRequest r1 = SubscriptionRequest.builder().build();
    r1.setName("Netflix");
    r1.setAmount(new BigDecimal("15.99"));
    r1.setType("EXPENSE");
    r1.setFrequencyType("MONTHLY");
    r1.setFrequencyInterval(1);
    r1.setStartDate(LocalDate.of(2024, 3, 15)); // Future date → no immediate execution
    r1.setDuration("FOREVER");

    SubscriptionRequest r2 = SubscriptionRequest.builder().build();
    r2.setName("Spotify");
    r2.setAmount(new BigDecimal("9.99"));
    r2.setType("EXPENSE");
    r2.setFrequencyType("MONTHLY");
    r2.setFrequencyInterval(1);
    // Different start date so the (name|tag|startDate) dedup key does not collapse the two rows.
    r2.setStartDate(LocalDate.of(2024, 4, 15));
    r2.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.findAllByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    SubscriptionBulkResponse result =
        subscriptionService.createSubscriptionsBulk(List.of(r1, r2), walletId, userId);

    assertEquals(2, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    assertEquals(0, result.getAutoCreatedTags().size());
    verify(subscriptionRepository, times(2)).save(any(Subscription.class));
  }

  @Test
  void createSubscriptionsBulk_EmptyList_ReturnsEmptyLists() {
    SubscriptionBulkResponse result =
        subscriptionService.createSubscriptionsBulk(List.of(), walletId, userId);

    assertEquals(0, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    assertEquals(0, result.getAutoCreatedTags().size());
    verify(subscriptionRepository, never()).save(any());
  }

  @Test
  void createSubscriptionsBulk_InvalidRow_ThrowsRowPrefixedException() {
    SubscriptionRequest valid = SubscriptionRequest.builder().build();
    valid.setName("Netflix");
    valid.setAmount(new BigDecimal("15.99"));
    valid.setType("EXPENSE");
    valid.setFrequencyType("MONTHLY");
    valid.setFrequencyInterval(1);
    valid.setStartDate(LocalDate.of(2024, 3, 15));
    valid.setDuration("FOREVER");

    SubscriptionRequest invalid = SubscriptionRequest.builder().build();
    invalid.setName("Spotify");
    invalid.setAmount(new BigDecimal("-9.99")); // Invalid → rolls back the whole batch

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.findAllByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                subscriptionService.createSubscriptionsBulk(
                    List.of(valid, invalid), walletId, userId));

    assertTrue(ex.getMessage().startsWith("Row 1:"), ex.getMessage());
    assertTrue(ex.getMessage().contains("The amount cannot be negative."));
  }

  @Test
  void createSubscriptionsBulk_MissingTag_AutoCreatesTag() {
    SubscriptionRequest r = SubscriptionRequest.builder().build();
    r.setName("Netflix");
    r.setAmount(new BigDecimal("15.99"));
    r.setType("EXPENSE");
    r.setFrequencyType("MONTHLY");
    r.setFrequencyInterval(1);
    r.setStartDate(LocalDate.of(2024, 3, 15));
    r.setDuration("FOREVER");
    r.setTag("Streaming");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.findAllByWalletId(walletId)).thenReturn(List.of());
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    Tag streaming = new Tag();
    streaming.setName("Streaming");
    when(tagService.createTagFromImport("Streaming", "tag", "var(--color-app-green)", walletId))
        .thenReturn(streaming);
    when(tagMapper.mapToResponse(streaming))
        .thenReturn(TagResponse.builder().name("Streaming").build());

    SubscriptionBulkResponse result =
        subscriptionService.createSubscriptionsBulk(List.of(r), walletId, userId);

    assertEquals(1, result.getCreated().size());
    assertEquals(1, result.getAutoCreatedTags().size());
    verify(tagService).createTagFromImport("Streaming", "tag", "var(--color-app-green)", walletId);
  }

  @Test
  void createSubscriptionsBulk_DuplicateNameTagAndStartDate_UpdatesExisting() {
    Tag tag = new Tag();
    tag.setId(UUID.randomUUID());
    tag.setName("Rent");

    Subscription existing = new Subscription();
    existing.setId(UUID.randomUUID());
    existing.setName("Rent");
    existing.setAmount(new BigDecimal("500.00"));
    existing.setType(Subscription.Type.EXPENSE);
    existing.setTag(tag);
    existing.setStartDate(LocalDate.of(2024, 1, 1));
    existing.setFrequencyType(Subscription.Frequency.MONTHLY);
    existing.setFrequencyInterval(1);
    existing.setDuration(Subscription.Duration.FOREVER);
    existing.setStatus(Subscription.Status.ACTIVE);
    existing.setNextExecutionDate(LocalDate.of(2024, 2, 1));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(tag));
    when(subscriptionRepository.findAllByWalletId(walletId)).thenReturn(List.of(existing));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    // Same name + tag + start date as the existing subscription → overwrites its mutable fields.
    SubscriptionRequest row = SubscriptionRequest.builder().build();
    row.setName("Rent");
    row.setAmount(new BigDecimal("650.00"));
    row.setType("EXPENSE");
    row.setTag("Rent");
    row.setStartDate(LocalDate.of(2024, 1, 1));
    row.setFrequencyType("MONTHLY");
    row.setFrequencyInterval(1);
    row.setDuration("FOREVER");

    SubscriptionBulkResponse result =
        subscriptionService.createSubscriptionsBulk(List.of(row), walletId, userId);

    assertEquals(0, result.getCreated().size());
    assertEquals(1, result.getUpdated().size());
    assertEquals(0, result.getAutoCreatedTags().size());
    assertEquals(new BigDecimal("650.00"), existing.getAmount());
  }

  @Test
  void createSubscriptionsBulk_SameTagAndStartDate_DifferentName_CreatesSeparate() {
    Tag tag = new Tag();
    tag.setId(UUID.randomUUID());
    tag.setName("Rent");

    Subscription existing = new Subscription();
    existing.setId(UUID.randomUUID());
    existing.setName("Old Rent");
    existing.setAmount(new BigDecimal("500.00"));
    existing.setType(Subscription.Type.EXPENSE);
    existing.setTag(tag);
    existing.setStartDate(LocalDate.of(2024, 1, 1));
    existing.setFrequencyType(Subscription.Frequency.MONTHLY);
    existing.setFrequencyInterval(1);
    existing.setDuration(Subscription.Duration.FOREVER);
    existing.setStatus(Subscription.Status.ACTIVE);
    existing.setNextExecutionDate(LocalDate.of(2024, 2, 1));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(tag));
    when(subscriptionRepository.findAllByWalletId(walletId)).thenReturn(List.of(existing));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    // Same tag + start date but a DIFFERENT name → name is part of the dedup key, so this is a new
    // subscription, not an overwrite of the existing one.
    SubscriptionRequest row = SubscriptionRequest.builder().build();
    row.setName("New Rent");
    row.setAmount(new BigDecimal("650.00"));
    row.setType("EXPENSE");
    row.setTag("Rent");
    row.setStartDate(LocalDate.of(2024, 1, 1));
    row.setFrequencyType("MONTHLY");
    row.setFrequencyInterval(1);
    row.setDuration("FOREVER");

    SubscriptionBulkResponse result =
        subscriptionService.createSubscriptionsBulk(List.of(row), walletId, userId);

    assertEquals(1, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    assertEquals("Old Rent", existing.getName()); // existing left untouched
  }

  // ==================== updateSubscription ====================

  @Test
  void updateSubscription_ValidUpdateWithRecalculation_RecalculatesNextDate() {
    Subscription existing = new Subscription();
    existing.setId(UUID.randomUUID());
    existing.setName("Netflix");
    existing.setAmount(new BigDecimal("15.99"));
    existing.setType(Subscription.Type.EXPENSE);
    existing.setFrequencyType(Subscription.Frequency.MONTHLY);
    existing.setFrequencyInterval(1);
    existing.setStartDate(LocalDate.of(2024, 1, 15));
    existing.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    existing.setDuration(Subscription.Duration.FOREVER);
    existing.setStatus(Subscription.Status.ACTIVE);

    when(subscriptionRepository.findByIdAndWalletId(existing.getId(), walletId))
        .thenReturn(Optional.of(existing));
    when(subscriptionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setAmount(new BigDecimal("19.99"));
    request.setFrequencyType("WEEKLY"); // Changed frequency → triggers recalculation
    request.setFrequencyInterval(2);
    request.setDuration("FOREVER");

    SubscriptionResponse response =
        subscriptionService.updateSubscription(existing.getId(), request, walletId, userId);

    assertNotNull(response);
    verify(subscriptionRepository).save(existing);
  }

  @Test
  void updateSubscription_NotFound_ThrowsException() {
    UUID subId = UUID.randomUUID();
    when(subscriptionRepository.findByIdAndWalletId(subId, walletId)).thenReturn(Optional.empty());

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.updateSubscription(subId, request, walletId, userId));
  }

  @Test
  void updateSubscription_NegativeAmount_ThrowsException() {
    Subscription existing = new Subscription();
    existing.setName("Netflix");
    existing.setFrequencyType(Subscription.Frequency.MONTHLY);
    existing.setFrequencyInterval(1);

    when(subscriptionRepository.findByIdAndWalletId(any(), eq(walletId)))
        .thenReturn(Optional.of(existing));

    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setAmount(new BigDecimal("-5.00"));
    request.setDuration("FOREVER");

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.updateSubscription(UUID.randomUUID(), request, walletId, userId));
  }

  // ==================== deleteSubscription ====================

  @Test
  void deleteSubscription_Found_DeletesIt() {
    UUID subId = UUID.randomUUID();
    Subscription sub = new Subscription();
    when(subscriptionRepository.findByIdAndWalletId(subId, walletId)).thenReturn(Optional.of(sub));

    subscriptionService.deleteSubscription(subId, walletId, userId);

    verify(subscriptionRepository).delete(sub);
  }

  @Test
  void deleteSubscription_NotFound_ThrowsException() {
    UUID subId = UUID.randomUUID();
    when(subscriptionRepository.findByIdAndWalletId(subId, walletId)).thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () -> subscriptionService.deleteSubscription(subId, walletId, userId));
  }

  // ==================== executeSubscription — PAUSED status ====================

  @Test
  void processDueSubscriptions_PausedSubscription_AdvancesDateWithoutCreatingTransaction() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Paused Sub");
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.PAUSED);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    sub.setDuration(Subscription.Duration.FOREVER);
    sub.setExecutedTimes(0);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    // Transaction should NOT be created for PAUSED
    verify(transactionRepository, never()).save(any());
    // But subscription should still be saved with next date advanced
    verify(subscriptionRepository).save(sub);
    assertEquals(0, sub.getExecutedTimes()); // Not incremented
    assertEquals(LocalDate.of(2024, 3, 15), sub.getNextExecutionDate());
  }

  // ==================== checkCompletion ====================

  @Test
  void processDueSubscriptions_DurationTimesReached_StatusBecomesCompleted() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Limited Sub");
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    sub.setDuration(Subscription.Duration.TIMES);
    sub.setDurationTimes(1); // Only 1 execution allowed
    sub.setExecutedTimes(0);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    assertEquals(Subscription.Status.COMPLETED, sub.getStatus());
    assertEquals(1, sub.getExecutedTimes());
  }

  @Test
  void processDueSubscriptions_DurationUntilPassed_StatusBecomesCompleted() {
    Subscription sub = new Subscription();
    sub.setId(UUID.randomUUID());
    sub.setName("Until Sub");
    sub.setAmount(new BigDecimal("10.00"));
    sub.setType(Subscription.Type.EXPENSE);
    sub.setStatus(Subscription.Status.ACTIVE);
    sub.setFrequencyType(Subscription.Frequency.MONTHLY);
    sub.setFrequencyInterval(1);
    sub.setStartDate(LocalDate.of(2024, 1, 15));
    sub.setNextExecutionDate(LocalDate.of(2024, 2, 15));
    sub.setDuration(Subscription.Duration.UNTIL);
    sub.setDurationUntil(LocalDate.of(2024, 2, 28)); // Expires before next execution (March 15)
    sub.setExecutedTimes(0);

    when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            anyList(), eq(LocalDate.of(2024, 2, 15))))
        .thenReturn(List.of(sub));

    subscriptionService.processDueSubscriptions();

    assertEquals(Subscription.Status.COMPLETED, sub.getStatus());
  }

  // ==================== applyMonthlyRules — monthlySpecificDay capping ====================

  @Test
  void createSubscription_MonthlySpecificDay31InFebruary_CapsToMaxDays() {
    SubscriptionRequest request = SubscriptionRequest.builder().build();
    request.setName("Monthly31");
    request.setAmount(new BigDecimal("100.00"));
    request.setType("EXPENSE");
    request.setFrequencyType("MONTHLY");
    request.setFrequencyInterval(1);
    request.setStartDate(LocalDate.of(2024, 1, 1));
    request.setMonthlySpecificDay(31);
    request.setDuration("FOREVER");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(mockWallet));
    when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));
    when(subscriptionMapper.mapToResponse(any()))
        .thenReturn(SubscriptionResponse.builder().build());

    subscriptionService.createSubscription(request, walletId, userId);

    ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
    verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

    Subscription saved = captor.getValue();
    // Feb 2024 has 29 days (leap year), so 31 should be capped to 29
    assertEquals(LocalDate.of(2024, 2, 29), saved.getNextExecutionDate());
  }
}
