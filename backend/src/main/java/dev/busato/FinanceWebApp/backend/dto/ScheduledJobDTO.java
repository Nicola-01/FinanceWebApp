package dev.busato.FinanceWebApp.backend.dto;

import java.time.Instant;
import java.util.List;

/** Full state of a managed job for the admin System tab. */
public record ScheduledJobDTO(
    String key,
    String displayName,
    boolean enabled,
    String frequency,
    int hourOfDay,
    int minuteOfHour,
    List<String> daysOfWeek,
    Integer dayOfMonth,
    Integer monthOfYear,
    Instant nextRunAt,
    List<JobRunDTO> recentRuns) {}
