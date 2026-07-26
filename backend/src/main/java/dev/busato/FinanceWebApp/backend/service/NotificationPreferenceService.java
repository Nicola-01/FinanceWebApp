package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesRequest;
import dev.busato.FinanceWebApp.backend.dto.NotificationPreferencesResponse;
import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
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
 * caller's global per-event-type toggles, their per-wallet mute flags, and their per-device push
 * subscriptions.
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;

  /** The caller's global toggles + one mute entry per accepted wallet membership. */
  @Transactional(readOnly = true)
  public NotificationPreferencesResponse getPreferences(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    List<NotificationPreferencesResponse.WalletMute> mutes =
        walletAccessRepository
            .findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED)
            .stream()
            .map(
                a ->
                    NotificationPreferencesResponse.WalletMute.builder()
                        .walletId(a.getWallet().getId())
                        .walletName(a.getWallet().getName())
                        .muted(a.isNotificationsMuted())
                        .build())
            .toList();
    return NotificationPreferencesResponse.builder()
        .invites(user.isNotifyInvites())
        .transactions(user.isNotifyTransactions())
        .subscriptions(user.isNotifySubscriptions())
        .recurringExecutions(user.isNotifyRecurringExecutions())
        .monthlyReport(user.isMonthlyReportEnabled())
        .yearlyReport(user.isYearlyReportEnabled())
        .walletMutes(mutes)
        .build();
  }

  /** Persists all four global toggles for the caller. */
  @Transactional
  public void updatePreferences(UUID userId, NotificationPreferencesRequest request) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    user.setNotifyInvites(request.isInvites());
    user.setNotifyTransactions(request.isTransactions());
    user.setNotifySubscriptions(request.isSubscriptions());
    user.setNotifyRecurringExecutions(request.isRecurringExecutions());
    user.setMonthlyReportEnabled(request.isMonthlyReport());
    user.setYearlyReportEnabled(request.isYearlyReport());
    userRepository.save(user);
  }

  /** Flips the mute flag on the caller's ACCEPTED membership; 404 if they are not a member. */
  @Transactional
  public void setWalletMute(UUID userId, UUID walletId, boolean muted) {
    WalletAccess access =
        walletAccessRepository
            .findByWalletIdAndUserId(walletId, userId)
            .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
            .orElseThrow(() -> new WalletNotFoundException(walletId));
    access.setNotificationsMuted(muted);
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
