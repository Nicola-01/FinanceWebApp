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
 * A single browser push subscription owned by a {@link User}. One user can have many (one per
 * device/browser). The {@code endpoint} is globally unique — the browser reuses it and may
 * re-register it under a different account, so it carries a unique constraint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "push_subscriptions",
    uniqueConstraints = @UniqueConstraint(name = "uk_push_endpoint", columnNames = "endpoint"))
public class PushSubscription {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 1024)
  private String endpoint;

  @Column(nullable = false, length = 512)
  private String p256dh;

  @Column(nullable = false, length = 512)
  private String auth;

  private String userAgent;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;
}
