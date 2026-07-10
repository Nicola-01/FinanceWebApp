package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "budgets")
public class Budget {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  // Null means the budget tracks the whole wallet. A tag budget also counts the
  // tag's entire subtree of child tags.
  @ManyToOne
  @JoinColumn(name = "tag_id")
  private Tag tag;

  @Column(nullable = false)
  private String name;

  // Spending limit per period, in the wallet's currency.
  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal limitAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PeriodType periodType;

  // Recurring: activation anchor — the first period is the calendar period containing
  // this date (no proration). CUSTOM: the range start.
  @Column(nullable = false)
  private LocalDate startDate;

  // CUSTOM only (inclusive). Null for recurring budgets.
  private LocalDate endDate;

  // Recurring only: carry the unspent/overspent remainder into the next period.
  @Builder.Default
  @Column(nullable = false)
  private boolean rollover = false;

  // JSON int array (e.g. "[80,100]"), sorted ascending, values 1–200, max 5 entries.
  // Empty array = alerts disabled for this budget. Same JSON-in-column precedent as
  // PersonalAccessToken.walletPermissions.
  @Builder.Default
  @Column(nullable = false)
  private String alertThresholds = "[80,100]";

  public enum PeriodType {
    WEEKLY,
    MONTHLY,
    YEARLY,
    CUSTOM
  }
}
