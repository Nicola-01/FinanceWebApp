package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TransactionMapper;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private TransactionMapper transactionMapper;

    @InjectMocks
    private TransactionService transactionService;

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
        when(tagRepository.findByNameIgnoreCaseAndWalletId("Food", walletId)).thenReturn(Optional.of(tag));

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArgument(0));

        transactionService.createTransaction(request, walletId, userId);

        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void createTransaction_NegativeAmount_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("Groceries");
        request.setAmount(new BigDecimal("-50.00")); // Invalid

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class, () -> transactionService.createTransaction(request, walletId, userId));
    }

    @Test
    void createTransaction_InvalidWallet_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        when(walletRepository.findById(walletId)).thenReturn(Optional.empty());

        assertThrows(WalletNotFoundException.class, () -> transactionService.createTransaction(request, walletId, userId));
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

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> {
            Transaction t = i.getArgument(0);
            assertEquals(sub, t.getSubscription());
            return t;
        });

        transactionService.createTransaction(request, walletId, userId);
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

        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.of(transaction));

        transactionService.updateTransaction(transactionId, request, walletId, userId);

        assertEquals("Updated Groceries", transaction.getName());
        assertEquals(new BigDecimal("55.00"), transaction.getAmount());
    }

    @Test
    void deleteTransaction_TransactionExists_DeletesIt() {
        Transaction transaction = new Transaction();
        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.of(transaction));

        transactionService.deleteTransaction(transactionId, walletId, userId);

        verify(transactionRepository).delete(transaction);
    }

    // ==================== createTransaction — edge cases ====================

    @Test
    void createTransaction_NameTooShort_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("AB"); // < 3 chars
        request.setAmount(new BigDecimal("50.00"));

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class,
                () -> transactionService.createTransaction(request, walletId, userId));
    }

    @Test
    void createTransaction_NameTooLong_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("A".repeat(41)); // > 40 chars
        request.setAmount(new BigDecimal("50.00"));

        when(walletRepository.findById(walletId)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class,
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

        assertThrows(IllegalArgumentException.class,
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

    // ==================== updateTransaction — edge cases ====================

    @Test
    void updateTransaction_TransactionNotFound_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setAmount(new BigDecimal("10.00"));

        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
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

        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.of(transaction));

        assertThrows(IllegalArgumentException.class,
                () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
    }

    @Test
    void updateTransaction_NegativeAmount_ThrowsException() {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setAmount(new BigDecimal("-10.00"));

        Transaction transaction = new Transaction();
        transaction.setAmount(new BigDecimal("50.00"));

        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.of(transaction));

        assertThrows(IllegalArgumentException.class,
                () -> transactionService.updateTransaction(transactionId, request, walletId, userId));
    }

    // ==================== deleteTransaction — edge case ====================

    @Test
    void deleteTransaction_NotFound_ThrowsException() {
        when(transactionRepository.findByIdAndWalletId(transactionId, walletId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> transactionService.deleteTransaction(transactionId, walletId, userId));
    }
}
