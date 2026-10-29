package dev.busato.FinanceWebApp.backend.push;

import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fans a single payload out to every push subscription a user owns. A dead subscription (the push
 * service answers 404/410) is pruned; a failure on one endpoint never stops delivery to the others.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebPushSender {

  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final PushGateway pushGateway;

  @Transactional
  public void sendToUser(UUID userId, String payloadJson) {
    if (!pushGateway.isConfigured()) {
      log.info("Push skipped for user {}: VAPID keys not configured", userId);
      return;
    }
    for (PushSubscription sub : pushSubscriptionRepository.findAllByUserId(userId)) {
      try {
        int status =
            pushGateway.send(sub.getEndpoint(), sub.getP256dh(), sub.getAuth(), payloadJson);
        if (status == 404 || status == 410) {
          // Push service says this subscription is dead — prune it.
          pushSubscriptionRepository.delete(sub);
        } else if (status >= 300) {
          // e.g. 403 = VAPID key mismatch with the key the device subscribed with.
          log.warn("Push rejected with HTTP {} for endpoint {}", status, sub.getEndpoint());
        } else {
          log.debug("Push accepted with HTTP {} for endpoint {}", status, sub.getEndpoint());
        }
      } catch (Exception e) {
        log.warn("Push send failed for endpoint {}: {}", sub.getEndpoint(), e.getMessage());
      }
    }
  }
}
