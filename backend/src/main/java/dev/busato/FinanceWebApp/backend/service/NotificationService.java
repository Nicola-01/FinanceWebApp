package dev.busato.FinanceWebApp.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.NotificationResponse;
import dev.busato.FinanceWebApp.backend.model.Notification;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.push.NotificationCopy;
import dev.busato.FinanceWebApp.backend.push.WebPushSender;
import dev.busato.FinanceWebApp.backend.repository.NotificationRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists a per-recipient {@link Notification} row and fires the matching Web Push in one flow.
 * The push payload embeds the persisted notification id so a click can ack (delete) exactly that
 * row.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final WebPushSender webPushSender;
  private final ObjectMapper objectMapper;

  /** Persists the notification, then pushes it to every device the recipient has enrolled. */
  @Transactional
  public void notifyUser(
      User recipient, NotificationType type, UUID walletId, NotificationCopy.Copy copy) {
    Notification saved =
        notificationRepository.save(
            Notification.builder()
                .user(recipient)
                .type(type)
                .walletId(walletId)
                .title(copy.title())
                .body(copy.body())
                .url(copy.url())
                .build());
    webPushSender.sendToUser(recipient.getId(), toPayload(saved, copy));
  }

  /** Deletes a notification if (and only if) it belongs to the caller. Idempotent. */
  @Transactional
  public void ack(UUID notificationId, UUID userId) {
    notificationRepository.deleteByIdAndUserId(notificationId, userId);
  }

  /** The caller's notifications, newest first (notification-center list). */
  @Transactional(readOnly = true)
  public List<NotificationResponse> list(UUID userId) {
    return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(NotificationService::toResponse)
        .toList();
  }

  /** How many of the caller's notifications are unread (drives the bell dot). */
  @Transactional(readOnly = true)
  public long unreadCount(UUID userId) {
    return notificationRepository.countByUserIdAndReadAtIsNull(userId);
  }

  /** Marks every unread notification of the caller as read (opening the center). */
  @Transactional
  public void markAllRead(UUID userId) {
    notificationRepository.markAllRead(userId, Instant.now());
  }

  /** Purges the caller's already-read notifications (post-close cleanup). */
  @Transactional
  public void purgeRead(UUID userId) {
    notificationRepository.deleteAllByUserIdAndReadAtIsNotNull(userId);
  }

  private static NotificationResponse toResponse(Notification n) {
    return NotificationResponse.builder()
        .id(n.getId())
        .type(n.getType().name())
        .walletId(n.getWalletId())
        .title(n.getTitle())
        .body(n.getBody())
        .url(n.getUrl())
        .createdAt(n.getCreatedAt())
        .read(n.getReadAt() != null)
        .build();
  }

  private String toPayload(Notification saved, NotificationCopy.Copy copy) {
    Map<String, String> payload = new LinkedHashMap<>();
    payload.put("title", copy.title());
    payload.put("body", copy.body());
    payload.put("url", copy.url());
    payload.put("notificationId", saved.getId().toString());
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException e) {
      // Should never happen for a flat string map; degrade gracefully rather than break the tx.
      log.warn("Failed to serialize push payload: {}", e.getMessage());
      return "{}";
    }
  }
}
