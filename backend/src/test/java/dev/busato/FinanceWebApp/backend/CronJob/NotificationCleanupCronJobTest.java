package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.repository.NotificationRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationCleanupCronJobTest {

  @Mock private NotificationRepository notificationRepository;

  private NotificationCleanupCronJob job;

  @BeforeEach
  void setUp() {
    Clock clock = Clock.fixed(Instant.parse("2026-07-10T03:30:00Z"), ZoneOffset.UTC);
    job = new NotificationCleanupCronJob(notificationRepository, clock);
  }

  @Test
  void metadata_matchesExpectedDefaults() {
    assertEquals("notification-cleanup", job.key());
    assertEquals("Notification Cleanup", job.displayName());
    assertTrue(job.available());

    ManagedJob.ScheduleDefaults d = job.defaults();
    assertEquals(JobFrequency.DAILY, d.frequency());
    assertEquals(3, d.hour());
    assertEquals(30, d.minute());
  }

  @Test
  void run_deletesOlderThanRetentionAndReturnsSummary() {
    when(notificationRepository.deleteAllByCreatedAtBefore(any())).thenReturn(5L);

    String message = job.run();

    ArgumentCaptor<Instant> cutoff = ArgumentCaptor.forClass(Instant.class);
    verify(notificationRepository).deleteAllByCreatedAtBefore(cutoff.capture());
    // 2026-07-10 minus 30 days
    assertEquals(Instant.parse("2026-06-10T03:30:00Z"), cutoff.getValue());
    assertEquals("Deleted 5 notification(s) older than 30 days", message);
  }
}
