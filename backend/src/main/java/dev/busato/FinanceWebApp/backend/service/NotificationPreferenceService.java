package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesRequest;
import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesResponse;
import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletNotificationPrefsRequest;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reads and writes the three preference layers behind the Settings → Notifications section: the
 * caller's global toggles, their per-wallet preferences (mute + event types), and their per-device
 * push subscriptions.
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;

  /** The caller's global toggles + one preferences entry per accepted wallet membership. */
  @Transactional(readOnly = true)
  public NotificationPreferencesResponse getPreferences(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    List<NotificationPreferencesResponse.WalletPrefs> wallets =
        walletAccessRepository
            .findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED)
            .stream()
            .map(
                a ->
                    NotificationPreferencesResponse.WalletPrefs.builder()
                        .walletId(a.getWallet().getId())
                        .walletName(a.getWallet().getName())
                        .muted(a.isNotificationsMuted())
                        .transactions(a.isNotifyTransactions())
                        .subscriptions(a.isNotifySubscriptions())
                        .recurringExecutions(a.isNotifyRecurringExecutions())
                        .budgets(a.isNotifyBudgets())
                        .build())
            .toList();
    return NotificationPreferencesResponse.builder()
        .invites(user.isNotifyInvites())
        .monthlyReport(user.isMonthlyReportEnabled())
        .yearlyReport(user.isYearlyReportEnabled())
        .wallets(wallets)
        .build();
  }

  /** Persists the caller's global toggles (invites + report opt-ins). */
  @Transactional
  public void updatePreferences(UUID userId, NotificationPreferencesRequest request) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    user.setNotifyInvites(request.isInvites());
    user.setMonthlyReportEnabled(request.isMonthlyReport());
    user.setYearlyReportEnabled(request.isYearlyReport());
    userRepository.save(user);
  }

  /** Updates the caller's ACCEPTED membership preferences; 404 if they are not a member. */
  @Transactional
  public void setWalletPreferences(
      UUID userId, UUID walletId, WalletNotificationPrefsRequest request) {
    WalletAccess access =
        walletAccessRepository
            .findByWalletIdAndUserId(walletId, userId)
            .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
            .orElseThrow(() -> new WalletNotFoundException(walletId));
    access.setNotificationsMuted(request.isMuted());
    access.setNotifyTransactions(request.isTransactions());
    access.setNotifySubscriptions(request.isSubscriptions());
    access.setNotifyRecurringExecutions(request.isRecurringExecutions());
    access.setNotifyBudgets(request.isBudgets());
    walletAccessRepository.save(access);
  }

  /**
   * Registers (or refreshes) a push subscription for the caller. Upserts by endpoint: a browser
   * reuses its endpoint, so if it already exists — even under a different user — the row is
   * re-assigned to the caller with fresh keys.
   */
  @Transactional
  public void subscribe(UUID userId, PushSubscriptionRequest request) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    PushSubscription subscription =
        pushSubscriptionRepository
            .findByEndpoint(request.getEndpoint())
            .orElseGet(PushSubscription::new);
    subscription.setUser(user);
    subscription.setEndpoint(request.getEndpoint());
    subscription.setP256dh(request.getP256dh());
    subscription.setAuth(request.getAuth());
    subscription.setUserAgent(request.getUserAgent());
    pushSubscriptionRepository.save(subscription);
  }

  /** Removes a push subscription — only if the endpoint belongs to the caller. */
  @Transactional
  public void unsubscribe(UUID userId, String endpoint) {
    pushSubscriptionRepository.deleteByEndpointAndUserId(endpoint, userId);
  }
}
