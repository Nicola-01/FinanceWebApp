package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.AssignableUuidV7;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transactions")
public class Transaction {

  @Id @AssignableUuidV7 private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  // Se nullo, è una transazione senza categoria (da categorizzare)
  @ManyToOne
  @JoinColumn(name = "tag_id")
  private Tag tag;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "subscription_id")
  private Subscription subscription;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal amount; // In wallet Value (EUR)

  private String encryptedAmount;

  /**
   * When true the real amount is not known yet: amount and originalAmount stay 0 until the user
   * fills them in (rendered as a pinned "awaiting amount" row in the UI). Only
   * subscription-generated transactions are ever created pending.
   */
  @Column(nullable = false)
  @ColumnDefault("false")
  @Builder.Default
  private boolean amountPending = false;

  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal originalAmount;

  @Column(precision = 19, scale = 6)
  private BigDecimal exchangeValue;

  private String originalCurrency;

  @Enumerated(EnumType.STRING)
  private Type type; // INCOME, EXPENSE

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(nullable = false)
  private LocalDate transactionDate;

  /** Server-side last-write timestamp; optimistic precondition for offline replays. */
  @UpdateTimestamp @Column private Instant updatedAt;

  public enum Type {
    INCOME,
    EXPENSE
  }
}
