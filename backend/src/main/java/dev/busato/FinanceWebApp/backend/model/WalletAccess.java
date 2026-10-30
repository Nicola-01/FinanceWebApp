package dev.busato.FinanceWebApp.backend.model;

import jakarta.persistence.*;
import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "wallet_access")
@Data
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class WalletAccess {

  @EmbeddedId @EqualsAndHashCode.Include private WalletAccessId id;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("userId")
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @ManyToOne(fetch = FetchType.LAZY)
  @MapsId("walletId")
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private WalletRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InvitationStatus status;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDate invitedAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private LocalDate updatedAt;

  /** When true, this member receives no push/notifications for activity in this wallet. */
  @Column(nullable = false, columnDefinition = "boolean default false")
  private boolean notificationsMuted = false;

  // Per-event-type opt-outs for this wallet (all default ON); only consulted while unmuted.
  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean notifyTransactions = true;

  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean notifySubscriptions = true;

  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean notifyRecurringExecutions = true;

  @Column(nullable = false, columnDefinition = "boolean default true")
  private boolean notifyBudgets = true;

  @PrePersist
  void onCreate() {
    if (status == null) {
      status = InvitationStatus.PENDING;
    }
  }

  @Embeddable
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WalletAccessId implements Serializable {
    @Serial private static final long serialVersionUID = 1L;
    private UUID userId;
    private UUID walletId;
  }

  public enum WalletRole {
    OWNER,
    EDITOR,
    VIEWER
  }

  public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    LEFT,
    REVOKED
  }
}
