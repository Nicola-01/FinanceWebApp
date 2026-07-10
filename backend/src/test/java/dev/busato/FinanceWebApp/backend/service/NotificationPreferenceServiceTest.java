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
  void getPreferences_mapsBooleansAndBuildsWalletMutes() {
    User user = new User();
    user.setId(userId);
    user.setNotifyInvites(true);
    user.setNotifyTransactions(false);
    user.setNotifySubscriptions(true);
    user.setNotifyRecurringExecutions(false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    Wallet wallet = new Wallet();
    UUID walletId = UUID.randomUUID();
    wallet.setId(walletId);
    wallet.setName("Casa");
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    access.setNotificationsMuted(true);
    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));

    NotificationPreferencesResponse res = service.getPreferences(userId);

    assertTrue(res.isInvites());
    assertFalse(res.isTransactions());
    assertTrue(res.isSubscriptions());
    assertFalse(res.isRecurringExecutions());
    assertEquals(1, res.getWalletMutes().size());
    assertEquals(walletId, res.getWalletMutes().get(0).getWalletId());
    assertEquals("Casa", res.getWalletMutes().get(0).getWalletName());
    assertTrue(res.getWalletMutes().get(0).isMuted());
  }

  @Test
  void updatePreferences_persistsAllFour() {
    User user = new User();
    user.setId(userId);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    service.updatePreferences(
        userId,
        NotificationPreferencesRequest.builder()
            .invites(false)
            .transactions(true)
            .subscriptions(false)
            .recurringExecutions(true)
            .build());

    assertFalse(user.isNotifyInvites());
    assertTrue(user.isNotifyTransactions());
    assertFalse(user.isNotifySubscriptions());
    assertTrue(user.isNotifyRecurringExecutions());
    verify(userRepository).save(user);
  }

  @Test
  void setWalletMute_flipsFlagOnAcceptedAccess() {
    UUID walletId = UUID.randomUUID();
    WalletAccess access = new WalletAccess();
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    when(walletAccessRepository.findByWalletIdAndUserId(walletId, userId))
        .thenReturn(Optional.of(access));

    service.setWalletMute(userId, walletId, true);

    assertTrue(access.isNotificationsMuted());
    verify(walletAccessRepository).save(access);
  }

  @Test
  void setWalletMute_throwsWhenNoAcceptedAccess() {
    UUID walletId = UUID.randomUUID();
    WalletAccess pending = new WalletAccess();
    pending.setStatus(WalletAccess.InvitationStatus.PENDING);
    when(walletAccessRepository.findByWalletIdAndUserId(walletId, userId))
        .thenReturn(Optional.of(pending));

    assertThrows(
        WalletNotFoundException.class, () -> service.setWalletMute(userId, walletId, true));
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
