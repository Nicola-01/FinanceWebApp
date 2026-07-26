package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.NotificationResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** REST surface for notifications: click-ack (Phase 1) plus the notification center (Phase 2). */
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

  /** The caller's notifications, newest first. */
  @GetMapping
  public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(notificationService.list(user.getId()));
  }

  /** The caller's unread count. */
  @GetMapping("/unread-count")
  public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(user.getId())));
  }

  /** Marks all of the caller's notifications as read (opening the center). */
  @PostMapping("/mark-read")
  public ResponseEntity<Void> markRead(@AuthenticationPrincipal User user) {
    notificationService.markAllRead(user.getId());
    return ResponseEntity.noContent().build();
  }

  /** Purges the caller's already-read notifications (after the center closes). */
  @DeleteMapping("/read")
  public ResponseEntity<Void> purgeRead(@AuthenticationPrincipal User user) {
    notificationService.purgeRead(user.getId());
    return ResponseEntity.noContent().build();
  }
}
