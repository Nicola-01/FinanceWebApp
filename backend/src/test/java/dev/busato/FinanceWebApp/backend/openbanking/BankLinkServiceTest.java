package dev.busato.FinanceWebApp.backend.openbanking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.exceptions.OpenBankingDisabledException;
import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankConnectionResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.CallbackRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.ConnectRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.WalletBankResponse;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.Aspsp;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbAccount;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbSession;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransaction;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransactionPage;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.ImportedBankTransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.service.ExchangeRateService;
import dev.busato.FinanceWebApp.backend.service.R2StorageService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BankLinkServiceTest {

  static final Instant NOW = Instant.parse("2026-10-27T10:00:00Z");
  static final LocalDate TODAY = LocalDate.of(2026, 10, 27);
  static final Aspsp BANK = new Aspsp("Test Bank", "IT", Duration.ofDays(180).toSeconds());

  @TestConfiguration
  static class FixedClock {
    @Bean
    @Primary
    Clock fixedClock() {
      return Clock.fixed(NOW, ZoneOffset.UTC);
    }
  }

  @MockitoBean EnableBankingClient client;
  @MockitoBean Sleeper sleeper;
  @MockitoBean ExchangeRateService exchangeRateService;
  @MockitoBean SendEmailService sendEmailService;
  @MockitoBean R2StorageService r2StorageService;

  @Autowired BankLinkService service;
  @Autowired UserRepository userRepository;
  @Autowired WalletRepository walletRepository;
  @Autowired WalletAccessRepository walletAccessRepository;
  @Autowired BankConnectionRepository connectionRepository;
  @Autowired ImportedBankTransactionRepository ledgerRepository;
  @Autowired TransactionRepository transactionRepository;
  @Autowired EntityManager em;

  User owner;
  User editor;
  Wallet wallet;

  @BeforeEach
  void setUp() {
    owner = user("link-owner@example.com", true);
    editor = user("link-editor@example.com", true);
    wallet = new Wallet();
    wallet.setName("Bank wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);
    grant(owner, WalletAccess.WalletRole.OWNER);
    grant(editor, WalletAccess.WalletRole.EDITOR);

    when(client.configured()).thenReturn(true);
    when(client.listAspsps("IT")).thenReturn(List.of(BANK));
    when(client.startAuth(any(), any(), anyString(), anyString()))
        .thenAnswer(inv -> "https://bank.example/auth?state=" + inv.getArgument(3));
    when(client.getTransactions(anyString(), any(), any(), any()))
        .thenReturn(new EbTransactionPage(List.of(), null));
  }

  User user(String email, boolean flag) {
    User u = new User();
    u.setUsername(email);
    u.setEmail(email);
    u.setPassword("password");
    u.setRole(User.Role.USER);
    u.setOpenBankingEnabled(flag);
    return userRepository.save(u);
  }

  void grant(User u, WalletAccess.WalletRole role) {
    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(u.getId(), wallet.getId()));
    a.setRole(role);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(u);
    a.setWallet(wallet);
    walletAccessRepository.save(a);
  }

  ConnectRequest req(LocalDate from) {
    return new ConnectRequest("Test Bank", "IT", from);
  }

  /** Connects and returns the state the bank was given. */
  String connect() {
    service.connect(owner.getId(), wallet.getId(), req(TODAY.minusDays(30)));
    ArgumentCaptor<String> state = ArgumentCaptor.forClass(String.class);
    verify(client, org.mockito.Mockito.atLeastOnce())
        .startAuth(any(), any(), anyString(), state.capture());
    return state.getValue();
  }

  static EbAccount account(String uid) {
    return account(uid, "hash-" + uid);
  }

  static EbAccount account(String uid, String hash) {
    return new EbAccount(uid, "IT60X0542811101000000123456", "Main", "EUR", hash);
  }

  static EbTransactionPage page(String ref) {
    return new EbTransactionPage(
        List.of(
            new EbTransaction(
                ref,
                null,
                new BigDecimal("9.99"),
                "EUR",
                "DBIT",
                "BOOK",
                TODAY,
                TODAY,
                "Shop",
                null,
                List.of())),
        null);
  }

  @Test
  void connectRequiresOwnerAndFlag() {
    assertThatThrownBy(
            () -> service.connect(editor.getId(), wallet.getId(), req(TODAY.minusDays(1))))
        .isInstanceOf(PermissionDeniedException.class);

    owner.setOpenBankingEnabled(false);
    userRepository.save(owner);
    assertThatThrownBy(() -> service.connect(owner.getId(), wallet.getId(), req(TODAY)))
        .isInstanceOf(OpenBankingDisabledException.class);
    verify(client, never()).startAuth(any(), any(), anyString(), anyString());

    owner.setOpenBankingEnabled(true);
    userRepository.save(owner);
    String url = service.connect(owner.getId(), wallet.getId(), req(TODAY)).url();

    ArgumentCaptor<String> state = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<Instant> validUntil = ArgumentCaptor.forClass(Instant.class);
    verify(client)
        .startAuth(
            eq(BANK),
            validUntil.capture(),
            eq("http://localhost:5173/bank/callback"),
            state.capture());
    assertThat(url).endsWith(state.getValue());
    assertThat(validUntil.getValue()).isEqualTo(NOW.plus(Duration.ofDays(180)));
    BankConnection c = connectionRepository.findByState(state.getValue()).orElseThrow();
    assertThat(c.getStatus()).isEqualTo(BankConnection.Status.PENDING);
    assertThat(c.getImportFrom()).isEqualTo(TODAY);
    assertThat(c.getCreatedBy().getId()).isEqualTo(owner.getId());
  }

  @Test
  void connectDisabledWhenClientNotConfigured() {
    when(client.configured()).thenReturn(false);
    assertThatThrownBy(() -> service.connect(owner.getId(), wallet.getId(), req(TODAY)))
        .isInstanceOf(OpenBankingDisabledException.class);
    assertThatThrownBy(() -> service.listAspsps(owner.getId(), "IT"))
        .isInstanceOf(OpenBankingDisabledException.class);
  }

  @Test
  void connectValidatesImportFromAndBank() {
    assertThatThrownBy(() -> service.connect(owner.getId(), wallet.getId(), req(TODAY.plusDays(1))))
        .isInstanceOf(ResponseStatusException.class)
        .hasMessageContaining("400");
    assertThatThrownBy(
            () ->
                service.connect(
                    owner.getId(), wallet.getId(), req(TODAY.minusYears(2).minusDays(1))))
        .isInstanceOf(ResponseStatusException.class);
    // exactly two years back is allowed
    service.connect(owner.getId(), wallet.getId(), req(TODAY.minusYears(2)));
    assertThatThrownBy(
            () ->
                service.connect(
                    owner.getId(), wallet.getId(), new ConnectRequest("Unknown Bank", "IT", TODAY)))
        .isInstanceOf(ResponseStatusException.class);
  }

  @Test
  void consentFallsBackToNinetyDays() {
    when(client.listAspsps("IT")).thenReturn(List.of(new Aspsp("Test Bank", "IT", null)));
    service.connect(owner.getId(), wallet.getId(), req(TODAY));
    verify(client).startAuth(any(), eq(NOW.plus(Duration.ofDays(90))), anyString(), anyString());
  }

  @Test
  void callbackRejectsForeignState() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));

    assertThatThrownBy(
            () -> service.callback(editor.getId(), new CallbackRequest("code", state), null))
        .isInstanceOf(PermissionDeniedException.class);
    assertThatThrownBy(
            () -> service.callback(owner.getId(), new CallbackRequest("code", "nope"), null))
        .isInstanceOf(PermissionDeniedException.class);

    service.callback(owner.getId(), new CallbackRequest("code", state), null);
    assertThat(connectionRepository.findByState(state)).isEmpty();
    assertThatThrownBy(
            () -> service.callback(owner.getId(), new CallbackRequest("code", state), null))
        .isInstanceOf(PermissionDeniedException.class);
    verify(client, times(1)).createSession("code");
  }

  @Test
  void callbackPollsUntilAccounts() throws Exception {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of()));
    when(client.getSession("s1")).thenReturn(new EbSession("s1", List.of(account("u1"))));

    BankConnectionResponse res =
        service.callback(owner.getId(), new CallbackRequest("code", state), null);

    verify(sleeper).sleep(Duration.ofSeconds(2));
    assertThat(res.status()).isEqualTo(BankConnection.Status.ACTIVE);
    assertThat(res.walletId()).isEqualTo(wallet.getId());
    assertThat(res.validUntil()).isEqualTo(NOW.plus(Duration.ofDays(180)));
    assertThat(res.accounts()).hasSize(1);
    assertThat(res.accounts().get(0).maskedIban()).isEqualTo("IT•••• 3456");
    assertThat(res.accounts().get(0).displayName()).isEqualTo("Main");
    BankConnection c = connectionRepository.findById(res.id()).orElseThrow();
    assertThat(c.getSessionId()).isEqualTo("s1");
    assertThat(c.getAccounts().get(0).getImportFrom()).isEqualTo(TODAY.minusDays(30));
    // first sync ran right away
    verify(client).getTransactions(eq("u1"), eq(TODAY.minusDays(30)), any(), any());
  }

  @Test
  void callbackWithoutAccountsEndsInError() throws Exception {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of()));
    when(client.getSession("s1")).thenReturn(new EbSession("s1", List.of()));

    BankConnectionResponse res =
        service.callback(owner.getId(), new CallbackRequest("code", state), null);

    verify(client, times(5)).getSession("s1");
    assertThat(res.status()).isEqualTo(BankConnection.Status.ERROR);
    assertThat(res.accounts()).isEmpty();
  }

  @Test
  void renewKeepsLinks() {
    String state = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("c1", state), null).id();
    BankConnection c = connectionRepository.findById(id).orElseThrow();
    c.setStatus(BankConnection.Status.EXPIRED);
    c.setValidUntil(NOW.minusSeconds(1));

    assertThatThrownBy(() -> service.renew(editor.getId(), id))
        .isInstanceOf(PermissionDeniedException.class);
    String url = service.renew(owner.getId(), id).url();
    String newState = url.substring(url.indexOf("state=") + 6);
    assertThat(newState).isNotEqualTo(state);
    assertThat(connectionRepository.findByState(newState).orElseThrow().getId()).isEqualTo(id);

    when(client.createSession("c2")).thenReturn(new EbSession("s2", List.of(account("u1"))));
    BankConnectionResponse res =
        service.callback(owner.getId(), new CallbackRequest("c2", newState), null);

    assertThat(res.id()).isEqualTo(id);
    assertThat(res.accounts()).hasSize(1);
    assertThat(res.status()).isEqualTo(BankConnection.Status.ACTIVE);
    assertThat(res.validUntil()).isEqualTo(NOW.plus(Duration.ofDays(180)));
    assertThat(connectionRepository.findById(id).orElseThrow().getSessionId()).isEqualTo("s2");
    verify(client).deleteSession("s1");
  }

  @Test
  void renewMatchesAccountsByIdentificationHashAcrossSessions() {
    String state = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1", "H"))));
    when(client.getTransactions(eq("u1"), any(), any(), any())).thenReturn(page("r1"));
    UUID id = service.callback(owner.getId(), new CallbackRequest("c1", state), null).id();
    UUID linkId = connectionRepository.findById(id).orElseThrow().getAccounts().get(0).getId();
    assertThat(transactionRepository.getAllByWalletId(wallet.getId())).hasSize(1);

    // the new session exposes the same account under a new, session-scoped uid
    String url = service.renew(owner.getId(), id).url();
    String newState = url.substring(url.indexOf("state=") + 6);
    when(client.createSession("c2")).thenReturn(new EbSession("s2", List.of(account("u2", "H"))));
    when(client.getTransactions(eq("u2"), any(), any(), any())).thenReturn(page("r1"));
    BankConnectionResponse res =
        service.callback(owner.getId(), new CallbackRequest("c2", newState), null);

    assertThat(res.accounts()).hasSize(1);
    assertThat(res.accounts().get(0).id()).isEqualTo(linkId);
    BankConnection c = connectionRepository.findById(id).orElseThrow();
    assertThat(c.getAccounts().get(0).getAccountUid()).isEqualTo("u2");
    // the row already imported through the old uid is not imported again
    assertThat(service.sync(owner.getId(), id, null).imported()).isZero();
    assertThat(transactionRepository.getAllByWalletId(wallet.getId())).hasSize(1);
  }

  @Test
  void renewFallsBackToIbanWhenHashMissing() {
    String state = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1", null))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("c1", state), null).id();
    String url = service.renew(owner.getId(), id).url();
    when(client.createSession("c2")).thenReturn(new EbSession("s2", List.of(account("u9", null))));
    service.callback(
        owner.getId(), new CallbackRequest("c2", url.substring(url.indexOf("state=") + 6)), null);

    BankConnection c = connectionRepository.findById(id).orElseThrow();
    assertThat(c.getAccounts()).extracting("accountUid").containsExactly("u9");
  }

  @Test
  void renewWithDifferentHashSameLastFourAddsSecondLink() {
    String state = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1", "H1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("c1", state), null).id();
    String url = service.renew(owner.getId(), id).url();
    when(client.createSession("c2"))
        .thenReturn(new EbSession("s2", List.of(account("u1", "H1"), account("u2", "H2"))));
    service.callback(
        owner.getId(), new CallbackRequest("c2", url.substring(url.indexOf("state=") + 6)), null);

    assertThat(connectionRepository.findById(id).orElseThrow().getAccounts())
        .extracting("identificationHash")
        .containsExactlyInAnyOrder("H1", "H2");
  }

  @Test
  void coOwnerRenewTakesOverAndRevivesPausedConnection() {
    String state = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("c1", state), null).id();
    User coOwner = user("link-coowner@example.com", true);
    grant(coOwner, WalletAccess.WalletRole.OWNER);
    connectionRepository.findById(id).orElseThrow().setStatus(BankConnection.Status.PAUSED);

    String url = service.renew(coOwner.getId(), id).url();
    String newState = url.substring(url.indexOf("state=") + 6);
    when(client.createSession("c2")).thenReturn(new EbSession("s2", List.of(account("u1"))));
    // only the user who started the renew may complete it
    assertThatThrownBy(
            () -> service.callback(owner.getId(), new CallbackRequest("c2", newState), null))
        .isInstanceOf(PermissionDeniedException.class);
    BankConnectionResponse res =
        service.callback(coOwner.getId(), new CallbackRequest("c2", newState), null);

    assertThat(res.status()).isEqualTo(BankConnection.Status.ACTIVE);
    BankConnection c = connectionRepository.findById(id).orElseThrow();
    assertThat(c.getCreatedBy().getId()).isEqualTo(coOwner.getId());
    assertThat(c.getPendingInitiator()).isNull();
  }

  @Test
  void callbackRequiresAcceptedOwner() {
    String state = connect();
    WalletAccess a =
        walletAccessRepository.findByUserIdAndWalletId(owner.getId(), wallet.getId()).orElseThrow();
    a.setStatus(WalletAccess.InvitationStatus.PENDING);
    assertThatThrownBy(
            () -> service.callback(owner.getId(), new CallbackRequest("code", state), null))
        .isInstanceOf(PermissionDeniedException.class);
  }

  @Test
  void syncWhenClientNotConfigured() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    connectionRepository.findById(id).orElseThrow().getAccounts().get(0).setLastSyncedAt(null);
    when(client.configured()).thenReturn(false);

    assertThatThrownBy(() -> service.sync(owner.getId(), id, null))
        .isInstanceOf(OpenBankingDisabledException.class);
    assertThat(service.syncIfStale(owner.getId(), wallet.getId(), null)).isEmpty();
  }

  @Test
  void unlinkKeepsTransactions() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    when(client.getTransactions(eq("u1"), any(), any(), any()))
        .thenReturn(
            new EbTransactionPage(
                List.of(
                    new EbTransaction(
                        "r1",
                        null,
                        new BigDecimal("9.99"),
                        "EUR",
                        "DBIT",
                        "BOOK",
                        TODAY,
                        TODAY,
                        "Shop",
                        null,
                        List.of())),
                null));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    assertThat(ledgerRepository.count()).isEqualTo(1);

    assertThatThrownBy(() -> service.unlink(editor.getId(), id))
        .isInstanceOf(PermissionDeniedException.class);
    service.unlink(owner.getId(), id);
    em.flush();
    em.clear();

    assertThat(connectionRepository.findById(id)).isEmpty();
    assertThat(ledgerRepository.count()).isZero();
    assertThat(transactionRepository.getAllByWalletId(wallet.getId())).hasSize(1);
    verify(client).deleteSession("s1");
  }

  @Test
  void syncNeedsWriteAccessAndStatusNeedsRead() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    User viewer = user("link-viewer@example.com", false);
    grant(viewer, WalletAccess.WalletRole.VIEWER);
    User stranger = user("link-stranger@example.com", true);

    assertThat(service.sync(editor.getId(), id, null).connectionId()).isEqualTo(id);
    assertThatThrownBy(() -> service.sync(viewer.getId(), id, null))
        .isInstanceOf(PermissionDeniedException.class);
    assertThatThrownBy(() -> service.sync(owner.getId(), UUID.randomUUID(), null))
        .isInstanceOf(PermissionDeniedException.class);

    WalletBankResponse status = service.walletStatus(viewer.getId(), wallet.getId());
    assertThat(status.enabled()).isFalse();
    assertThat(status.connections()).extracting(BankConnectionResponse::id).containsExactly(id);
    // an abandoned (never completed) connect is not listed
    service.connect(owner.getId(), wallet.getId(), req(TODAY));
    assertThat(service.walletStatus(owner.getId(), wallet.getId()).connections()).hasSize(1);
    assertThat(service.walletStatus(owner.getId(), wallet.getId()).enabled()).isTrue();

    // just synced by the callback, so not stale
    assertThat(service.syncIfStale(viewer.getId(), wallet.getId(), null)).isEmpty();
    assertThatThrownBy(() -> service.walletStatus(stranger.getId(), wallet.getId()))
        .isInstanceOf(RuntimeException.class);
  }

  @Test
  void masksIban() {
    assertThat(BankLinkService.maskIban("IT60X0542811101000000123456")).isEqualTo("IT•••• 3456");
    assertThat(BankLinkService.maskIban(null)).isNull();
    assertThat(BankLinkService.maskIban("IT12")).isEqualTo("••••");
  }

  @Test
  void manualSyncRetriesErrorButNotExpired() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    BankConnection c = connectionRepository.findById(id).orElseThrow();

    c.setStatus(BankConnection.Status.ERROR);
    assertThat(service.sync(owner.getId(), id, null).status())
        .isEqualTo(BankConnection.Status.ACTIVE);

    c.setStatus(BankConnection.Status.EXPIRED);
    assertThat(service.sync(owner.getId(), id, null).status())
        .isEqualTo(BankConnection.Status.EXPIRED);
  }

  @Test
  void syncRequiresTheCallersFlag() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    connectionRepository.findById(id).orElseThrow().getAccounts().get(0).setLastSyncedAt(null);
    owner.setOpenBankingEnabled(false);
    userRepository.save(owner);

    assertThatThrownBy(() -> service.sync(owner.getId(), id, null))
        .isInstanceOf(OpenBankingDisabledException.class);
    assertThat(service.syncIfStale(owner.getId(), wallet.getId(), null)).isEmpty();
    verify(client, times(1)).getTransactions(anyString(), any(), any(), any());
  }

  @Test
  void syncIfStaleOnlySyncsTheCallersOwnLinks() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    UUID id = service.callback(owner.getId(), new CallbackRequest("code", state), null).id();
    connectionRepository.findById(id).orElseThrow().getAccounts().get(0).setLastSyncedAt(null);

    assertThat(service.syncIfStale(editor.getId(), wallet.getId(), null)).isEmpty();
    assertThat(service.syncIfStale(owner.getId(), wallet.getId(), null)).hasSize(1);
  }

  @Test
  void accountLinkedByAnotherConnectionIsSkipped() {
    String s1 = connect();
    when(client.createSession("c1")).thenReturn(new EbSession("s1", List.of(account("u1", "H"))));
    service.callback(owner.getId(), new CallbackRequest("c1", s1), null);

    // same account only: nothing to link
    String s2 = connect();
    when(client.createSession("c2")).thenReturn(new EbSession("s2", List.of(account("u2", "H"))));
    BankConnectionResponse dup =
        service.callback(owner.getId(), new CallbackRequest("c2", s2), null);
    assertThat(dup.status()).isEqualTo(BankConnection.Status.ERROR);
    assertThat(dup.accounts()).isEmpty();
    assertThat(connectionRepository.findById(dup.id()).orElseThrow().getLastError())
        .isEqualTo("This account is already linked in this wallet");

    // same account plus a new one: only the new one is linked
    String s3 = connect();
    when(client.createSession("c3"))
        .thenReturn(new EbSession("s3", List.of(account("u3", "H"), account("u4", "H4"))));
    BankConnectionResponse mixed =
        service.callback(owner.getId(), new CallbackRequest("c3", s3), null);
    assertThat(mixed.status()).isEqualTo(BankConnection.Status.ACTIVE);
    assertThat(connectionRepository.findById(mixed.id()).orElseThrow().getAccounts())
        .extracting("identificationHash")
        .containsExactly("H4");
  }

  @Test
  void initialSyncFailureStillReturnsTheLinkedConnection() {
    String state = connect();
    when(client.createSession("code")).thenReturn(new EbSession("s1", List.of(account("u1"))));
    when(client.getTransactions(eq("u1"), any(), any(), any()))
        .thenThrow(new IllegalStateException("boom"));

    BankConnectionResponse res =
        service.callback(owner.getId(), new CallbackRequest("code", state), null);

    assertThat(res.accounts()).hasSize(1);
    assertThat(connectionRepository.findById(res.id()).orElseThrow().getSessionId())
        .isEqualTo("s1");
  }
}
