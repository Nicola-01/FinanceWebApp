package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.AssignableUuidV7;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Per-wallet Open Banking rule: imports whose name matches it get its tag/rename, or are routed to
 * the subscription that references it (see openbanking/BankMatchRule).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bank_rules")
public class BankRule {

  @Id @AssignableUuidV7 private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  @Column(nullable = false)
  private String name;

  /** Text searched in bank-imported transaction names. */
  @Column(nullable = false)
  private String matchText;

  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean regex = false;

  @Column(nullable = false)
  @ColumnDefault("true")
  @Builder.Default
  private boolean ignoreCase = true;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tag_id")
  private Tag tag;

  private String renameTo;

  /** Apply tag/name but keep the import in "To categorise" for the user to confirm. */
  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean reviewFirst = false;

  /** Use the purchase date written in the bank description instead of the booking date. */
  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean dateFromName = false;

  @UpdateTimestamp @Column private Instant updatedAt;
}
