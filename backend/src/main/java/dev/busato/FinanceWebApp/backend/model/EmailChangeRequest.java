package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/**
 * Pending double-verification email change. At most ONE active request exists per user (enforced by
 * the unique {@code userId} column) — a new request replaces any previous one.
 *
 * <p>The two 6-digit codes are NEVER stored in plaintext: only their SHA-256 hashes are persisted,
 * mirroring the hashing approach used for Personal Access Tokens.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "email_change_requests")
public class EmailChangeRequest {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class) // Time-ordered UUID v7 (RFC 9562)
  private UUID id;

  /** Owner of the pending request — unique, so only one email change can be in flight per user. */
  @Column(nullable = false, unique = true)
  private UUID userId;

  /**
   * The requested new address (validated free & different from the current one at request time).
   */
  @Column(nullable = false)
  private String newEmail;

  /** SHA-256 hash of the code sent to the user's CURRENT address. */
  @Column(nullable = false)
  private String currentCodeHash;

  /** SHA-256 hash of the code sent to the NEW address. */
  @Column(nullable = false)
  private String newCodeHash;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  /** Number of confirm attempts so far; the request is dropped once it exceeds the limit. */
  @Column(nullable = false)
  @Builder.Default
  private int attempts = 0;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
