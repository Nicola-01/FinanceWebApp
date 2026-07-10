package dev.busato.FinanceWebApp.backend.push;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private UserRepository userRepository;
  @Mock private NotificationService notificationService;

  @InjectMocks private NotificationDispatcher dispatcher;

  private final UUID walletId = UUID.randomUUID();
  private final UUID actorId = UUID.randomUUID();
  private final UUID otherId = UUID.randomUUID();

  private User member(UUID userId, boolean muted, Consumer<User> prefs) {
    User u = new User();
    u.setId(userId);
    prefs.accept(u);
    WalletAccess wa = new WalletAccess();
    wa.setId(new WalletAccess.WalletAccessId(userId, walletId));
    wa.setUser(u);
    wa.setNotificationsMuted(muted);
    accessByUser.put(userId, wa);
    return u;
  }

  private final java.util.Map<UUID, WalletAccess> accessByUser = new java.util.HashMap<>();

  private void membersAre(User... users) {
    List<WalletAccess> list =
        java.util.Arrays.stream(users).map(u -> accessByUser.get(u.getId())).toList();
    when(walletAccessRepository.findAllByWalletIdAndStatus(
            walletId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(list);
  }

  private WalletActivityEvent txEvent(UUID actor) {
    return new WalletActivityEvent(
        NotificationType.TRANSACTION_CREATED,
        walletId,
        "Casa",
        "EUR",
        actor,
        "actor",
        "Food",
        new BigDecimal("12.50"),
        null);
  }

  @Test
  void notifiesEveryAcceptedMemberExceptTheActor() {
    User actor = member(actorId, false, u -> {});
    User other = member(otherId, false, u -> {});
    membersAre(actor, other);

    dispatcher.onWalletActivity(txEvent(actorId));

    verify(notificationService)
        .notifyUser(eq(other), eq(NotificationType.TRANSACTION_CREATED), eq(walletId), any());
    verify(notificationService, never()).notifyUser(eq(actor), any(), any(), any());
  }

  @Test
  void respectsPerWalletMute() {
    User other = member(otherId, true, u -> {});
    membersAre(other);

    dispatcher.onWalletActivity(txEvent(actorId));

    verify(notificationService, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void respectsTransactionsToggle() {
    User other = member(otherId, false, u -> u.setNotifyTransactions(false));
    membersAre(other);

    dispatcher.onWalletActivity(txEvent(actorId));

    verify(notificationService, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void respectsSubscriptionsToggle() {
    User other = member(otherId, false, u -> u.setNotifySubscriptions(false));
    membersAre(other);

    dispatcher.onWalletActivity(
        new WalletActivityEvent(
            NotificationType.SUBSCRIPTION_CREATED,
            walletId,
            "Casa",
            "EUR",
            actorId,
            "actor",
            "Food",
            new BigDecimal("9.99"),
            null));

    verify(notificationService, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void respectsRecurringToggle() {
    User other = member(otherId, false, u -> u.setNotifyRecurringExecutions(false));
    membersAre(other);

    dispatcher.onWalletActivity(
        new WalletActivityEvent(
            NotificationType.RECURRING_EXECUTED,
            walletId,
            "Casa",
            "EUR",
            null,
            null,
            null,
            new BigDecimal("9.99"),
            "Netflix"));

    verify(notificationService, never()).notifyUser(any(), any(), any(), any());
  }

  @Test
  void cronEventWithNullActorNotifiesAllAcceptedMembers() {
    User a = member(actorId, false, u -> {});
    User b = member(otherId, false, u -> {});
    membersAre(a, b);

    dispatcher.onWalletActivity(
        new WalletActivityEvent(
            NotificationType.RECURRING_EXECUTED,
            walletId,
            "Casa",
            "EUR",
            null,
            null,
            null,
            new BigDecimal("9.99"),
            "Netflix"));

    verify(notificationService)
        .notifyUser(eq(a), eq(NotificationType.RECURRING_EXECUTED), eq(walletId), any());
    verify(notificationService)
        .notifyUser(eq(b), eq(NotificationType.RECURRING_EXECUTED), eq(walletId), any());
  }

  @Test
  void inviteNotifiesInviteeWhenEnabled() {
    UUID invitedId = UUID.randomUUID();
    User invited = new User();
    invited.setId(invitedId);
    when(userRepository.findById(invitedId)).thenReturn(Optional.of(invited));

    dispatcher.onWalletInvite(new WalletInviteEvent(invitedId, "nicola", walletId, "Casa"));

    verify(notificationService)
        .notifyUser(eq(invited), eq(NotificationType.WALLET_INVITE), eq(walletId), any());
  }

  @Test
  void inviteSuppressedWhenInviteePrefOff() {
    UUID invitedId = UUID.randomUUID();
    User invited = new User();
    invited.setId(invitedId);
    invited.setNotifyInvites(false);
    when(userRepository.findById(invitedId)).thenReturn(Optional.of(invited));

    dispatcher.onWalletInvite(new WalletInviteEvent(invitedId, "nicola", walletId, "Casa"));

    verify(notificationService, never()).notifyUser(any(), any(), any(), any());
  }
}
