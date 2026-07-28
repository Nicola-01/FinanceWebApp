package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Persisted, editable schedule for a {@link
 * dev.busato.FinanceWebApp.backend.scheduling.ManagedJob}. The cron expression is computed from
 * these structured fields (no raw-cron parsing).
 */
@Entity
@Table(name = "scheduled_job_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledJobConfig {

  /** Matches {@link dev.busato.FinanceWebApp.backend.scheduling.ManagedJob#key()}. */
  @Id private String jobKey;

  @Column(nullable = false)
  private boolean enabled;

  /**
   * Persisted via {@link dev.busato.FinanceWebApp.backend.scheduling.JobFrequencyConverter} (not
   * {@code @Enumerated}) so Hibernate does not generate a DB CHECK constraint pinned to today's
   * enum constants — see the converter's javadoc for why.
   */
  @Column(nullable = false)
  private JobFrequency frequency;

  /** 0–23. Ignored for HOURLY. */
  @Column(nullable = false)
  private int hourOfDay;

  /** 0–59. */
  @Column(nullable = false)
  private int minuteOfHour;

  /** CSV of day-of-week tokens ("MON,WED") for WEEKLY; null/blank otherwise. */
  private String daysOfWeek;

  /** 1–28 day of month for MONTHLY/YEARLY; null otherwise (treated as 1). */
  private Integer dayOfMonth;

  /** 1–12 month for YEARLY; null otherwise (treated as 1 = January). */
  private Integer monthOfYear;
}
