package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Notification;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  /** The caller's notifications, newest first (notification-center list). */
  List<Notification> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

  /** How many of the caller's notifications are still unread (drives the bell dot). */
  long countByUserIdAndReadAtIsNull(UUID userId);

  /** Ack/delete a single notification, but only if it belongs to the caller. */
  void deleteByIdAndUserId(UUID id, UUID userId);

  /** Mark every unread notification of a user as read (opening the center). */
  @Modifying
  @Query("update Notification n set n.readAt = :now where n.user.id = :userId and n.readAt is null")
  int markAllRead(@Param("userId") UUID userId, @Param("now") Instant now);

  /** Purge the caller's already-read notifications (post-close cleanup). */
  void deleteAllByUserIdAndReadAtIsNotNull(UUID userId);

  /** Remove every notification owned by a user (account deletion). */
  void deleteAllByUserId(UUID userId);

  /** Retention job: drop notifications older than a cutoff. */
  void deleteAllByCreatedAtBefore(Instant cutoff);
}
