package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionFillRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.StaleWriteException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.mappers.TransactionMapper;
import dev.busato.FinanceWebApp.backend.model.Notification;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.push.WalletActivityEvent;
import dev.busato.FinanceWebApp.backend.repository.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
class TransactionServiceTest {

  @Mock private TransactionRepository transactionRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private UserRepository userRepository;
  @Mock private TagRepository tagRepository;
  @Mock private WalletRepository walletRepository;
  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private TransactionMapper transactionMapper;
  @Mock private TagMapper tagMapper;
  @Mock private TagService tagService;
  @Mock private ExchangeRateService exchangeRateService;
  @Mock private org.springframework.context.ApplicationEventPublisher eventPublisher;

  @InjectMocks private TransactionService transactionService;

  private UUID walletId;
  private UUID userId;
  private UUID transactionId;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    walletId = UUID.randomUUID();
    userId = UUID.randomUUID();
    transactionId = UUID.randomUUID();
    wallet = new Wallet();
    wallet.setId(walletId);
  }

  @Test
  void createTransaction_ValidRequest_CreatesTransaction() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Groceries");
    request.setAmount(new BigDecimal("50.00"));
    request.setType("EXPENSE");
    request.setTag("Food");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

    Tag tag = new Tag();
    tag.setName("Food");
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));

    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    transactionService.createTransaction(request, walletId, userId);

    verify(transactionRepository).save(any(Transaction.class));
  }

  @Test
  void createTransaction_PublishesCreatedEventWithActorAndWalletFields() {
    wallet.setName("Casa");
    wallet.setCurrency("EUR");
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Groceries");
    request.setAmount(new BigDecimal("50.00"));
    request.setType("EXPENSE");
    request.setTag("Food");
    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    Tag tag = new Tag();
    tag.setName("Food");
    when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId))
        .thenReturn(Optional.of(tag));
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));
    User actor = new User();
    actor.setId(userId);
    actor.setUsername("nicola");
    when(userRepository.findById(userId)).thenReturn(Optional.of(actor));

    transactionService.createTransaction(request, walletId, userId);

    ArgumentCaptor<WalletActivityEvent> captor = ArgumentCaptor.forClass(WalletActivityEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    WalletActivityEvent e = captor.getValue();
    assertEquals(Notification.NotificationType.TRANSACTION_CREATED, e.type());
    assertEquals(walletId, e.walletId());
    assertEquals("Casa", e.walletName());
    assertEquals("EUR", e.currency());
    assertEquals(userId, e.actorId());
    assertEquals("nicola", e.actorUsername());
    assertEquals("Food", e.tagName());
    assertEquals(new BigDecimal("50.00"), e.amount());
  }

  @Test
  void updateTransaction_PublishesUpdatedEvent() {
    Transaction tx =
        Transaction.builder().wallet(wallet).name("Old").amount(new BigDecimal("10")).build();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(tx));
    User actor = new User();
    actor.setId(userId);
    actor.setUsername("nicola");
    when(userRepository.findById(userId)).thenReturn(Optional.of(actor));
    TransactionRequest request = TransactionRequest.builder().build();
    request.setAmount(new BigDecimal("20.00"));
    request.setName("New name");

    transactionService.updateTransaction(transactionId, request, walletId, userId);

    ArgumentCaptor<WalletActivityEvent> captor = ArgumentCaptor.forClass(WalletActivityEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertEquals(Notification.NotificationType.TRANSACTION_UPDATED, captor.getValue().type());
  }

  @Test
  void deleteTransaction_PublishesDeletedEventBeforeDeleting() {
    Transaction tx =
        Transaction.builder().wallet(wallet).name("X").amount(new BigDecimal("10")).build();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(tx));
    User actor = new User();
    actor.setId(userId);
    actor.setUsername("nicola");
    when(userRepository.findById(userId)).thenReturn(Optional.of(actor));

    transactionService.deleteTransaction(transactionId, walletId, userId, null);

    ArgumentCaptor<WalletActivityEvent> captor = ArgumentCaptor.forClass(WalletActivityEvent.class);
    verify(eventPublisher).publishEvent(captor.capture());
    assertEquals(Notification.NotificationType.TRANSACTION_DELETED, captor.getValue().type());
    verify(transactionRepository).delete(tx);
  }

  @Test
  void bulkCreate_PublishesNothing() {
    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));
    TransactionRequest r = TransactionRequest.builder().build();
    r.setName("Groceries");
    r.setAmount(new BigDecimal("5.00"));
    r.setType("EXPENSE");

    transactionService.createTransactionsBulk(List.of(r), walletId, userId);

    verify(eventPublisher, never()).publishEvent(any());
  }

  @Test
  void createTransaction_NegativeAmount_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Groceries");
    request.setAmount(new BigDecimal("-50.00")); // Invalid

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.createTransaction(request, walletId, userId));
  }

  @Test
  void createTransaction_InvalidWallet_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    when(walletRepository.findById(walletId)).thenReturn(Optional.empty());

    assertThrows(
        WalletNotFoundException.class,
        () -> transactionService.createTransaction(request, walletId, userId));
  }

  @Test
  void createTransaction_WithSubscription_LinksSubscription() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");

    UUID subId = UUID.randomUUID();
    request.setSubscriptionId(subId);

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

    Subscription sub = new Subscription();
    when(subscriptionRepository.findByIdAndWalletId(subId, walletId)).thenReturn(Optional.of(sub));

    when(transactionRepository.save(any(Transaction.class)))
        .thenAnswer(
            i -> {
              Transaction t = i.getArgument(0);
              assertEquals(sub, t.getSubscription());
              return t;
            });

    transactionService.createTransaction(request, walletId, userId);
  }

  // ==================== createTransactionsBulk (upsert) ====================

  @Test
  void createTransactionsBulk_ValidRows_CreatesAllAndReturnsResponses() {
    TransactionRequest r1 = TransactionRequest.builder().build();
    r1.setName("Groceries");
    r1.setAmount(new BigDecimal("50.00"));
    r1.setType("EXPENSE");

    TransactionRequest r2 = TransactionRequest.builder().build();
    r2.setName("Salary");
    r2.setAmount(new BigDecimal("100.00"));
    r2.setType("INCOME");

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    TransactionBulkResponse result =
        transactionService.createTransactionsBulk(List.of(r1, r2), walletId, userId);

    assertEquals(2, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    assertEquals(0, result.getAutoCreatedTags().size());
    verify(transactionRepository, times(2)).save(any(Transaction.class));
  }

  @Test
  void createTransactionsBulk_EmptyList_ReturnsEmptyLists() {
    TransactionBulkResponse result =
        transactionService.createTransactionsBulk(List.of(), walletId, userId);

    assertEquals(0, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());
    assertEquals(0, result.getAutoCreatedTags().size());
    verify(transactionRepository, never()).save(any());
  }

  @Test
  void createTransactionsBulk_InvalidRow_ThrowsRowPrefixedException() {
    TransactionRequest valid = TransactionRequest.builder().build();
    valid.setName("Groceries");
    valid.setAmount(new BigDecimal("50.00"));
    valid.setType("EXPENSE");

    TransactionRequest invalid = TransactionRequest.builder().build();
    invalid.setName("Rent");
    invalid.setType("EXPENSE");
    invalid.setAmount(new BigDecimal("-10.00")); // Invalid → rolls back the whole batch

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () ->
                transactionService.createTransactionsBulk(
                    List.of(valid, invalid), walletId, userId));

    assertTrue(ex.getMessage().startsWith("Row 1:"), ex.getMessage());
    assertTrue(ex.getMessage().contains("The amount cannot be negative."));
  }

  @Test
  void createTransactionsBulk_MissingTag_AutoCreatesTagOnce() {
    TransactionRequest r1 = TransactionRequest.builder().build();
    r1.setName("Coffee");
    r1.setAmount(new BigDecimal("3.00"));
    r1.setType("EXPENSE");
    r1.setTag("Cafe");

    TransactionRequest r2 = TransactionRequest.builder().build();
    r2.setName("Latte");
    r2.setAmount(new BigDecimal("4.00"));
    r2.setType("EXPENSE");
    r2.setTag("cafe"); // same tag, different case → must reuse the auto-created one

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    Tag cafe = new Tag();
    cafe.setName("Cafe");
    when(tagService.createTagFromImport("Cafe", "tag", "var(--color-app-green)", walletId))
        .thenReturn(cafe);
    when(tagMapper.mapToResponse(cafe)).thenReturn(TagResponse.builder().name("Cafe").build());

    TransactionBulkResponse result =
        transactionService.createTransactionsBulk(List.of(r1, r2), walletId, userId);

    assertEquals(2, result.getCreated().size());
    assertEquals(1, result.getAutoCreatedTags().size());
    verify(tagService, times(1))
        .createTagFromImport("Cafe", "tag", "var(--color-app-green)", walletId);
  }

  @Test
  void createTransactionsBulk_DuplicateOfExisting_UpdatesMutableFields() {
    // Existing transaction (no tag) with the same name + date as the incoming row.
    Transaction existing = new Transaction();
    existing.setName("Rent");
    existing.setAmount(new BigDecimal("100.00"));
    existing.setType(Transaction.Type.EXPENSE);
    existing.setTransactionDate(LocalDate.of(2024, 1, 1));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of(existing));

    TransactionRequest row = TransactionRequest.builder().build();
    row.setName("Rent");
    row.setAmount(new BigDecimal("250.00")); // overwrite
    row.setType("INCOME"); // overwrite
    row.setNotes("bumped");
    row.setTransactionDate(LocalDate.of(2024, 1, 1)); // same date → duplicate

    TransactionBulkResponse result =
        transactionService.createTransactionsBulk(List.of(row), walletId, userId);

    assertEquals(0, result.getCreated().size());
    assertEquals(1, result.getUpdated().size());
    assertEquals(new BigDecimal("250.00"), existing.getAmount());
    assertEquals(Transaction.Type.INCOME, existing.getType());
    assertEquals("bumped", existing.getNotes());
  }

  @Test
  void createTransactionsBulk_IntraBatchDuplicate_CollapsesToOneLastWins() {
    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(tagRepository.getTagsByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of());
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    TransactionRequest a = TransactionRequest.builder().build();
    a.setName("Gym");
    a.setAmount(new BigDecimal("30.00"));
    a.setType("EXPENSE");
    a.setTransactionDate(LocalDate.of(2024, 2, 1));

    TransactionRequest b = TransactionRequest.builder().build();
    b.setName("Gym");
    b.setAmount(new BigDecimal("45.00")); // same name+tag+date → collapses, last wins
    b.setType("EXPENSE");
    b.setTransactionDate(LocalDate.of(2024, 2, 1));

    TransactionBulkResponse result =
        transactionService.createTransactionsBulk(List.of(a, b), walletId, userId);

    // Two identical rows collapse to a single created record.
    assertEquals(1, result.getCreated().size());
    assertEquals(0, result.getUpdated().size());

    ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository, times(2)).save(captor.capture());
    // Both saves target the same entity; its final amount reflects the last row.
    assertEquals(new BigDecimal("45.00"), captor.getValue().getAmount());
  }

  @Test
  void getTransactionsByWalletID_ReturnsTransactions() {
    Transaction t1 = new Transaction();
    when(transactionRepository.getAllByWalletId(walletId)).thenReturn(List.of(t1));

    transactionService.getTransactionsByWalletID(walletId, userId);

    verify(transactionMapper).mapToResponse(t1);
  }

  @Test
  void updateTransaction_ValidRequest_UpdatesTransaction() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Updated Groceries");
    request.setAmount(new BigDecimal("55.00"));

    Transaction transaction = new Transaction();
    transaction.setName("Groceries");
    transaction.setAmount(new BigDecimal("50.00"));

    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(transaction));

    transactionService.updateTransaction(transactionId, request, walletId, userId);

    assertEquals("Updated Groceries", transaction.getName());
    assertEquals(new BigDecimal("55.00"), transaction.getAmount());
  }

  @Test
  void deleteTransaction_TransactionExists_DeletesIt() {
    Transaction transaction = new Transaction();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(transaction));

    transactionService.deleteTransaction(transactionId, walletId, userId, null);

    verify(transactionRepository).delete(transaction);
  }

  // ==================== createTransaction — edge cases ====================

  @Test
  void createTransaction_NameTooShort_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("AB"); // < 3 chars
    request.setAmount(new BigDecimal("50.00"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.createTransaction(request, walletId, userId));
  }

  @Test
  void createTransaction_NameTooLong_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("A".repeat(41)); // > 40 chars
    request.setAmount(new BigDecimal("50.00"));

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.createTransaction(request, walletId, userId));
  }

  @Test
  void createTransaction_NullTag_CreatesWithNullTag() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Groceries");
    request.setAmount(new BigDecimal("50.00"));
    request.setType("EXPENSE");
    // tag is null

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    transactionService.createTransaction(request, walletId, userId);

    verify(transactionRepository).save(any(Transaction.class));
  }

  @Test
  void createTransaction_SubscriptionNotFound_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Netflix");
    request.setAmount(new BigDecimal("15.99"));
    request.setType("EXPENSE");
    UUID subId = UUID.randomUUID();
    request.setSubscriptionId(subId);

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(subscriptionRepository.findByIdAndWalletId(subId, walletId)).thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.createTransaction(request, walletId, userId));
  }

  @Test
  void createTransaction_NullTransactionDate_DefaultsToToday() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Groceries");
    request.setAmount(new BigDecimal("50.00"));
    request.setType("EXPENSE");
    // transactionDate is null

    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    transactionService.createTransaction(request, walletId, userId);

    verify(transactionRepository).save(any(Transaction.class));
  }

  // ==================== createTransaction — client-generated id (offline replay)
  // ====================

  @Test
  void createTransaction_withClientId_setsIdOnEntity() {
    UUID clientId = UUID.randomUUID();
    TransactionRequest request =
        TransactionRequest.builder()
            .id(clientId)
            .name("Coffee")
            .amount(new BigDecimal("2.50"))
            .originalAmount(new BigDecimal("2.50"))
            .type("EXPENSE")
            .transactionDate(LocalDate.of(2026, 7, 8))
            .build();
    when(transactionRepository.existsByIdAndWalletId(clientId, walletId)).thenReturn(false);
    // Reuse the suite's existing happy-path stubbing for wallet lookup + save.
    when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));
    when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

    transactionService.createTransaction(request, walletId, userId);

    ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
    verify(transactionRepository).save(captor.capture());
    assertEquals(clientId, captor.getValue().getId());
  }

  @Test
  void createTransaction_withExistingClientId_isIdempotentAndDoesNotSave() {
    UUID clientId = UUID.randomUUID();
    TransactionRequest request = TransactionRequest.builder().id(clientId).name("x").build();
    Transaction existing = Transaction.builder().id(clientId).build();
    when(transactionRepository.existsByIdAndWalletId(clientId, walletId)).thenReturn(true);
    when(transactionRepository.findById(clientId)).thenReturn(Optional.of(existing));

    transactionService.createTransaction(request, walletId, userId);

    verify(transactionRepository, never()).save(any());
    verify(transactionMapper).mapToResponse(existing);
  }

  // ==================== updateTransaction — edge cases ====================

  @Test
  void updateTransaction_TransactionNotFound_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setAmount(new BigDecimal("10.00"));

    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
  }

  @Test
  void updateTransaction_NameTooShort_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("A"); // < 2 chars
    request.setAmount(new BigDecimal("50.00"));

    Transaction transaction = new Transaction();
    transaction.setName("Old Name");
    transaction.setAmount(new BigDecimal("50.00"));

    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(transaction));

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
  }

  @Test
  void updateTransaction_NegativeAmount_ThrowsException() {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setAmount(new BigDecimal("-10.00"));

    Transaction transaction = new Transaction();
    transaction.setAmount(new BigDecimal("50.00"));

    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(transaction));

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
  }

  // ==================== deleteTransaction — edge case ====================

  @Test
  void deleteTransaction_NotFound_ThrowsException() {
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () -> transactionService.deleteTransaction(transactionId, walletId, userId, null));
  }

  // ==================== baseUpdatedAt / Stale Write precondition ====================

  @Test
  void updateTransaction_staleBaseUpdatedAt_throwsStaleWrite() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Transaction existing = Transaction.builder().id(transactionId).updatedAt(serverTime).build();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(existing));

    TransactionRequest request =
        TransactionRequest.builder()
            .name("x")
            .baseUpdatedAt(serverTime.minusSeconds(60)) // older than the server row
            .build();

    assertThrows(
        StaleWriteException.class,
        () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
    verify(transactionRepository, never()).save(any());
  }

  @Test
  void updateTransaction_nullBaseUpdatedAt_skipsPrecondition() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Transaction existing = Transaction.builder().id(transactionId).updatedAt(serverTime).build();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(existing));

    TransactionRequest request =
        TransactionRequest.builder()
            .name("Updated Name")
            .amount(new BigDecimal("10.00"))
            .build(); // no baseUpdatedAt

    transactionService.updateTransaction(transactionId, request, walletId, userId);

    assertEquals("Updated Name", existing.getName());
  }

  @Test
  void deleteTransaction_staleBaseUpdatedAt_throwsStaleWrite() {
    Instant serverTime = Instant.parse("2026-07-08T10:00:00Z");
    Transaction existing = Transaction.builder().id(transactionId).updatedAt(serverTime).build();
    when(transactionRepository.findByIdAndWalletId(transactionId, walletId))
        .thenReturn(Optional.of(existing));

    assertThrows(
        StaleWriteException.class,
        () ->
            transactionService.deleteTransaction(
                transactionId, walletId, userId, serverTime.minusSeconds(60)));
    verify(transactionRepository, never()).delete(any());
  }

  // ==================== fillTransactionAmount ====================

  private Transaction pendingTx(UUID txId, Wallet wallet, String originalCurrency) {
    Transaction tx = new Transaction();
    tx.setId(txId);
    tx.setWallet(wallet);
    tx.setName("Salary");
    tx.setAmountPending(true);
    tx.setAmount(BigDecimal.ZERO);
    tx.setOriginalAmount(BigDecimal.ZERO);
    tx.setOriginalCurrency(originalCurrency);
    tx.setType(Transaction.Type.INCOME);
    tx.setTransactionDate(LocalDate.of(2026, 6, 27));
    return tx;
  }

  @Test
  void fillTransactionAmount_SameCurrency_SetsAmountsAndClearsPending() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any())).thenReturn(TransactionResponse.builder().build());

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("2450.00")).build(),
        walletId,
        userId);

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("2450.00").compareTo(tx.getAmount()));
    assertEquals(0, new BigDecimal("2450.00").compareTo(tx.getOriginalAmount()));
    assertNull(tx.getExchangeValue());
    assertEquals(LocalDate.of(2026, 6, 27), tx.getTransactionDate());
    verify(exchangeRateService, never()).getRate(any(), any());
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyAutoRate_UsesLiveRateAtFillTime() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(true);
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any())).thenReturn(TransactionResponse.builder().build());
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.of(new BigDecimal("0.90")));

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
        walletId,
        UUID.randomUUID());

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("100.00").compareTo(tx.getOriginalAmount()));
    assertEquals(0, new BigDecimal("90.00").compareTo(tx.getAmount()));
    assertEquals(0, new BigDecimal("0.90").compareTo(tx.getExchangeValue()));
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyFixedRate_UsesStoredSubscriptionRate() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(false);
    sub.setExchangeValue(new BigDecimal("0.85"));
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any())).thenReturn(TransactionResponse.builder().build());

    transactionService.fillTransactionAmount(
        txId,
        TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
        walletId,
        UUID.randomUUID());

    assertEquals(0, new BigDecimal("85.00").compareTo(tx.getAmount()));
    verify(exchangeRateService, never()).getRate(any(), any());
  }

  @Test
  void fillTransactionAmount_ForeignCurrencyNoRateAvailable_ThrowsAndStaysPending() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "USD");
    Subscription sub = new Subscription();
    sub.setAutoExchangeRate(true);
    tx.setSubscription(sub);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.empty());

    assertThrows(
        IllegalArgumentException.class,
        () ->
            transactionService.fillTransactionAmount(
                txId,
                TransactionFillRequest.builder().originalAmount(new BigDecimal("100.00")).build(),
                walletId,
                UUID.randomUUID()));
    assertTrue(tx.isAmountPending());
  }

  @Test
  void fillTransactionAmount_NotPending_Throws() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    tx.setAmountPending(false);
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));

    assertThrows(
        IllegalArgumentException.class,
        () ->
            transactionService.fillTransactionAmount(
                txId,
                TransactionFillRequest.builder().originalAmount(BigDecimal.TEN).build(),
                walletId,
                UUID.randomUUID()));
  }

  @Test
  void updateTransaction_ProvidingAmount_ClearsPendingFlag() {
    UUID txId = UUID.randomUUID();
    UUID walletId = UUID.randomUUID();
    Wallet wallet = new Wallet();
    wallet.setId(walletId);
    wallet.setCurrency("EUR");
    Transaction tx = pendingTx(txId, wallet, "EUR");
    when(transactionRepository.findByIdAndWalletId(txId, walletId)).thenReturn(Optional.of(tx));
    when(transactionMapper.mapToResponse(any())).thenReturn(TransactionResponse.builder().build());

    TransactionRequest request = TransactionRequest.builder().build();
    request.setAmount(new BigDecimal("50.00"));

    transactionService.updateTransaction(txId, request, walletId, UUID.randomUUID());

    assertFalse(tx.isAmountPending());
    assertEquals(0, new BigDecimal("50.00").compareTo(tx.getAmount()));
  }
}
