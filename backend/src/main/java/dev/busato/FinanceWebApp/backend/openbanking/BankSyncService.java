package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.ImportedBankTransaction;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankTransactionMapper.MappedTx;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransaction;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransactionPage;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.PsuContext;
import dev.busato.FinanceWebApp.backend.push.NotificationCopy;
import dev.busato.FinanceWebApp.backend.push.WalletActivityEvent;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.ImportedBankTransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.ExchangeRateService;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Imports booked bank rows into wallets, idempotently. Each connection syncs in its own transaction
 * holding a row lock on the connection, so concurrent syncs (cron + on-open) of the same connection
 * run one after the other and the second sees the first's ledger rows. Never logs amounts,
 * counterparties, IBANs or remittance text.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BankSyncService {

  public static final String REVIEW_TAG = "To categorise";

  /** Name of the review tag before it became a placeholder; upgraded at boot. */
  public static final String LEGACY_REVIEW_TAG = "To categorize";

  static final Duration ON_OPEN_THROTTLE = Duration.ofHours(2);
  static final int LOOKBACK_DAYS = 5;

  public record SyncResult(UUID connectionId, int imported, BankConnection.Status status) {}

  private final EnableBankingClient client;
  private final BankTransactionMapper mapper;
  private final BankConnectionRepository connectionRepository;
  private final ImportedBankTransactionRepository ledgerRepository;
  private final TransactionRepository transactionRepository;
  private final TagRepository tagRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final ExchangeRateService exchangeRateService;
  private final NotificationService notificationService;
  private final ApplicationEventPublisher eventPublisher;
  private final TransactionTemplate transactionTemplate;
  private final Clock clock;

  /** A status change away from ACTIVE, with what the owners must be told once it commits. */
  private record Transition(List<User> owners, UUID walletId, NotificationCopy.Copy copy) {}

  private record Outcome(SyncResult result, Transition transition) {}

  /**
   * Syncs one connection in its own transaction (joins the caller's if one is open); owners are
   * notified of an EXPIRED/PAUSED/ERROR transition after that transaction returns.
   */
  public SyncResult syncConnection(BankConnection connection, PsuContext psu) {
    Outcome o = transactionTemplate.execute(tx -> doSync(connection.getId(), psu));
    Transition t = o.transition();
    if (t != null)
      for (User u : t.owners()) {
        // The sync already committed: a failed alert must not report it (or the rest) as failed.
        try {
          notificationService.notifyUser(
              u, NotificationType.BANK_CONNECTION, t.walletId(), t.copy());
        } catch (RuntimeException e) {
          log.warn("Bank status alert for connection {} failed", connection.getId(), e);
        }
      }
    return o.result();
  }

  /**
   * Whether a link last called the bank at or before {@code cutoff}. Based on the last attempt, not
   * the last success, so failures and skipped rows don't turn every tick into a bank call.
   */
  public static boolean attemptedBefore(BankAccountLink l, Instant cutoff) {
    Instant last = l.getLastAttemptAt() != null ? l.getLastAttemptAt() : l.getLastSyncedAt();
    return last == null || !last.isAfter(cutoff);
  }

  /**
   * On-open sync: ACTIVE connections linked by the caller only (no unattended calls on another
   * member's consent; the cron covers those), skipping those whose links all synced recently.
   */
  public List<SyncResult> syncWalletIfStale(UUID walletId, UUID callerId, PsuContext psu) {
    Instant cutoff = clock.instant().minus(ON_OPEN_THROTTLE);
    // Read inside a transaction: accounts are lazy and callers (cron, controller) may have none.
    List<BankConnection> stale =
        transactionTemplate.execute(
            tx ->
                connectionRepository.findByWalletId(walletId).stream()
                    .filter(c -> c.getStatus() == BankConnection.Status.ACTIVE)
                    .filter(c -> c.getCreatedBy().getId().equals(callerId))
                    .filter(c -> c.getCreatedBy().isOpenBankingEnabled())
                    .filter(c -> c.getAccounts().stream().anyMatch(l -> attemptedBefore(l, cutoff)))
                    .toList());
    return stale.stream().map(c -> syncConnection(c, psu)).toList();
  }

  private Outcome doSync(UUID connectionId, PsuContext psu) {
    BankConnection c = connectionRepository.findByIdForUpdate(connectionId).orElseThrow();
    if (c.getStatus() != BankConnection.Status.ACTIVE) return new Outcome(result(c, 0), null);
    SyncResult r = sync(c, psu);
    return new Outcome(r, r.status() == BankConnection.Status.ACTIVE ? null : transition(c));
  }

  private Transition transition(BankConnection c) {
    String bank = c.getAspspName();
    String name = c.getWallet().getName();
    UUID walletId = c.getWallet().getId();
    NotificationCopy.Copy copy =
        switch (c.getStatus()) {
          case EXPIRED -> NotificationCopy.bankConsentExpired(bank, name, walletId);
          case PAUSED -> NotificationCopy.bankLinkPaused(bank, name, walletId);
          default -> NotificationCopy.bankLinkError(bank, name, walletId);
        };
    List<User> owners =
        walletAccessRepository
            .findAllByWalletIdAndStatus(walletId, WalletAccess.InvitationStatus.ACCEPTED)
            .stream()
            .filter(a -> a.getRole() == WalletAccess.WalletRole.OWNER)
            .map(WalletAccess::getUser)
            .toList();
    return new Transition(owners, walletId, copy);
  }

  private SyncResult sync(BankConnection c, PsuContext psu) {
    Instant now = clock.instant();

    if (c.getValidUntil() != null && !now.isBefore(c.getValidUntil())) {
      c.setStatus(BankConnection.Status.EXPIRED);
      return result(c, 0);
    }
    boolean ownerStill =
        walletAccessRepository
            .findByWalletIdAndUserId(c.getWallet().getId(), c.getCreatedBy().getId())
            .filter(a -> a.getRole() == WalletAccess.WalletRole.OWNER)
            .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
            .isPresent();
    if (!ownerStill) {
      c.setStatus(BankConnection.Status.PAUSED);
      return result(c, 0);
    }

    // Stamp every link up front: a failure part-way backs the whole connection off until the next
    // due tick instead of retrying the untried links (and the failing one) every hour.
    c.getAccounts().forEach(l -> l.setLastAttemptAt(now));
    int imported = 0;
    for (BankAccountLink link : c.getAccounts()) {
      List<EbTransaction> rows;
      try {
        rows = fetchAll(link, psu);
      } catch (EnableBankingException e) {
        int s = e.status();
        if (s == 401 || s == 403) c.setStatus(BankConnection.Status.EXPIRED);
        else if (s >= 400 && s < 500 && s != 429) c.setStatus(BankConnection.Status.ERROR);
        // Fixed text: the exception message carries the request path (account uid).
        c.setLastError(
            s >= 400 && s < 500 && s != 429
                ? "Bank rejected the request (HTTP " + s + ")"
                : "Bank temporarily unavailable");
        log.warn("Bank sync of connection {} failed with status {}", c.getId(), s);
        // Earlier links' imports still commit; this link saved nothing (rows are fetched first).
        return result(c, imported);
      }
      imported += importRows(c.getWallet(), link, mapper.map(rows), now);
    }
    c.setLastError(null);
    if (imported > 0)
      log.info("Imported {} bank transactions for connection {}", imported, c.getId());
    return result(c, imported);
  }

  private List<EbTransaction> fetchAll(BankAccountLink link, PsuContext psu) {
    LocalDate from = link.getImportFrom();
    if (link.getLastSyncedAt() != null) {
      LocalDate back =
          LocalDate.ofInstant(link.getLastSyncedAt(), ZoneOffset.UTC).minusDays(LOOKBACK_DAYS);
      if (from == null || back.isAfter(from)) from = back;
    }
    if (link.getRetryFrom() != null && (from == null || link.getRetryFrom().isBefore(from)))
      from = link.getRetryFrom();
    List<EbTransaction> rows = new ArrayList<>();
    String key = null;
    do {
      EbTransactionPage page = client.getTransactions(link.getAccountUid(), from, key, psu);
      rows.addAll(page.transactions());
      key = page.continuationKey();
    } while (key != null);
    return rows;
  }

  private int importRows(Wallet wallet, BankAccountLink link, List<MappedTx> mapped, Instant now) {
    Set<String> known = ledgerRepository.findExternalIdsByLinkId(link.getId());
    Tag tag = null;
    int n = 0;
    LocalDate retryFrom = null;
    // The first sync backfills history: notifying each of those rows would flood the members.
    boolean notify = link.getLastSyncedAt() != null;
    for (MappedTx m : mapped) {
      if (!known.add(m.externalId())) continue;
      String currency =
          m.currency() != null
              ? m.currency()
              : link.getCurrency() != null ? link.getCurrency() : wallet.getCurrency();
      BigDecimal amount = m.amount();
      BigDecimal rate = null;
      if (!currency.equals(wallet.getCurrency())) {
        rate = exchangeRateService.getRate(currency, wallet.getCurrency()).orElse(null);
        if (rate == null) {
          // No ledger row either: retryFrom brings it back into a later sync's window.
          log.warn("No {}->{} rate; skipping a bank row", currency, wallet.getCurrency());
          if (retryFrom == null || m.date().isBefore(retryFrom)) retryFrom = m.date();
          continue;
        }
        amount = m.amount().multiply(rate).setScale(2, RoundingMode.HALF_UP);
      }
      if (tag == null) tag = reviewTag(wallet);
      Transaction saved =
          transactionRepository.save(
              Transaction.builder()
                  .wallet(wallet)
                  .tag(tag)
                  .name(m.name())
                  .notes(m.notes())
                  .amount(amount)
                  .originalAmount(m.amount())
                  .originalCurrency(currency)
                  .exchangeValue(rate)
                  .type(m.type())
                  .transactionDate(m.date())
                  .imported(true)
                  .needsReview(true)
                  .build());
      if (notify)
        eventPublisher.publishEvent(
            new WalletActivityEvent(
                NotificationType.BANK_TRANSACTION_IMPORTED,
                wallet.getId(),
                wallet.getName(),
                wallet.getCurrency(),
                null,
                null,
                null,
                amount,
                m.name(),
                saved.getId()));
      ledgerRepository.save(
          ImportedBankTransaction.builder()
              .link(link)
              .externalId(m.externalId())
              .importedAt(now)
              .build());
      n++;
    }
    link.setLastSyncedAt(now);
    link.setRetryFrom(retryFrom);
    link.setImportedCount(link.getImportedCount() + n);
    return n;
  }

  /** Found by name each time: if the user renamed or deleted it, a fresh one is created. */
  private Tag reviewTag(Wallet wallet) {
    return tagRepository
        .findByNameIgnoreCaseAndWalletId(REVIEW_TAG, wallet.getId())
        .orElseGet(
            () ->
                tagRepository.save(
                    Tag.builder()
                        .name(REVIEW_TAG)
                        .wallet(wallet)
                        .icon("bank")
                        .colorHex("#9CA3AF")
                        .placeholder(true)
                        .build()));
  }

  private static SyncResult result(BankConnection c, int imported) {
    return new SyncResult(c.getId(), imported, c.getStatus());
  }
}
