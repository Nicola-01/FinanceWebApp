package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesRequest;
import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesResponse;
import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletNotificationPrefsRequest;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private PushSubscriptionRepository pushSubscriptionRepository;

  @InjectMocks private NotificationPreferenceService service;

  private final UUID userId = UUID.randomUUID();

  @Test
  void getPreferences_mapsBooleansAndBuildsWalletPrefs() {
    User user = new User();
    user.setId(userId);
    user.setNotifyInvites(true);
    user.setMonthlyReportEnabled(false);
    user.setYearlyReportEnabled(true);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    Wallet wallet = new Wallet();
    UUID walletId = UUID.randomUUID();
    wallet.setId(walletId);
    wallet.setName("Casa");
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    access.setNotificationsMuted(true);
    access.setNotifyTransactions(false);
    access.setNotifyRecurringExecutions(false);
    access.setNotifyBudgets(false);
    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));

    NotificationPreferencesResponse res = service.getPreferences(userId);

    assertTrue(res.isInvites());
    assertFalse(res.isMonthlyReport());
    assertTrue(res.isYearlyReport());
    assertEquals(1, res.getWallets().size());
    NotificationPreferencesResponse.WalletPrefs w = res.getWallets().get(0);
    assertEquals(walletId, w.getWalletId());
    assertEquals("Casa", w.getWalletName());
    assertTrue(w.isMuted());
    assertFalse(w.isTransactions());
    assertTrue(w.isSubscriptions());
    assertFalse(w.isRecurringExecutions());
    assertFalse(w.isBudgets());
  }

  @Test
  void updatePreferences_persistsAllToggles() {
    User user = new User();
    user.setId(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    service.updatePreferences(
        userId,
        NotificationPreferencesRequest.builder()
            .invites(false)
            .monthlyReport(true)
            .yearlyReport(false)
            .build());

    assertFalse(user.isNotifyInvites());
    assertTrue(user.isMonthlyReportEnabled());
    assertFalse(user.isYearlyReportEnabled());
    verify(userRepository).save(user);
  }

  @Test
  void setWalletPreferences_writesAllFlagsOnAcceptedAccess() {
    UUID walletId = UUID.randomUUID();
    WalletAccess access = new WalletAccess();
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    when(walletAccessRepository.findByWalletIdAndUserId(walletId, userId))
        .thenReturn(Optional.of(access));

    service.setWalletPreferences(
        userId,
        walletId,
        WalletNotificationPrefsRequest.builder()
            .muted(true)
            .transactions(false)
            .subscriptions(true)
            .recurringExecutions(false)
            .budgets(true)
            .build());

    assertTrue(access.isNotificationsMuted());
    assertFalse(access.isNotifyTransactions());
    assertTrue(access.isNotifySubscriptions());
    assertFalse(access.isNotifyRecurringExecutions());
    assertTrue(access.isNotifyBudgets());
    verify(walletAccessRepository).save(access);
  }

  @Test
  void setWalletPreferences_throwsWhenNoAcceptedAccess() {
    UUID walletId = UUID.randomUUID();
    WalletAccess pending = new WalletAccess();
    pending.setStatus(WalletAccess.InvitationStatus.PENDING);
    when(walletAccessRepository.findByWalletIdAndUserId(walletId, userId))
        .thenReturn(Optional.of(pending));

    assertThrows(
        WalletNotFoundException.class,
        () ->
            service.setWalletPreferences(
                userId, walletId, WalletNotificationPrefsRequest.builder().muted(true).build()));
  }

  @Test
  void subscribe_reassignsExistingEndpointToCallerWithFreshKeys() {
    User otherUser = new User();
    otherUser.setId(UUID.randomUUID());
    PushSubscription existing =
        PushSubscription.builder()
            .endpoint("https://push/e1")
            .user(otherUser)
            .p256dh("old")
            .build();
    when(pushSubscriptionRepository.findByEndpoint("https://push/e1"))
        .thenReturn(Optional.of(existing));
    User caller = new User();
    caller.setId(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(caller));

    service.subscribe(
        userId,
        PushSubscriptionRequest.builder()
            .endpoint("https://push/e1")
            .p256dh("newKey")
            .auth("newAuth")
            .userAgent("UA")
            .build());

    ArgumentCaptor<PushSubscription> saved = ArgumentCaptor.forClass(PushSubscription.class);
    verify(pushSubscriptionRepository).save(saved.capture());
    assertSame(existing, saved.getValue());
    assertSame(caller, saved.getValue().getUser());
    assertEquals("newKey", saved.getValue().getP256dh());
    assertEquals("newAuth", saved.getValue().getAuth());
  }

  @Test
  void subscribe_createsNewRowWhenEndpointUnknown() {
    when(pushSubscriptionRepository.findByEndpoint("https://push/new"))
        .thenReturn(Optional.empty());
    User caller = new User();
    caller.setId(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(caller));

    service.subscribe(
        userId,
        PushSubscriptionRequest.builder()
            .endpoint("https://push/new")
            .p256dh("k")
            .auth("a")
            .build());

    ArgumentCaptor<PushSubscription> saved = ArgumentCaptor.forClass(PushSubscription.class);
    verify(pushSubscriptionRepository).save(saved.capture());
    assertEquals("https://push/new", saved.getValue().getEndpoint());
    assertSame(caller, saved.getValue().getUser());
  }

  @Test
  void unsubscribe_deletesOnlyCallersRow() {
    service.unsubscribe(userId, "https://push/e1");
    verify(pushSubscriptionRepository).deleteByEndpointAndUserId("https://push/e1", userId);
  }
}
