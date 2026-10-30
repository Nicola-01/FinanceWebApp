package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService.SyncResult;
import dev.busato.FinanceWebApp.backend.openbanking.EnableBankingClient;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BankSyncCronJobTest {

  private static final Instant NOW = Instant.parse("2026-10-27T10:00:00Z");

  @Mock private BankConnectionRepository connections;
  @Mock private BankSyncService syncService;
  @Mock private WalletAccessRepository access;
  @Mock private NotificationService notifications;
  @Mock private EnableBankingClient client;

  private BankSyncCronJob job;
  private final User owner = User.builder().id(UUID.randomUUID()).openBankingEnabled(true).build();
  private final Wallet wallet = Wallet.builder().id(UUID.randomUUID()).name("Home").build();

  @BeforeEach
  void setUp() {
    job =
        new BankSyncCronJob(
            connections,
            syncService,
            access,
            notifications,
            client,
            Clock.fixed(NOW, ZoneOffset.UTC));
  }

  private BankConnection conn(Instant lastSynced, Instant validUntil) {
    BankConnection c =
        BankConnection.builder()
            .id(UUID.randomUUID())
            .wallet(wallet)
            .createdBy(owner)
            .aspspName("Intesa")
            .status(BankConnection.Status.ACTIVE)
            .validUntil(validUntil)
            .accounts(new ArrayList<>())
            .build();
    c.getAccounts().add(BankAccountLink.builder().connection(c).lastSyncedAt(lastSynced).build());
    return c;
  }

  private void active(BankConnection... cs) {
    when(connections.findDetailedByStatus(BankConnection.Status.ACTIVE)).thenReturn(List.of(cs));
  }

  private void owners() {
    WalletAccess o = new WalletAccess();
    o.setUser(owner);
    o.setRole(WalletAccess.WalletRole.OWNER);
    WalletAccess e = new WalletAccess();
    e.setUser(User.builder().id(UUID.randomUUID()).build());
    e.setRole(WalletAccess.WalletRole.EDITOR);
    when(access.findAllByWalletIdAndStatus(wallet.getId(), WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(o, e));
  }

  private SyncResult res(BankConnection c, int n, BankConnection.Status s) {
    return new SyncResult(c.getId(), n, s);
  }

  @Test
  void metadata() {
    when(client.configured()).thenReturn(true, false);
    assertEquals("bank-sync", job.key());
    assertEquals("Bank Sync", job.displayName());
    assertEquals(JobFrequency.HOURLY, job.defaults().frequency());
    assertTrue(job.available());
    assertFalse(job.available()); // unavailableWhenNotConfigured
  }

  @Test
  void syncedBeforeLastSlotIsDue() {
    // 08:30Z = 09:30 Rome, before the 10:00 slot
    BankConnection c = conn(NOW.minus(Duration.ofMinutes(90)), null);
    active(c);
    when(syncService.syncConnection(c, null)).thenReturn(res(c, 0, BankConnection.Status.ACTIVE));
    job.run();
    verify(syncService).syncConnection(c, null);
  }

  @Test
  void lastSlotPicksMostRecentRomeHour() {
    // CET (UTC+1): 14:59 Rome -> 10:00 Rome; 15:00 -> 15:00; 09:00 Rome -> yesterday 23:00
    assertEquals(
        Instant.parse("2026-10-27T09:00:00Z"),
        BankSyncCronJob.lastSlot(Instant.parse("2026-10-27T13:59:00Z")));
    assertEquals(
        Instant.parse("2026-10-27T14:00:00Z"),
        BankSyncCronJob.lastSlot(Instant.parse("2026-10-27T14:00:00Z")));
    assertEquals(
        Instant.parse("2026-10-26T22:00:00Z"),
        BankSyncCronJob.lastSlot(Instant.parse("2026-10-27T08:00:00Z")));
    // CEST (UTC+2): 23:30 Rome -> 23:00 Rome
    assertEquals(
        Instant.parse("2026-07-01T21:00:00Z"),
        BankSyncCronJob.lastSlot(Instant.parse("2026-07-01T21:30:00Z")));
  }

  @Test
  void runSyncsActiveOnly() {
    BankConnection c = conn(NOW.minus(Duration.ofHours(9)), null);
    active(c);
    when(syncService.syncConnection(c, null)).thenReturn(res(c, 3, BankConnection.Status.ACTIVE));
    assertEquals("Synced 1 connection(s), imported 3", job.run());
  }

  @Test
  void skipsConnectionsSyncedSinceLastSlot() {
    // NOW is 11:00 Rome; last slot 10:00 Rome = 09:00Z
    BankConnection c = conn(NOW.minus(Duration.ofMinutes(30)), null);
    active(c);
    assertEquals("Synced 0 connection(s), imported 0", job.run());
    verify(syncService, never()).syncConnection(any(), any());
  }

  @Test
  void recentFailedAttemptIsNotRetriedHourly() {
    BankConnection c = conn(NOW.minus(Duration.ofDays(2)), null);
    c.getAccounts().get(0).setLastAttemptAt(NOW.minus(Duration.ofMinutes(30)));
    active(c);
    job.run();
    verify(syncService, never()).syncConnection(any(), any());
  }

  @Test
  void neverSyncedLinkIsDue() {
    BankConnection c = conn(null, null);
    active(c);
    when(syncService.syncConnection(c, null)).thenReturn(res(c, 0, BankConnection.Status.ACTIVE));
    job.run();
    verify(syncService).syncConnection(c, null);
  }

  @Test
  void warnsOnceSevenDaysBefore() {
    BankConnection c = conn(NOW.minus(Duration.ofMinutes(30)), NOW.plus(Duration.ofDays(5)));
    active(c);
    owners();
    job.run();
    verify(notifications, times(1))
        .notifyUser(eq(owner), eq(NotificationType.BANK_CONNECTION), eq(wallet.getId()), any());
    verify(connections).markExpiryWarned(c.getId(), NOW);
    // second run: the persisted marker is now set
    c.setExpiryWarnedAt(NOW);
    job.run();
    verify(notifications, times(1)).notifyUser(any(), any(), any(), any());
  }

  @Test
  void statusTransitionsAreNotNotifiedByTheCron() {
    // BankSyncService notifies transitions itself, after its transaction commits
    BankConnection c = conn(null, NOW.minusSeconds(1));
    active(c);
    when(syncService.syncConnection(c, null)).thenReturn(res(c, 0, BankConnection.Status.EXPIRED));
    job.run();
    verify(notifications, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void skipsConnectionsOfLinkersWithoutTheFlag() {
    BankConnection c = conn(null, NOW.plus(Duration.ofDays(2)));
    c.setCreatedBy(User.builder().id(UUID.randomUUID()).openBankingEnabled(false).build());
    active(c);
    assertEquals("Synced 0 connection(s), imported 0", job.run());
    verify(syncService, never()).syncConnection(any(), any());
    verify(notifications, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void oneFailureDoesNotStopOthers() {
    BankConnection bad = conn(null, null);
    BankConnection good = conn(null, null);
    active(bad, good);
    when(syncService.syncConnection(bad, null)).thenThrow(new RuntimeException("boom"));
    when(syncService.syncConnection(good, null))
        .thenReturn(res(good, 2, BankConnection.Status.ACTIVE));
    assertEquals("Synced 1 connection(s), imported 2, 1 failed", job.run());
  }
}
