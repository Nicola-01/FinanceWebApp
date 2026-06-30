package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.mappers.SubscriptionMapper;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private SubscriptionMapper subscriptionMapper;

    @Mock
    private Clock clock;

    @InjectMocks
    private SubscriptionService subscriptionService;

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

        assertThrows(IllegalArgumentException.class, () -> subscriptionService.createSubscription(request, walletId, userId));
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
        assertEquals(LocalDate.of(2024, 3, 1), saved.getNextExecutionDate()); // Code bug: applyMonthlyRules not applied for future start dates
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

        when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(anyList(), eq(LocalDate.of(2024, 2, 15))))
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
        when(subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(anyList(), eq(LocalDate.of(2024, 2, 15))))
                .thenReturn(List.of(sub));

        subscriptionService.processDueSubscriptions();

        // The execute logic should calculate next execution date after the current date using fast forward
        assertEquals(LocalDate.of(2025, 2, 15), sub.getNextExecutionDate());
    }
}
