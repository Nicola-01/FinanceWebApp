package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.PushSubscriptionRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.push.WebPushGateway;
import dev.busato.FinanceWebApp.backend.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Device-level push endpoints: the VAPID public key and this device's subscription lifecycle. */
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

  private final WebPushGateway webPushGateway;
  private final NotificationPreferenceService notificationPreferenceService;

  /** The VAPID public key; empty string when the server has push disabled. */
  @GetMapping("/public-key")
  public ResponseEntity<Map<String, String>> getPublicKey() {
    return ResponseEntity.ok(Map.of("publicKey", webPushGateway.getPublicKey()));
  }

  /** Registers (upserts) this device's push subscription. */
  @PostMapping("/subscriptions")
  public ResponseEntity<Void> subscribe(
      @Valid @RequestBody PushSubscriptionRequest request, @AuthenticationPrincipal User user) {
    notificationPreferenceService.subscribe(user.getId(), request);
    return ResponseEntity.noContent().build();
  }

  /** Removes this device's push subscription (identified by endpoint), if owned by the caller. */
  @DeleteMapping("/subscriptions")
  public ResponseEntity<Void> unsubscribe(
      @RequestBody Map<String, String> body, @AuthenticationPrincipal User user) {
    notificationPreferenceService.unsubscribe(user.getId(), body.get("endpoint"));
    return ResponseEntity.noContent().build();
  }
}
