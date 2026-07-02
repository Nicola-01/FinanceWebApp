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
 * JPA entity for Personal Access Tokens (PATs).
 *
 * <p>The plain token is NEVER stored — only its SHA-256 hash is persisted. Wallet-level permissions
 * are stored as a JSON string in a TEXT column.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "personal_access_tokens",
    indexes = {
      @Index(name = "idx_pat_token_hash", columnList = "tokenHash", unique = true),
      @Index(name = "idx_pat_user_id", columnList = "user_id")
    })
public class PersonalAccessToken {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  /** User-defined label for easy identification (e.g., "CI/CD Bot") */
  @Column(nullable = false)
  private String name;

  /** SHA-256 hash of the plain token — the ONLY stored representation */
  @Column(nullable = false, unique = true)
  private String tokenHash;

  /** First 12 characters of the plain token for UI display (e.g., "fin_pat_a1b2") */
  @Column(nullable = false)
  private String tokenPrefix;

  /** Owner of this token */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  /**
   * JSON-encoded wallet permissions. Format: [{"walletId":"uuid","permissions":["READ","WRITE"]}]
   */
  @Column(columnDefinition = "TEXT")
  private String walletPermissions;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  /** Null means the token never expires */
  private LocalDateTime expiresAt;

  /** Tracks when this token was last used for authentication */
  private LocalDateTime lastUsedAt;
}
