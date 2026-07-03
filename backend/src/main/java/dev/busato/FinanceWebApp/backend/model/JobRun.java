package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import dev.busato.FinanceWebApp.backend.scheduling.JobRunStatus;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

/** A single execution record for a managed job (run history / audit trail). */
@Entity
@Table(name = "job_run")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRun {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @Column(nullable = false)
  private String jobKey;

  @Column(nullable = false)
  private Instant startedAt;

  private Instant finishedAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private JobRunStatus status;

  @Column(length = 1000)
  private String message;

  private long durationMs;

  /** True when triggered via the "Run now" button, false for scheduled runs. */
  private boolean manual;
}
