package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService;
import dev.busato.FinanceWebApp.backend.openbanking.EnableBankingClient;
import dev.busato.FinanceWebApp.backend.push.NotificationCopy;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Hourly tick that syncs due bank connections and warns wallet owners 7 days before consent expiry
 * (status-change notifications are sent by {@link BankSyncService}). Deliberately not
 * {@code @Transactional}: {@link BankSyncService} manages its own transactions.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BankSyncCronJob implements ManagedJob {

  // Unattended syncs at these local hours: 4/day, the PSD2 cap for access without the user present.
  static final List<Integer> SLOT_HOURS = List.of(10, 15, 19, 23);
  static final ZoneId SLOT_ZONE = ZoneId.of("Europe/Rome");
  private static final Duration WARN_BEFORE = Duration.ofDays(7);

  private final BankConnectionRepository connectionRepository;
  private final BankSyncService syncService;
  private final WalletAccessRepository walletAccessRepository;
  private final NotificationService notificationService;
  private final EnableBankingClient client;
  private final Clock clock;

  @Override
  public String key() {
    return "bank-sync";
  }

  @Override
  public String displayName() {
    return "Bank Sync";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.HOURLY, 0, 0, null);
  }

  @Override
  public boolean available() {
    return client.configured();
  }

  @Override
  public String run() {
    Instant now = clock.instant();
    int synced = 0;
    int imported = 0;
    int failed = 0;
    for (BankConnection c :
        connectionRepository.findDetailedByStatus(BankConnection.Status.ACTIVE)) {
      // Admin revoked the feature for the linker: leave the connection untouched.
      if (!c.getCreatedBy().isOpenBankingEnabled()) continue;
      try {
        BankConnection.Status status = BankConnection.Status.ACTIVE;
        if (due(c, now)) {
          BankSyncService.SyncResult r = syncService.syncConnection(c, null);
          synced++;
          imported += r.imported();
          status = r.status();
        }
        if (status == BankConnection.Status.ACTIVE
            && c.getExpiryWarnedAt() == null
            && c.getValidUntil() != null
            && !c.getValidUntil().isAfter(now.plus(WARN_BEFORE))) {
          long days = Math.max(0, Duration.between(now, c.getValidUntil()).toDays());
          notifyOwners(
              c, NotificationCopy.bankConsentExpiring(bank(c), wallet(c), days, walletId(c)));
          connectionRepository.markExpiryWarned(c.getId(), now);
        }
      } catch (RuntimeException e) {
        failed++;
        log.warn("Bank sync job failed for connection {}", c.getId(), e);
      }
    }
    return "Synced "
        + synced
        + " connection(s), imported "
        + imported
        + (failed > 0 ? ", " + failed + " failed" : "");
  }

  private boolean due(BankConnection c, Instant now) {
    Instant cutoff = lastSlot(now);
    List<BankAccountLink> links = c.getAccounts();
    return links.stream().anyMatch(l -> BankSyncService.attemptedBefore(l, cutoff));
  }

  /** The most recent slot start at or before {@code now}. */
  static Instant lastSlot(Instant now) {
    ZonedDateTime local = now.atZone(SLOT_ZONE);
    ZonedDateTime day = local.truncatedTo(ChronoUnit.DAYS);
    for (int i = SLOT_HOURS.size() - 1; i >= 0; i--) {
      ZonedDateTime slot = day.withHour(SLOT_HOURS.get(i));
      if (!slot.isAfter(local)) return slot.toInstant();
    }
    return day.minusDays(1).withHour(SLOT_HOURS.get(SLOT_HOURS.size() - 1)).toInstant();
  }

  private void notifyOwners(BankConnection c, NotificationCopy.Copy copy) {
    walletAccessRepository
        .findAllByWalletIdAndStatus(walletId(c), WalletAccess.InvitationStatus.ACCEPTED)
        .stream()
        .filter(a -> a.getRole() == WalletAccess.WalletRole.OWNER)
        .forEach(
            a ->
                notificationService.notifyUser(
                    a.getUser(), NotificationType.BANK_CONNECTION, walletId(c), copy));
  }

  private static java.util.UUID walletId(BankConnection c) {
    return c.getWallet().getId();
  }

  private static String wallet(BankConnection c) {
    return c.getWallet().getName();
  }

  private static String bank(BankConnection c) {
    return c.getAspspName();
  }
}
