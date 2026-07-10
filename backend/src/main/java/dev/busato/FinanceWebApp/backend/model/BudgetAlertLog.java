package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

/**
 * Remembers which (budget, period, threshold) alert emails were already sent, so the cron job never
 * re-alerts within the same period.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "budget_alert_logs",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_budget_alert",
          columnNames = {"budget_id", "period_key", "threshold"})
    })
public class BudgetAlertLog {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "budget_id", nullable = false)
  private Budget budget;

  // "2026-07" (monthly) / "2026-W28" (weekly) / "2026" (yearly) / "custom".
  @Column(name = "period_key", nullable = false)
  private String periodKey;

  @Column(nullable = false)
  private int threshold;

  @Column(nullable = false)
  private Instant sentAt;
}
