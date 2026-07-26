package dev.busato.FinanceWebApp.backend.push;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Resolves recipients for domain events and hands each one to {@link NotificationService}. Runs
 * asynchronously, in its own transaction, only once the originating write has committed — so a
 * rolled-back mutation never produces a notification.
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

  private final WalletAccessRepository walletAccessRepository;
  private final UserRepository userRepository;
  private final NotificationService notificationService;

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onWalletActivity(WalletActivityEvent event) {
    for (WalletAccess access :
        walletAccessRepository.findAllByWalletIdAndStatus(
            event.walletId(), WalletAccess.InvitationStatus.ACCEPTED)) {
      UUID memberId = access.getId().getUserId();
      // Never notify the actor of their own action (actorId is null for cron events → skip nobody).
      if (event.actorId() != null && event.actorId().equals(memberId)) continue;
      if (access.isNotificationsMuted()) continue;
      if (!passesGlobalPreference(access.getUser(), event.type())) continue;
      notificationService.notifyUser(
          access.getUser(), event.type(), event.walletId(), buildCopy(event));
    }
  }

  @Async
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onWalletInvite(WalletInviteEvent event) {
    User invited = userRepository.findById(event.invitedUserId()).orElse(null);
    if (invited == null || !invited.isNotifyInvites()) return;
    notificationService.notifyUser(
        invited,
        NotificationType.WALLET_INVITE,
        event.walletId(),
        NotificationCopy.walletInvite(event.inviterUsername(), event.walletName()));
  }

  private boolean passesGlobalPreference(User user, NotificationType type) {
    return switch (type) {
      case TRANSACTION_CREATED, TRANSACTION_UPDATED, TRANSACTION_DELETED ->
          user.isNotifyTransactions();
      case SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_DELETED ->
          user.isNotifySubscriptions();
      case RECURRING_EXECUTED -> user.isNotifyRecurringExecutions();
      case WALLET_INVITE -> user.isNotifyInvites();
      case MONTHLY_REPORT -> user.isMonthlyReportEnabled();
      case YEARLY_REPORT -> user.isYearlyReportEnabled();
    };
  }

  private NotificationCopy.Copy buildCopy(WalletActivityEvent e) {
    return switch (e.type()) {
      case TRANSACTION_CREATED, TRANSACTION_UPDATED, TRANSACTION_DELETED ->
          NotificationCopy.transactionActivity(
              e.type(),
              e.actorUsername(),
              e.tagName(),
              e.amount(),
              e.currency(),
              e.walletName(),
              e.walletId());
      case SUBSCRIPTION_CREATED, SUBSCRIPTION_UPDATED, SUBSCRIPTION_DELETED ->
          NotificationCopy.subscriptionActivity(
              e.type(),
              e.actorUsername(),
              e.tagName(),
              e.amount(),
              e.currency(),
              e.walletName(),
              e.walletId());
      case RECURRING_EXECUTED ->
          NotificationCopy.recurringExecuted(
              e.entityName(), e.amount(), e.currency(), e.walletName(), e.walletId());
      case WALLET_INVITE ->
          throw new IllegalArgumentException("WALLET_INVITE is not a wallet-activity event");
      case MONTHLY_REPORT, YEARLY_REPORT ->
          throw new IllegalArgumentException("Report notifications are not wallet-activity events");
    };
  }
}
