package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/**
 * A persisted, per-recipient notification. One row is written for every user that should be told
 * about an event; the same row also drives the Phase-2 in-app notification center. {@code readAt}
 * is null until the recipient opens the center; a push click acks (deletes) the row outright.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private NotificationType type;

  /**
   * Wallet the event happened in; null for account-level notifications (e.g. invites land here).
   */
  private UUID walletId;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String body;

  private String url;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;

  /** Set when the recipient opens the notification center; null while unread. */
  private Instant readAt;

  public enum NotificationType {
    WALLET_INVITE,
    TRANSACTION_CREATED,
    TRANSACTION_UPDATED,
    TRANSACTION_DELETED,
    SUBSCRIPTION_CREATED,
    SUBSCRIPTION_UPDATED,
    SUBSCRIPTION_DELETED,
    RECURRING_EXECUTED
  }
}
