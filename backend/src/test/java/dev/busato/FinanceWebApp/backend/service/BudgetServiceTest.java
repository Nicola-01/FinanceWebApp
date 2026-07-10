package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetConflictException;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.BudgetMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

  @Mock private BudgetRepository budgetRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private TagRepository tagRepository;
  @Mock private WalletRepository walletRepository;
  @Mock private BudgetAlertLogRepository budgetAlertLogRepository;

  private BudgetService budgetService;

  private final UUID walletId = UUID.randomUUID();
  private final UUID userId = UUID.randomUUID();
  private Wallet wallet;
  private Tag food;
  private Tag restaurants;

  @BeforeEach
  void setUp() {
    budgetService =
        new BudgetService(
            budgetRepository,
            transactionRepository,
            tagRepository,
            walletRepository,
            new BudgetMapper(new ObjectMapper()),
            budgetAlertLogRepository);
    wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setName("W");
    wallet.setCurrency("EUR");
    food = Tag.builder().id(UUID.randomUUID()).name("Food").wallet(wallet).build();
    restaurants =
        Tag.builder().id(UUID.randomUUID()).name("Restaurants").wallet(wallet).parent(food).build();
  }

  private BudgetRequest.BudgetRequestBuilder validRequest() {
    return BudgetRequest.builder()
        .name("Food budget")
        .tagName("Food")
        .limitAmount(new BigDecimal("300.00"))
        .periodType(Budget.PeriodType.MONTHLY);
  }

  private Budget monthlyBudget(Tag tag, String limit, boolean rollover) {
    return Budget.builder()
        .id(UUID.randomUUID())
        .wallet(wallet)
        .tag(tag)
        .name("Food budget")
        .limitAmount(new BigDecimal(limit))
        .periodType(Budget.PeriodType.MONTHLY)
        .startDate(LocalDate.of(2026, 5, 1))
        .rollover(rollover)
        .alertThresholds("[80,100]")
        .build();
  }

  @Test
  void createBudget_persistsNormalizedEntity() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(budgetRepository.findAllByWalletId(walletId)).thenReturn(List.of());
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);

    BudgetStatusResponse response =
        budgetService.createBudget(
            validRequest().alertThresholds(List.of(100, 80, 80)).rollover(true).build(),
            walletId,
            userId);

    ArgumentCaptor<Budget> captor = ArgumentCaptor.forClass(Budget.class);
    verify(budgetRepository).save(captor.capture());
    Budget saved = captor.getValue();
    assertEquals("[80,100]", saved.getAlertThresholds()); // deduped + sorted
    assertEquals(LocalDate.now(), saved.getStartDate()); // defaulted
    assertTrue(saved.isRollover());
    assertNull(saved.getEndDate());
    assertEquals("Food", response.getTagName());
  }

  @Test
  void createBudget_customRequiresValidRange_andForcesRolloverOff() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            budgetService.createBudget(
                validRequest().periodType(Budget.PeriodType.CUSTOM).build(), walletId, userId));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            budgetService.createBudget(
                validRequest()
                    .periodType(Budget.PeriodType.CUSTOM)
                    .startDate(LocalDate.of(2026, 7, 10))
                    .endDate(LocalDate.of(2026, 7, 1))
                    .build(),
                walletId,
                userId));

    // Note: no findAllByWalletId stub here — the CUSTOM path skips the recurring-
    // uniqueness check entirely (strict stubbing would flag an unused stub).
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            any(), any(), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);
    budgetService.createBudget(
        validRequest()
            .periodType(Budget.PeriodType.CUSTOM)
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 8, 31))
            .rollover(true)
            .build(),
        walletId,
        userId);
    ArgumentCaptor<Budget> captor = ArgumentCaptor.forClass(Budget.class);
    verify(budgetRepository).save(captor.capture());
    assertFalse(captor.getValue().isRollover()); // spec: ignored for CUSTOM
  }

  @Test
  void createBudget_unknownTag_throwsTagNotFound() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Nope", walletId))
        .thenReturn(Optional.empty());
    assertThrows(
        TagNotFoundException.class,
        () -> budgetService.createBudget(validRequest().tagName("Nope").build(), walletId, userId));
  }

  @Test
  void createBudget_secondRecurringOnSameScope_conflicts() {
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(budgetRepository.findAllByWalletId(walletId))
        .thenReturn(List.of(monthlyBudget(food, "100.00", false)));

    assertThrows(
        BudgetConflictException.class,
        () -> budgetService.createBudget(validRequest().build(), walletId, userId));
  }

  @Test
  void createBudget_customDuplicatesAllowed() {
    // A recurring Food budget already exists in the wallet, yet the CUSTOM create
    // passes: the uniqueness rule only applies between recurring budgets (the CUSTOM
    // path never queries findAllByWalletId — don't stub it, strict stubbing).
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(food));
    when(walletRepository.getReferenceById(walletId)).thenReturn(wallet);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            any(), any(), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);

    // A CUSTOM budget on the same tag coexists with the recurring one.
    assertDoesNotThrow(
        () ->
            budgetService.createBudget(
                validRequest()
                    .periodType(Budget.PeriodType.CUSTOM)
                    .startDate(LocalDate.of(2026, 6, 1))
                    .endDate(LocalDate.of(2026, 8, 31))
                    .build(),
                walletId,
                userId));
  }

  @Test
  void deleteBudget_purgesAlertLogsFirst() {
    Budget budget = monthlyBudget(null, "100.00", false);
    when(budgetRepository.findByIdAndWalletId(budget.getId(), walletId))
        .thenReturn(Optional.of(budget));

    budgetService.deleteBudget(budget.getId(), walletId, userId);

    var order = inOrder(budgetAlertLogRepository, budgetRepository);
    order.verify(budgetAlertLogRepository).deleteAllByBudgetId(budget.getId());
    order.verify(budgetRepository).delete(budget);
  }

  @Test
  void updateBudget_missing_throwsNotFound() {
    when(budgetRepository.findByIdAndWalletId(any(), eq(walletId))).thenReturn(Optional.empty());
    assertThrows(
        BudgetNotFoundException.class,
        () ->
            budgetService.updateBudget(
                UUID.randomUUID(), validRequest().build(), walletId, userId));
  }

  @Test
  void computeStatus_subtreeIdsIncludeChildren_andPercentFloors() {
    Budget budget = monthlyBudget(food, "300.00", false);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(food, restaurants));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), anyCollection()))
        .thenReturn(new BigDecimal("250.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<java.util.Collection<UUID>> ids =
        ArgumentCaptor.forClass(java.util.Collection.class);
    verify(transactionRepository)
        .sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), ids.capture());
    assertTrue(ids.getValue().contains(restaurants.getId())); // child included

    assertEquals(83, status.getPercentUsed()); // 250/300 = 83.33 -> floored
    assertEquals("WARNING", status.getStatus());
    assertEquals(List.of(80), status.getCrossedThresholds());
    assertEquals(0, new BigDecimal("50.00").compareTo(status.getRemaining()));
  }

  @Test
  void computeStatus_wholeWalletBudget_usesUntaggedQuery() {
    Budget budget = monthlyBudget(null, "1000.00", false);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any()))
        .thenReturn(new BigDecimal("1200.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    assertEquals("EXCEEDED", status.getStatus());
    assertEquals(120, status.getPercentUsed());
    assertEquals(List.of(80, 100), status.getCrossedThresholds());
  }

  @Test
  void computeStatus_rolloverCarriesUnspentAndOverspend() {
    Budget budget = monthlyBudget(null, "100.00", true); // started 2026-05-01, today July
    // Current period (July) spent 50; previous periods (May+June) spent 140 of 200
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 7, 1)),
            eq(LocalDate.of(2026, 7, 31))))
        .thenReturn(new BigDecimal("50.00"));
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 5, 1)),
            eq(LocalDate.of(2026, 6, 30))))
        .thenReturn(new BigDecimal("140.00"));

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    // carry = 100*2 - 140 = 60 -> effectiveLimit 160, spent 50 -> 31%
    assertEquals(0, new BigDecimal("160.00").compareTo(status.getEffectiveLimit()));
    assertEquals(31, status.getPercentUsed());
    assertEquals("OK", status.getStatus());
  }

  @Test
  void computeStatus_negativeCarryEatsPeriod_pinsTo100() {
    Budget budget = monthlyBudget(null, "100.00", true);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 7, 1)),
            eq(LocalDate.of(2026, 7, 31))))
        .thenReturn(BigDecimal.ZERO);
    when(transactionRepository.sumAmountByWalletAndDateRange(
            eq(walletId),
            eq(Transaction.Type.EXPENSE),
            eq(LocalDate.of(2026, 5, 1)),
            eq(LocalDate.of(2026, 6, 30))))
        .thenReturn(new BigDecimal("350.00")); // carry = 200-350 = -150 -> effectiveLimit -50

    BudgetStatusResponse status = budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8));
    assertEquals(100, status.getPercentUsed());
    assertEquals("EXCEEDED", status.getStatus());
  }

  @Test
  void computeStatus_futureRecurringBudget_isInactive() {
    Budget budget = monthlyBudget(null, "100.00", false);
    budget.setStartDate(LocalDate.of(2026, 9, 1));
    when(transactionRepository.sumAmountByWalletAndDateRange(any(), any(), any(), any()))
        .thenReturn(BigDecimal.ZERO);
    assertFalse(budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8)).isActive());
  }

  @Test
  void computeStatus_cyclicTagGraph_terminatesWithFiniteSubtree() {
    // Build a cycle food -> restaurants -> food (reachable via the tag API).
    Tag a = Tag.builder().id(UUID.randomUUID()).name("Food").wallet(wallet).build();
    Tag b =
        Tag.builder().id(UUID.randomUUID()).name("Restaurants").wallet(wallet).parent(a).build();
    a.setParent(b);

    Budget budget = monthlyBudget(a, "300.00", false);
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of(a, b));
    when(transactionRepository.sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), anyCollection()))
        .thenReturn(BigDecimal.ZERO);

    // Must return promptly (a missing cycle-guard would loop forever).
    assertTimeoutPreemptively(
        Duration.ofSeconds(3), () -> budgetService.computeStatus(budget, LocalDate.of(2026, 7, 8)));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<Collection<UUID>> ids = ArgumentCaptor.forClass(Collection.class);
    verify(transactionRepository)
        .sumAmountByWalletAndDateRangeAndTags(
            eq(walletId), eq(Transaction.Type.EXPENSE), any(), any(), ids.capture());
    assertEquals(
        Set.of(a.getId(), b.getId()), Set.copyOf(ids.getValue())); // finite, both ids, no dupes
  }
}
