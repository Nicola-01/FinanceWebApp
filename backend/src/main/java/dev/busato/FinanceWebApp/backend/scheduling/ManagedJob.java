package dev.busato.FinanceWebApp.backend.scheduling;

/**
 * A scheduled maintenance job whose schedule is stored in the DB and driven by {@link
 * ScheduledJobService} (instead of a hardcoded {@code @Scheduled} annotation). Each implementation
 * provides its stable key, a display name, its default schedule (used to seed the first config) and
 * the actual work.
 */
public interface ManagedJob {

  /** Stable identifier, e.g. {@code "backup"}. Used as the config/history key. */
  String key();

  /** Human-readable name shown in the admin System tab. */
  String displayName();

  /**
   * Execute the job. Returns a short result message stored in the run history (may be {@code
   * null}); throwing marks the run as failed.
   */
  String run() throws Exception;

  /**
   * Whether the job is currently applicable. An unavailable job is neither scheduled nor listed
   * (e.g. Demo Cleanup when demo mode is off).
   */
  default boolean available() {
    return true;
  }

  /** Default schedule used to seed the first {@link ScheduledJobConfig} row. */
  ScheduleDefaults defaults();

  /** Default schedule values for seeding. {@code daysOfWeek} is a CSV (e.g. "MON,WED") or null. */
  record ScheduleDefaults(JobFrequency frequency, int hour, int minute, String daysOfWeek) {}
}
