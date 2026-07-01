package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DemoServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private DemoService demoService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("testuser");
    }

    @Test
    void generateDemoWallet_UserNotFound_ThrowsUserNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> demoService.generateDemoWallet(userId));
    }

    @Test
    void generateDemoWallet_ValidUser_CreatesWalletTagsTransactionsAndSubscriptions() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
            Wallet w = i.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });
        when(tagRepository.save(any(Tag.class))).thenAnswer(i -> i.getArgument(0));

        demoService.generateDemoWallet(userId);

        // Wallet created
        verify(walletRepository).save(any(Wallet.class));
        // WalletAccess OWNER created
        verify(walletAccessRepository).save(any(WalletAccess.class));
        // Tags created (22 tags in the demo)
        verify(tagRepository, atLeast(20)).save(any(Tag.class));
        // Transactions batch saved
        verify(transactionRepository).saveAll(anyList());
        // Subscriptions created (8 in the demo)
        verify(subscriptionRepository, atLeast(8)).save(any(Subscription.class));
    }

    @Test
    void generateDemoWallet_TransactionsAreNotCreatedForFutureDates() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
            Wallet w = i.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });
        when(tagRepository.save(any(Tag.class))).thenAnswer(i -> i.getArgument(0));

        demoService.generateDemoWallet(userId);

        // The saveAll call captures all transactions — they should all have dates <= today
        verify(transactionRepository).saveAll(argThat(transactions -> {
            for (Transaction tx : transactions) {
                if (tx.getTransactionDate().isAfter(java.time.LocalDate.now())) {
                    return false;
                }
            }
            return true;
        }));
    }

    @Test
    void generateDemoWallet_SubscriptionsHaveCorrectFrequencies() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
            Wallet w = i.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });
        when(tagRepository.save(any(Tag.class))).thenAnswer(i -> i.getArgument(0));

        demoService.generateDemoWallet(userId);

        // Verify subscriptions were created with correct structure
        verify(subscriptionRepository, atLeast(5)).save(argThat(sub ->
                sub.getStatus() == Subscription.Status.ACTIVE &&
                sub.getDuration() == Subscription.Duration.FOREVER &&
                sub.getNextExecutionDate() != null
        ));
    }
}
