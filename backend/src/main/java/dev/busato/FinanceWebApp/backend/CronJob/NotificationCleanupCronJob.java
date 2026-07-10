package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.repository.NotificationRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deletes notifications older than {@value #RETENTION_DAYS} days so never-opened histories stay
 * bounded. Default schedule: daily at 03:30 (editable in the admin System tab).
 */
@Component
@RequiredArgsConstructor
public class NotificationCleanupCronJob implements ManagedJob {

  private static final int RETENTION_DAYS = 30;

  private final NotificationRepository notificationRepository;
  private final Clock clock;

  @Override
  public String key() {
    return "notification-cleanup";
  }

  @Override
  public String displayName() {
    return "Notification Cleanup";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.DAILY, 3, 30, null);
  }

  @Override
  @Transactional
  public String run() {
    Instant cutoff = Instant.now(clock).minus(RETENTION_DAYS, ChronoUnit.DAYS);
    long deleted = notificationRepository.deleteAllByCreatedAtBefore(cutoff);
    return "Deleted " + deleted + " notification(s) older than " + RETENTION_DAYS + " days";
  }
}
