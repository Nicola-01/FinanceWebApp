package dev.busato.FinanceWebApp.backend.scheduling;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.ScheduledJobDTO;
import dev.busato.FinanceWebApp.backend.dto.UpdateScheduleRequest;
import dev.busato.FinanceWebApp.backend.model.JobRun;
import dev.busato.FinanceWebApp.backend.model.ScheduledJobConfig;
import dev.busato.FinanceWebApp.backend.repository.JobRunRepository;
import dev.busato.FinanceWebApp.backend.repository.ScheduledJobConfigRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ScheduledJobServiceTest {

  @Mock private ScheduledJobConfigRepository configRepo;
  @Mock private JobRunRepository jobRunRepository;
  @Mock private ThreadPoolTaskScheduler taskScheduler;

  private ManagedJob backupJob;
  private ManagedJob demoJob; // unavailable (demo off)
  private ScheduledJobConfig backupCfg;
  private ScheduledJobConfig demoCfg;
  private ScheduledJobService service;

  @BeforeEach
  void setUp() {
    backupJob = mock(ManagedJob.class);
    lenient().when(backupJob.key()).thenReturn("backup");
    lenient().when(backupJob.displayName()).thenReturn("Database Backup");
    lenient().when(backupJob.available()).thenReturn(true);
    lenient()
        .when(backupJob.defaults())
        .thenReturn(new ManagedJob.ScheduleDefaults(JobFrequency.DAILY, 3, 0, null));

    demoJob = mock(ManagedJob.class);
    lenient().when(demoJob.key()).thenReturn("demo-cleanup");
    lenient().when(demoJob.displayName()).thenReturn("Demo Cleanup");
    lenient().when(demoJob.available()).thenReturn(false);
    lenient()
        .when(demoJob.defaults())
        .thenReturn(new ManagedJob.ScheduleDefaults(JobFrequency.DAILY, 3, 0, null));

    backupCfg = config("backup", true, JobFrequency.DAILY, 3, 0, null);
    demoCfg = config("demo-cleanup", true, JobFrequency.DAILY, 3, 0, null);

    lenient().when(configRepo.existsById(anyString())).thenReturn(true);
    lenient().when(configRepo.findById("backup")).thenReturn(Optional.of(backupCfg));
    lenient().when(configRepo.findById("demo-cleanup")).thenReturn(Optional.of(demoCfg));
    lenient()
        .when(configRepo.save(any(ScheduledJobConfig.class)))
        .thenAnswer(i -> i.getArgument(0));
    lenient()
        .when(jobRunRepository.findTop20ByJobKeyOrderByStartedAtDesc(anyString()))
        .thenReturn(List.of());
    lenient()
        .when(jobRunRepository.findByJobKeyOrderByStartedAtDesc(anyString()))
        .thenReturn(List.of());
    lenient()
        .doReturn(mock(ScheduledFuture.class))
        .when(taskScheduler)
        .schedule(any(Runnable.class), any(Trigger.class));

    service =
        new ScheduledJobService(
            List.of(backupJob, demoJob), configRepo, jobRunRepository, taskScheduler);
    service.init();
  }

  private static ScheduledJobConfig config(
      String key, boolean enabled, JobFrequency f, int h, int m, String days) {
    return ScheduledJobConfig.builder()
        .jobKey(key)
        .enabled(enabled)
        .frequency(f)
        .hourOfDay(h)
        .minuteOfHour(m)
        .daysOfWeek(days)
        .build();
  }

  // ── init / scheduling ──────────────────────────────────────────────────────

  @Test
  void init_SchedulesEnabledAvailableJob_NotUnavailableOne() {
    // Only the backup job is scheduled; the unavailable demo job is not.
    verify(taskScheduler, times(1)).schedule(any(Runnable.class), any(Trigger.class));
  }

  @Test
  void init_SeedsConfigWhenAbsent() {
    ScheduledJobConfigRepository repo = mock(ScheduledJobConfigRepository.class);
    when(repo.existsById("backup")).thenReturn(false);
    when(repo.findById("backup")).thenReturn(Optional.empty()); // scheduleJob no-op
    when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

    ManagedJob job = mock(ManagedJob.class);
    when(job.key()).thenReturn("backup");
    when(job.defaults())
        .thenReturn(new ManagedJob.ScheduleDefaults(JobFrequency.DAILY, 3, 0, null));

    ScheduledJobService svc =
        new ScheduledJobService(List.of(job), repo, jobRunRepository, taskScheduler);
    svc.init();

    verify(repo)
        .save(
            argThat(
                c ->
                    c.getJobKey().equals("backup")
                        && c.isEnabled()
                        && c.getFrequency() == JobFrequency.DAILY
                        && c.getHourOfDay() == 3
                        && c.getMinuteOfHour() == 0));
  }

  // ── query ───────────────────────────────────────────────────────────────────

  @Test
  void listJobs_HidesUnavailableJobs() {
    List<ScheduledJobDTO> jobs = service.listJobs();

    assertEquals(1, jobs.size());
    assertEquals("backup", jobs.get(0).key());
  }

  @Test
  void getJob_ReturnsScheduleAndNextRun() {
    ScheduledJobDTO dto = service.getJob("backup");

    assertEquals("backup", dto.key());
    assertEquals("Database Backup", dto.displayName());
    assertEquals("DAILY", dto.frequency());
    assertEquals(3, dto.hourOfDay());
    assertEquals(0, dto.minuteOfHour());
    assertTrue(dto.enabled());
    assertNotNull(dto.nextRunAt(), "an enabled job must have a next run");
  }

  @Test
  void getJob_Unknown_ThrowsNotFound() {
    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> service.getJob("nope"));
    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
  }

  // ── mutations ─────────────────────────────────────────────────────────────

  @Test
  void updateSchedule_MutatesConfigAndReschedules() {
    UpdateScheduleRequest req =
        new UpdateScheduleRequest(JobFrequency.WEEKLY, 4, 30, List.of("MON", "WED"));

    ScheduledJobDTO dto = service.updateSchedule("backup", req);

    assertEquals("WEEKLY", dto.frequency());
    assertEquals(4, dto.hourOfDay());
    assertEquals(30, dto.minuteOfHour());
    assertEquals(List.of("MON", "WED"), dto.daysOfWeek());
    assertEquals(JobFrequency.WEEKLY, backupCfg.getFrequency());
    assertEquals("MON,WED", backupCfg.getDaysOfWeek());
    verify(configRepo, atLeastOnce()).save(backupCfg);
    // once during init + once for the reschedule
    verify(taskScheduler, times(2)).schedule(any(Runnable.class), any(Trigger.class));
  }

  @Test
  void setEnabled_False_DisablesAndClearsNextRun() {
    ScheduledJobDTO dto = service.setEnabled("backup", false);

    assertFalse(dto.enabled());
    assertNull(dto.nextRunAt());
    assertFalse(backupCfg.isEnabled());
  }

  // ── run now / execution ─────────────────────────────────────────────────────

  @Test
  void runNow_Success_RecordsSuccessRun() throws Exception {
    when(backupJob.run()).thenReturn("done");

    service.runNow("backup");

    ArgumentCaptor<JobRun> cap = ArgumentCaptor.forClass(JobRun.class);
    verify(jobRunRepository).save(cap.capture());
    JobRun run = cap.getValue();
    assertEquals("backup", run.getJobKey());
    assertEquals(JobRunStatus.SUCCESS, run.getStatus());
    assertEquals("done", run.getMessage());
    assertTrue(run.isManual());
    assertNotNull(run.getFinishedAt());
  }

  @Test
  void runNow_Failure_RecordsFailureRun_DoesNotThrow() throws Exception {
    when(backupJob.run()).thenThrow(new RuntimeException("boom"));

    assertDoesNotThrow(() -> service.runNow("backup"));

    ArgumentCaptor<JobRun> cap = ArgumentCaptor.forClass(JobRun.class);
    verify(jobRunRepository).save(cap.capture());
    assertEquals(JobRunStatus.FAILURE, cap.getValue().getStatus());
    assertEquals("boom", cap.getValue().getMessage());
  }

  @Test
  void runNow_Unknown_ThrowsNotFound() {
    assertThrows(ResponseStatusException.class, () -> service.runNow("nope"));
  }

  @Test
  void execute_PrunesHistoryBeyondCap() throws Exception {
    when(backupJob.run()).thenReturn("ok");
    List<JobRun> many = new ArrayList<>();
    for (int i = 0; i < ScheduledJobService.HISTORY_CAP + 3; i++) {
      many.add(JobRun.builder().jobKey("backup").build());
    }
    when(jobRunRepository.findByJobKeyOrderByStartedAtDesc("backup")).thenReturn(many);

    service.runNow("backup");

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<JobRun>> cap = ArgumentCaptor.forClass(List.class);
    verify(jobRunRepository).deleteAll(cap.capture());
    assertEquals(3, cap.getValue().size());
  }

  // ── cron computation ──────────────────────────────────────────────────────

  @Test
  void toCron_ComputesExpectedExpressions() {
    assertEquals(
        "0 15 * * * *",
        ScheduledJobService.toCron(config("k", true, JobFrequency.HOURLY, 0, 15, null)));
    assertEquals(
        "0 0 3 * * *",
        ScheduledJobService.toCron(config("k", true, JobFrequency.DAILY, 3, 0, null)));
    assertEquals(
        "0 30 4 * * MON,WED",
        ScheduledJobService.toCron(config("k", true, JobFrequency.WEEKLY, 4, 30, "MON,WED")));
    assertEquals(
        "0 30 4 * * *",
        ScheduledJobService.toCron(config("k", true, JobFrequency.WEEKLY, 4, 30, null)));
  }
}
