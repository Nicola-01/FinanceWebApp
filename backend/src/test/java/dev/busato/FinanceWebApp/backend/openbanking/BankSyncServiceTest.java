package dev.busato.FinanceWebApp.backend.openbanking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService.SyncResult;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransaction;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransactionPage;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.ImportedBankTransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.service.ExchangeRateService;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import dev.busato.FinanceWebApp.backend.service.R2StorageService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BankSyncServiceTest {

  static final Instant NOW = Instant.parse("2026-10-27T10:00:00Z");
  static final LocalDate DAY = LocalDate.of(2026, 10, 20);

  @TestConfiguration
  static class FixedClock {
    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(NOW, ZoneOffset.UTC);
    }
  }

  @MockitoBean EnableBankingClient client;
  @MockitoBean ExchangeRateService exchangeRateService;
  @MockitoBean SendEmailService sendEmailService;
  @MockitoBean R2StorageService r2StorageService;
  @MockitoBean NotificationService notificationService;

  @Autowired BankSyncService service;
  @Autowired UserRepository userRepository;
  @Autowired WalletRepository walletRepository;
  @Autowired WalletAccessRepository walletAccessRepository;
  @Autowired BankConnectionRepository connectionRepository;
  @Autowired ImportedBankTransactionRepository ledgerRepository;
  @Autowired TransactionRepository transactionRepository;

  User owner;
  Wallet wallet;
  WalletAccess access;
  BankConnection conn;
  BankAccountLink link;

  @BeforeEach
  void setUp() {
    owner = new User();
    owner.setUsername("bank-owner@example.com");
    owner.setEmail("bank-owner@example.com");
    owner.setPassword("password");
    owner.setRole(User.Role.USER);
    owner.setOpenBankingEnabled(true);
    owner = userRepository.save(owner);

    wallet = new Wallet();
    wallet.setName("Bank wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(owner.getId(), wallet.getId()));
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(owner);
    access.setWallet(wallet);
    access = walletAccessRepository.save(access);

    conn =
        BankConnection.builder()
            .wallet(wallet)
            .createdBy(owner)
            .aspspName("Test Bank")
            .aspspCountry("IT")
            .sessionId("sess-1")
            .state(UUID.randomUUID().toString())
            .validUntil(NOW.plus(Duration.ofDays(90)))
            .importFrom(LocalDate.of(2026, 10, 1))
            .status(BankConnection.Status.ACTIVE)
            .build();
    link =
        BankAccountLink.builder()
            .connection(conn)
            .accountUid("acc-1")
            .displayName("Main")
            .currency("EUR")
            .importFrom(LocalDate.of(2026, 10, 1))
            .build();
    conn.getAccounts().add(link);
    conn = connectionRepository.save(conn);
    link = conn.getAccounts().get(0);
  }

  static EbTransaction row(String ref, String amount, String currency, String debtor) {
    return new EbTransaction(
        ref,
        null,
        new BigDecimal(amount),
        currency,
        "DBIT",
        "BOOK",
        DAY,
        DAY,
        "Shop",
        debtor,
        List.of("Groceries"));
  }

  void bankReturns(EbTransaction... rows) {
    when(client.getTransactions(eq("acc-1"), any(), isNull(), any()))
        .thenReturn(new EbTransactionPage(List.of(rows), null));
  }

  List<Transaction> walletTxs() {
    return transactionRepository.getAllByWalletId(wallet.getId());
  }

  @Test
  void importsBookedRowsUntagged() {
    bankReturns(row("r1", "12.50", "EUR", null), row("r2", "3.00", "EUR", null));

    SyncResult res = service.syncConnection(conn, null);

    assertThat(res.imported()).isEqualTo(2);
    assertThat(res.status()).isEqualTo(BankConnection.Status.ACTIVE);
    List<Transaction> txs = walletTxs();
    assertThat(txs).hasSize(2);
    assertThat(txs)
        .allSatisfy(
            t -> {
              assertThat(t.getTag().getName()).isEqualTo("To categorize");
              assertThat(t.isImported()).isTrue();
              assertThat(t.isNeedsReview()).isTrue();
            });
    assertThat(ledgerRepository.findExternalIdsByLinkId(link.getId())).hasSize(2);
    assertThat(link.getImportedCount()).isEqualTo(2);
    assertThat(link.getLastSyncedAt()).isEqualTo(NOW);
    // first sync starts from importFrom
    verify(client).getTransactions("acc-1", LocalDate.of(2026, 10, 1), null, null);
  }

  @Test
  void pagesAreCollectedAndResyncLooksBackFiveDays() {
    when(client.getTransactions(eq("acc-1"), any(), isNull(), any()))
        .thenReturn(new EbTransactionPage(List.of(row("r1", "1.00", "EUR", null)), "ck"));
    when(client.getTransactions(eq("acc-1"), any(), eq("ck"), any()))
        .thenReturn(new EbTransactionPage(List.of(row("r2", "2.00", "EUR", null)), null));

    assertThat(service.syncConnection(conn, null).imported()).isEqualTo(2);
    service.syncConnection(conn, null);

    verify(client).getTransactions("acc-1", LocalDate.of(2026, 10, 22), null, null);
  }

  @Test
  void syncTwiceImportsOnce() {
    bankReturns(row("r1", "12.50", "EUR", null), row("r2", "3.00", "EUR", null));

    service.syncConnection(conn, null);
    SyncResult second = service.syncConnection(conn, null);

    assertThat(second.imported()).isZero();
    assertThat(walletTxs()).hasSize(2);
  }

  @Test
  void deletedImportNotRecreated() {
    bankReturns(row("r1", "12.50", "EUR", null), row("r2", "3.00", "EUR", null));
    service.syncConnection(conn, null);

    transactionRepository.delete(walletTxs().get(0));
    service.syncConnection(conn, null);

    assertThat(walletTxs()).hasSize(1);
  }

  @Test
  void identicalRowsSurviveResync() {
    bankReturns(row(null, "5.00", "EUR", "Bob"), row(null, "5.00", "EUR", "Bob"));

    service.syncConnection(conn, null);
    service.syncConnection(conn, null);

    assertThat(walletTxs()).hasSize(2);
  }

  @Test
  void foreignCurrencyConverted() {
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.of(new BigDecimal("0.9")));
    bankReturns(row("r1", "10", "USD", null));

    service.syncConnection(conn, null);

    Transaction t = walletTxs().get(0);
    assertThat(t.getAmount()).isEqualByComparingTo("9.00");
    assertThat(t.getOriginalAmount()).isEqualByComparingTo("10");
    assertThat(t.getOriginalCurrency()).isEqualTo("USD");
    assertThat(t.getExchangeValue()).isEqualByComparingTo("0.9");
  }

  @Test
  void expiredConsentMarksExpired() {
    when(client.getTransactions(any(), any(), any(), any()))
        .thenThrow(new EnableBankingException(401, "unauthorized"));

    assertThat(service.syncConnection(conn, null).status())
        .isEqualTo(BankConnection.Status.EXPIRED);
    assertThat(walletTxs()).isEmpty();
  }

  @Test
  void pastValidUntilMarksExpiredWithoutCallingBank() {
    conn.setValidUntil(NOW.minusSeconds(1));
    connectionRepository.save(conn);

    assertThat(service.syncConnection(conn, null).status())
        .isEqualTo(BankConnection.Status.EXPIRED);
    verify(client, never()).getTransactions(any(), any(), any(), any());
  }

  @Test
  void transientErrorKeepsActiveAndClientErrorMarksError() {
    when(client.getTransactions(any(), any(), any(), any()))
        .thenThrow(new EnableBankingException(503, "down"));
    SyncResult transientRes = service.syncConnection(conn, null);
    assertThat(transientRes.status()).isEqualTo(BankConnection.Status.ACTIVE);
    assertThat(connectionRepository.findById(conn.getId()).orElseThrow().getLastError())
        .isEqualTo("Bank temporarily unavailable");

    doThrow(new EnableBankingException(400, "bad"))
        .when(client)
        .getTransactions(any(), any(), any(), any());
    assertThat(service.syncConnection(conn, null).status()).isEqualTo(BankConnection.Status.ERROR);
    // fixed, non-identifying text: never the bank's message or the request path
    assertThat(connectionRepository.findById(conn.getId()).orElseThrow().getLastError())
        .isEqualTo("Bank rejected the request (HTTP 400)");
  }

  @Test
  void pausedWhenLinkerNotOwner() {
    access.setRole(WalletAccess.WalletRole.EDITOR);
    walletAccessRepository.save(access);

    assertThat(service.syncConnection(conn, null).status()).isEqualTo(BankConnection.Status.PAUSED);
    verify(client, never()).getTransactions(any(), any(), any(), any());
  }

  @Test
  void throttleSkipsRecentLinks() {
    link.setLastSyncedAt(NOW.minus(Duration.ofHours(1)));
    connectionRepository.save(conn);

    assertThat(service.syncWalletIfStale(wallet.getId(), owner.getId(), null)).isEmpty();
    verify(client, never()).getTransactions(any(), any(), any(), any());
  }

  @Test
  void staleWalletIsSynced() {
    link.setLastSyncedAt(NOW.minus(Duration.ofHours(3)));
    connectionRepository.save(conn);
    bankReturns(row("r1", "1.00", "EUR", null));

    List<SyncResult> res = service.syncWalletIfStale(wallet.getId(), owner.getId(), null);

    assertThat(res).singleElement().extracting(SyncResult::imported).isEqualTo(1);
  }

  void verifyOwnerNotified(int times) {
    verify(notificationService, times(times))
        .notifyUser(
            org.mockito.ArgumentMatchers.argThat(u -> u.getId().equals(owner.getId())),
            eq(NotificationType.BANK_CONNECTION),
            eq(wallet.getId()),
            any());
  }

  @Test
  void transitionsNotifyOwnersOnce() {
    conn.setValidUntil(NOW.minusSeconds(1));
    connectionRepository.save(conn);

    service.syncConnection(conn, null);
    service.syncConnection(conn, null); // already EXPIRED: no second transition

    verifyOwnerNotified(1);
  }

  @Test
  void clientErrorNotifiesButTransientDoesNot() {
    when(client.getTransactions(any(), any(), any(), any()))
        .thenThrow(new EnableBankingException(503, "down"));
    service.syncConnection(conn, null);
    verifyOwnerNotified(0);

    doThrow(new EnableBankingException(400, "bad"))
        .when(client)
        .getTransactions(any(), any(), any(), any());
    service.syncConnection(conn, null);
    verifyOwnerNotified(1);
  }

  @Test
  void onOpenTransitionNotifies() {
    access.setRole(WalletAccess.WalletRole.EDITOR);
    walletAccessRepository.save(access);
    User other = new User();
    other.setUsername("bank-coowner@example.com");
    other.setEmail("bank-coowner@example.com");
    other.setPassword("password");
    other = userRepository.save(other);
    WalletAccess co = new WalletAccess();
    co.setId(new WalletAccess.WalletAccessId(other.getId(), wallet.getId()));
    co.setRole(WalletAccess.WalletRole.OWNER);
    co.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    co.setUser(other);
    co.setWallet(wallet);
    walletAccessRepository.save(co);

    List<SyncResult> res = service.syncWalletIfStale(wallet.getId(), owner.getId(), null);

    assertThat(res)
        .singleElement()
        .extracting(SyncResult::status)
        .isEqualTo(BankConnection.Status.PAUSED);
    // the remaining (co-)owner is told; the demoted linker is no longer an owner
    UUID otherId = other.getId();
    verify(notificationService)
        .notifyUser(
            org.mockito.ArgumentMatchers.argThat(u -> u.getId().equals(otherId)),
            eq(NotificationType.BANK_CONNECTION),
            eq(wallet.getId()),
            any());
    verifyOwnerNotified(0);
  }

  @Test
  void onOpenSkipsOtherMembersAndFlaglessLinkers() {
    assertThat(service.syncWalletIfStale(wallet.getId(), UUID.randomUUID(), null)).isEmpty();
    owner.setOpenBankingEnabled(false);
    userRepository.save(owner);
    assertThat(service.syncWalletIfStale(wallet.getId(), owner.getId(), null)).isEmpty();
    verify(client, never()).getTransactions(any(), any(), any(), any());
    assertThat(connectionRepository.findById(conn.getId()).orElseThrow().getStatus())
        .isEqualTo(BankConnection.Status.ACTIVE);
  }

  @Test
  void missingRateSkipsRowUntilRateAvailable() {
    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.empty());
    bankReturns(row("r1", "10", "USD", null), row("r2", "3.00", "EUR", null));

    assertThat(service.syncConnection(conn, null).imported()).isEqualTo(1);
    assertThat(ledgerRepository.findExternalIdsByLinkId(link.getId())).hasSize(1);
    // the window is not advanced, so the next sync refetches from the same start date
    assertThat(link.getLastSyncedAt()).isNull();

    when(exchangeRateService.getRate("USD", "EUR")).thenReturn(Optional.of(new BigDecimal("0.9")));
    assertThat(service.syncConnection(conn, null).imported()).isEqualTo(1);
    assertThat(walletTxs()).hasSize(2);
    verify(client, times(2)).getTransactions("acc-1", LocalDate.of(2026, 10, 1), null, null);
  }
}
