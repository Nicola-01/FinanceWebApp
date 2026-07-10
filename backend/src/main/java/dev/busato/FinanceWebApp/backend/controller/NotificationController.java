package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST surface for notifications. Phase 1 exposes only the click-ack endpoint. */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;

  /** Acks (deletes) a notification the caller received — invoked when a push is clicked. */
  @PostMapping("/{id}/ack")
  public ResponseEntity<Void> ack(@PathVariable UUID id, @AuthenticationPrincipal User user) {
    notificationService.ack(id, user.getId());
    return ResponseEntity.noContent().build();
  }
}
