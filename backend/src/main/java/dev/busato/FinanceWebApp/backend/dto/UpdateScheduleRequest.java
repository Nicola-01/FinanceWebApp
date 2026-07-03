package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** Request to change a job's schedule (structured — no raw cron). */
public record UpdateScheduleRequest(
    @NotNull JobFrequency frequency,
    @Min(0) @Max(23) int hourOfDay,
    @Min(0) @Max(59) int minuteOfHour,
    List<String> daysOfWeek) {}
