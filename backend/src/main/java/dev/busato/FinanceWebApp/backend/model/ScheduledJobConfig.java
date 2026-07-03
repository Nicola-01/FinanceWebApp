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

  @Enumerated(EnumType.STRING)
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
}
