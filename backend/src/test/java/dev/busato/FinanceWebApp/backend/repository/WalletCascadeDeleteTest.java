package dev.busato.FinanceWebApp.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

/**
 * Guards the wallet-deletion cascade. {@link Subscription} is intentionally NOT part of the {@link
 * Wallet} entity cascade, and it FK-references both the wallet and its tags — so any wallet-delete
 * path must remove the wallet's subscriptions first (see {@code
 * SubscriptionRepository#deleteAllByWalletId}). These tests pin that contract at the DB layer.
 */
@DataJpaTest
@ActiveProfiles("test")
class WalletCascadeDeleteTest {

  @Autowired private TestEntityManager entityManager;
  @Autowired private WalletRepository walletRepository;
  @Autowired private SubscriptionRepository subscriptionRepository;
  @Autowired private TransactionRepository transactionRepository;

  private Wallet wallet;
  private Tag tag;
  private Subscription subscription;
  private Transaction transaction;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("Cascade Wallet");
    wallet.setCurrency("EUR");
    wallet = entityManager.persistAndFlush(wallet);

    tag = new Tag();
    tag.setName("Groceries");
    tag.setWallet(wallet);
    tag = entityManager.persistAndFlush(tag);

    subscription =
        Subscription.builder()
            .wallet(wallet)
            .tag(tag)
            .name("Netflix")
            .amount(new BigDecimal("9.99"))
            .originalAmount(new BigDecimal("9.99"))
            .type(Subscription.Type.EXPENSE)
            .status(Subscription.Status.ACTIVE)
            .startDate(LocalDate.now())
            .nextExecutionDate(LocalDate.now().plusMonths(1))
            .frequencyType(Subscription.Frequency.MONTHLY)
            .duration(Subscription.Duration.FOREVER)
            .build();
    subscription = entityManager.persistAndFlush(subscription);

    transaction = new Transaction();
    transaction.setWallet(wallet);
    transaction.setTag(tag);
    transaction.setSubscription(subscription);
    transaction.setName("Netflix payment");
    transaction.setAmount(new BigDecimal("9.99"));
    transaction.setOriginalAmount(new BigDecimal("9.99"));
    transaction.setType(Transaction.Type.EXPENSE);
    transaction.setTransactionDate(LocalDate.now());
    transaction = entityManager.persistAndFlush(transaction);

    entityManager.clear();
  }

  @Test
  void deletingWalletWithoutRemovingSubscriptionsFirst_ViolatesTagForeignKey() {
    // Reproduces the reported bug: the wallet cascade deletes tags, but the subscription still
    // references the tag, so the DB rejects the tag delete with a FK violation.
    Wallet managed = walletRepository.findById(wallet.getId()).orElseThrow();

    walletRepository.delete(managed);

    // Flush through the Spring-managed repository so the raw Hibernate constraint violation is
    // translated to DataIntegrityViolationException — exactly how it surfaced in production.
    assertThrows(DataIntegrityViolationException.class, () -> walletRepository.flush());
  }

  @Test
  void removingSubscriptionsFirstThenWallet_DeletesEverything() {
    // The fix's ordering: drop subscriptions (and their generated transactions) before the wallet,
    // whose cascade then removes tags, remaining transactions and access rows.
    subscriptionRepository.deleteAllByWalletId(wallet.getId());
    walletRepository.delete(walletRepository.findById(wallet.getId()).orElseThrow());
    entityManager.flush();
    entityManager.clear();

    assertFalse(walletRepository.findById(wallet.getId()).isPresent(), "wallet should be gone");
    assertNull(entityManager.find(Tag.class, tag.getId()), "tag should be gone");
    assertFalse(
        subscriptionRepository.findById(subscription.getId()).isPresent(),
        "subscription should be gone");
    assertFalse(
        transactionRepository.findById(transaction.getId()).isPresent(),
        "subscription-generated transaction should be gone");
  }
}
