package dev.busato.FinanceWebApp.backend.scheduling;

import dev.busato.FinanceWebApp.backend.dto.JobRunDTO;
import dev.busato.FinanceWebApp.backend.dto.ScheduledJobDTO;
import dev.busato.FinanceWebApp.backend.dto.UpdateScheduleRequest;
import dev.busato.FinanceWebApp.backend.model.JobRun;
import dev.busato.FinanceWebApp.backend.model.ScheduledJobConfig;
import dev.busato.FinanceWebApp.backend.repository.JobRunRepository;
import dev.busato.FinanceWebApp.backend.repository.ScheduledJobConfigRepository;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Owns the lifecycle of every {@link ManagedJob}: seeds the first {@link ScheduledJobConfig} from
 * defaults, computes the cron from the structured schedule, (re)schedules jobs live on the {@link
 * ThreadPoolTaskScheduler}, runs them on demand, and records a {@link JobRun} per execution.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledJobService {

  /** Max runs kept per job in the history table. */
  static final int HISTORY_CAP = 50;

  private final List<ManagedJob> jobList;
  private final ScheduledJobConfigRepository configRepo;
  private final JobRunRepository jobRunRepository;
  private final ThreadPoolTaskScheduler taskScheduler;

  private final Map<String, ManagedJob> jobs = new LinkedHashMap<>();
  private final Map<String, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  @PostConstruct
  public void init() {
    for (ManagedJob job : jobList) {
      jobs.put(job.key(), job);
      if (!configRepo.existsById(job.key())) {
        ManagedJob.ScheduleDefaults d = job.defaults();
        configRepo.save(
            ScheduledJobConfig.builder()
                .jobKey(job.key())
                .enabled(true)
                .frequency(d.frequency())
                .hourOfDay(d.hour())
                .minuteOfHour(d.minute())
                .daysOfWeek(d.daysOfWeek())
                .build());
        log.info("[Jobs] Seeded default config for '{}'", job.key());
      }
    }
    jobs.keySet().forEach(this::scheduleJob);
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  /** All available jobs (unavailable ones — e.g. Demo Cleanup when demo is off — are hidden). */
  public List<ScheduledJobDTO> listJobs() {
    List<ScheduledJobDTO> out = new ArrayList<>();
    for (ManagedJob job : jobs.values()) {
      if (!job.available()) continue;
      out.add(toDTO(job, requireConfig(job.key())));
    }
    return out;
  }

  public ScheduledJobDTO getJob(String key) {
    ManagedJob job = requireJob(key);
    return toDTO(job, requireConfig(key));
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  public ScheduledJobDTO updateSchedule(String key, UpdateScheduleRequest req) {
    ManagedJob job = requireJob(key);
    ScheduledJobConfig cfg = requireConfig(key);
    cfg.setFrequency(req.frequency());
    cfg.setHourOfDay(req.hourOfDay());
    cfg.setMinuteOfHour(req.minuteOfHour());
    cfg.setDaysOfWeek(joinDays(req.daysOfWeek()));
    configRepo.save(cfg);
    scheduleJob(key);
    log.info("[Jobs] Rescheduled '{}' → {}", key, toCron(cfg));
    return toDTO(job, cfg);
  }

  public ScheduledJobDTO setEnabled(String key, boolean enabled) {
    ManagedJob job = requireJob(key);
    ScheduledJobConfig cfg = requireConfig(key);
    cfg.setEnabled(enabled);
    configRepo.save(cfg);
    scheduleJob(key);
    log.info("[Jobs] '{}' enabled={}", key, enabled);
    return toDTO(job, cfg);
  }

  /** Runs the job immediately (synchronously) and records the run. */
  public ScheduledJobDTO runNow(String key) {
    ManagedJob job = requireJob(key);
    execute(job, true);
    return toDTO(job, requireConfig(key));
  }

  // ── Execution / scheduling ──────────────────────────────────────────────────

  private void scheduleJob(String key) {
    ScheduledFuture<?> existing = futures.remove(key);
    if (existing != null) existing.cancel(false);

    ScheduledJobConfig cfg = configRepo.findById(key).orElse(null);
    ManagedJob job = jobs.get(key);
    if (cfg == null || job == null || !cfg.isEnabled() || !job.available()) return;

    ScheduledFuture<?> future =
        taskScheduler.schedule(() -> execute(job, false), new CronTrigger(toCron(cfg)));
    if (future != null) futures.put(key, future);
  }

  /** Wraps a job execution, recording start/end/status/duration as a {@link JobRun}. */
  void execute(ManagedJob job, boolean manual) {
    Instant start = Instant.now();
    JobRun run = JobRun.builder().jobKey(job.key()).startedAt(start).manual(manual).build();
    try {
      String message = job.run();
      run.setStatus(JobRunStatus.SUCCESS);
      run.setMessage(message);
    } catch (Exception e) {
      run.setStatus(JobRunStatus.FAILURE);
      run.setMessage(e.getMessage());
      log.error("[Jobs] '{}' failed: {}", job.key(), e.getMessage(), e);
    } finally {
      Instant end = Instant.now();
      run.setFinishedAt(end);
      run.setDurationMs(Duration.between(start, end).toMillis());
    }
    jobRunRepository.save(run);
    pruneHistory(job.key());
  }

  private void pruneHistory(String key) {
    List<JobRun> all = jobRunRepository.findByJobKeyOrderByStartedAtDesc(key);
    if (all.size() > HISTORY_CAP) {
      jobRunRepository.deleteAll(all.subList(HISTORY_CAP, all.size()));
    }
  }

  // ── Cron / next-run helpers ─────────────────────────────────────────────────

  /** Computes a Spring 6-field cron ({@code sec min hour dom month dow}) from the config. */
  static String toCron(ScheduledJobConfig c) {
    return switch (c.getFrequency()) {
      case HOURLY -> String.format("0 %d * * * *", c.getMinuteOfHour());
      case DAILY -> String.format("0 %d %d * * *", c.getMinuteOfHour(), c.getHourOfDay());
      case WEEKLY -> {
        String days =
            (c.getDaysOfWeek() == null || c.getDaysOfWeek().isBlank()) ? "*" : c.getDaysOfWeek();
        yield String.format("0 %d %d * * %s", c.getMinuteOfHour(), c.getHourOfDay(), days);
      }
    };
  }

  private Instant nextRun(ScheduledJobConfig cfg, ManagedJob job) {
    if (!cfg.isEnabled() || !job.available()) return null;
    LocalDateTime next = CronExpression.parse(toCron(cfg)).next(LocalDateTime.now());
    return next == null ? null : next.atZone(ZoneId.systemDefault()).toInstant();
  }

  // ── Mapping ─────────────────────────────────────────────────────────────────

  private ScheduledJobDTO toDTO(ManagedJob job, ScheduledJobConfig cfg) {
    List<JobRunDTO> runs =
        jobRunRepository.findTop20ByJobKeyOrderByStartedAtDesc(job.key()).stream()
            .map(
                r ->
                    new JobRunDTO(
                        r.getStartedAt(),
                        r.getFinishedAt(),
                        r.getStatus().name(),
                        r.getMessage(),
                        r.getDurationMs(),
                        r.isManual()))
            .toList();

    return new ScheduledJobDTO(
        job.key(),
        job.displayName(),
        cfg.isEnabled(),
        cfg.getFrequency().name(),
        cfg.getHourOfDay(),
        cfg.getMinuteOfHour(),
        splitDays(cfg.getDaysOfWeek()),
        nextRun(cfg, job),
        runs);
  }

  private static String joinDays(List<String> days) {
    if (days == null || days.isEmpty()) return null;
    return String.join(",", days);
  }

  private static List<String> splitDays(String csv) {
    if (csv == null || csv.isBlank()) return List.of();
    return List.of(csv.split(","));
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  private ManagedJob requireJob(String key) {
    ManagedJob job = jobs.get(key);
    if (job == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown job: " + key);
    }
    return job;
  }

  private ScheduledJobConfig requireConfig(String key) {
    return configRepo
        .findById(key)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No config for job: " + key));
  }
}
