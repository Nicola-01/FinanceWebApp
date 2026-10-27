package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.exceptions.OpenBankingDisabledException;
import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankConnectionResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.CallbackRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.ConnectRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.UrlResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.WalletBankResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService.SyncResult;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.Aspsp;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbAccount;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbSession;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.PsuContext;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.WalletSecurity;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Lifecycle of bank links: connect (bank authorization round-trip), callback, renew, manual sync
 * and unlink. Authorization is checked here through {@link WalletSecurity}; bank calls run outside
 * DB transactions. Never exposes or logs session ids, state or authorization codes.
 */
@Service
@RequiredArgsConstructor
public class BankLinkService {

  static final Duration DEFAULT_CONSENT = Duration.ofDays(90);
  static final int SESSION_POLLS = 5;
  static final Duration POLL_DELAY = Duration.ofSeconds(2);
  static final int MAX_HISTORY_YEARS = 2;

  private static final String BAD_STATE = "Invalid or expired bank authorization";

  private final EnableBankingClient client;
  private final BankSyncService syncService;
  private final BankConnectionRepository connectionRepository;
  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final WalletSecurity walletSecurity;
  private final TransactionTemplate tx;
  private final Clock clock;
  private final Sleeper sleeper;

  @Value("${application.frontend.url}")
  private String frontendUrl;

  public boolean featureEnabled(UUID userId) {
    // Re-read: the admin may have toggled the flag after the principal was loaded.
    return client.configured()
        && userRepository.findById(userId).map(User::isOpenBankingEnabled).orElse(false);
  }

  public List<Aspsp> listAspsps(UUID userId, String country) {
    requireFeature(userId);
    return client.listAspsps(country);
  }

  public WalletBankResponse walletStatus(UUID userId, UUID walletId) {
    walletSecurity.hasReadAccess(userId, walletId);
    List<BankConnectionResponse> connections =
        tx.execute(
            s ->
                connectionRepository.findByWalletId(walletId).stream()
                    // never-completed authorizations are noise, not connections
                    .filter(c -> c.getSessionId() != null)
                    .map(BankConnectionResponse::of)
                    .toList());
    return new WalletBankResponse(featureEnabled(userId), connections);
  }

  public UrlResponse connect(UUID userId, UUID walletId, ConnectRequest req) {
    walletSecurity.isWalletOwner(userId, walletId);
    requireFeature(userId);
    LocalDate today = LocalDate.now(clock);
    if (req.importFrom().isAfter(today)
        || req.importFrom().isBefore(today.minusYears(MAX_HISTORY_YEARS)))
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "importFrom must be within the last " + MAX_HISTORY_YEARS + " years");
    Aspsp aspsp = findAspsp(req.aspspName(), req.country());
    Instant validUntil = consentEnd(aspsp);
    String state = UUID.randomUUID().toString();
    // Bank first: the URL is only handed out once the state is stored.
    String url = client.startAuth(aspsp, validUntil, redirectUrl(), state);
    tx.executeWithoutResult(
        s ->
            connectionRepository.save(
                BankConnection.builder()
                    .wallet(walletRepository.getReferenceById(walletId))
                    .createdBy(userRepository.getReferenceById(userId))
                    .aspspName(aspsp.name())
                    .aspspCountry(aspsp.country())
                    .state(state)
                    .pendingValidUntil(validUntil)
                    .importFrom(req.importFrom())
                    .status(BankConnection.Status.PENDING)
                    .build()));
    return new UrlResponse(url);
  }

  public UrlResponse renew(UUID userId, UUID connectionId) {
    BankConnection c = load(connectionId);
    walletSecurity.isWalletOwner(userId, c.getWallet().getId());
    requireFeature(userId);
    Aspsp aspsp = findAspsp(c.getAspspName(), c.getAspspCountry());
    Instant validUntil = consentEnd(aspsp);
    String state = UUID.randomUUID().toString();
    String url = client.startAuth(aspsp, validUntil, redirectUrl(), state);
    tx.executeWithoutResult(
        s -> {
          BankConnection fresh = load(connectionId);
          fresh.setState(state); // replaces (invalidates) any earlier outstanding state
          fresh.setPendingValidUntil(validUntil);
        });
    return new UrlResponse(url);
  }

  public BankConnectionResponse callback(UUID userId, CallbackRequest req, PsuContext psu) {
    // Consume the state first, in its own committed transaction: single use even if what
    // follows fails. Unknown, consumed or foreign states are indistinguishable (403).
    UUID id =
        tx.execute(
            s -> {
              BankConnection c =
                  connectionRepository
                      .findByState(req.state())
                      .filter(x -> x.getCreatedBy().getId().equals(userId))
                      .orElseThrow(() -> new PermissionDeniedException(BAD_STATE));
              walletSecurity.isWalletOwner(userId, c.getWallet().getId());
              requireFeature(userId);
              // Atomic compare-and-clear: of two concurrent callbacks only one gets a row.
              if (connectionRepository.clearState(c.getId(), req.state()) != 1)
                throw new PermissionDeniedException(BAD_STATE);
              c.setState(null); // keep the managed copy in line with the DB
              return c.getId();
            });

    EbSession session = client.createSession(req.code());
    List<EbAccount> accounts = session.accounts();
    for (int i = 0; accounts.isEmpty() && i < SESSION_POLLS; i++) {
      // Some banks fill the accounts in a little after the session is created.
      try {
        sleeper.sleep(POLL_DELAY);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        break;
      }
      accounts = client.getSession(session.sessionId()).accounts();
    }
    List<EbAccount> found = accounts;

    String oldSession =
        tx.execute(
            s -> {
              BankConnection c = load(id);
              String previous = c.getSessionId();
              c.setSessionId(session.sessionId());
              c.setValidUntil(c.getPendingValidUntil());
              c.setPendingValidUntil(null);
              c.setExpiryWarnedAt(null);
              Map<String, BankAccountLink> byUid =
                  c.getAccounts().stream()
                      .collect(
                          Collectors.toMap(BankAccountLink::getAccountUid, Function.identity()));
              for (EbAccount a : found) {
                if (byUid.containsKey(a.uid())) continue; // renew: keep link, counters, ledger
                String masked = maskIban(a.iban());
                c.getAccounts()
                    .add(
                        BankAccountLink.builder()
                            .connection(c)
                            .accountUid(a.uid())
                            .displayName(
                                a.name() != null ? a.name() : masked != null ? masked : "Account")
                            .maskedIban(masked)
                            .currency(a.currency())
                            .importFrom(c.getImportFrom())
                            .build());
              }
              if (c.getAccounts().isEmpty()) {
                c.setStatus(BankConnection.Status.ERROR);
                c.setLastError("The bank returned no accounts");
              } else {
                c.setStatus(BankConnection.Status.ACTIVE);
                c.setLastError(null);
              }
              return previous;
            });
    if (oldSession != null && !oldSession.equals(session.sessionId()))
      client.deleteSession(oldSession);

    BankConnection c = load(id);
    if (c.getStatus() == BankConnection.Status.ACTIVE) syncService.syncConnection(c, psu);
    return tx.execute(s -> BankConnectionResponse.of(load(id)));
  }

  public SyncResult sync(UUID userId, UUID connectionId, PsuContext psu) {
    BankConnection c = load(connectionId);
    walletSecurity.hasWriteAccess(userId, c.getWallet().getId());
    return syncService.syncConnection(c, psu);
  }

  public List<SyncResult> syncIfStale(UUID userId, UUID walletId, PsuContext psu) {
    walletSecurity.hasReadAccess(userId, walletId);
    return syncService.syncWalletIfStale(walletId, psu);
  }

  /** Deletes the connection, its links and ledger; imported transactions stay in the wallet. */
  public void unlink(UUID userId, UUID connectionId) {
    BankConnection c = load(connectionId);
    walletSecurity.isWalletOwner(userId, c.getWallet().getId());
    String sessionId =
        tx.execute(
            s -> {
              BankConnection fresh = load(connectionId);
              connectionRepository.delete(fresh);
              return fresh.getSessionId();
            });
    if (sessionId != null) client.deleteSession(sessionId);
  }

  /** "IT60X0542811101000000123456" -> "IT•••• 3456"; never more than country + last four. */
  static String maskIban(String iban) {
    if (iban == null) return null;
    String s = iban.replace(" ", "");
    if (s.length() < 8) return "••••";
    return s.substring(0, 2) + "•••• " + s.substring(s.length() - 4);
  }

  private BankConnection load(UUID connectionId) {
    // 403 rather than 404 so connection ids cannot be probed.
    return connectionRepository
        .findById(connectionId)
        .orElseThrow(() -> new PermissionDeniedException("Bank connection not accessible"));
  }

  private void requireFeature(UUID userId) {
    if (!featureEnabled(userId)) throw new OpenBankingDisabledException();
  }

  private Aspsp findAspsp(String name, String country) {
    return client.listAspsps(country).stream()
        .filter(a -> Objects.equals(a.name(), name))
        .findFirst()
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown bank"));
  }

  private Instant consentEnd(Aspsp aspsp) {
    Duration validity =
        aspsp.maximumConsentValidity() != null
            ? Duration.ofSeconds(aspsp.maximumConsentValidity())
            : DEFAULT_CONSENT;
    return clock.instant().plus(validity);
  }

  private String redirectUrl() {
    return frontendUrl + "/bank/callback";
  }
}
