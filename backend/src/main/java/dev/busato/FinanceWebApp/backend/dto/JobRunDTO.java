package dev.busato.FinanceWebApp.backend.dto;

import java.time.Instant;

/** A single run in a job's history. */
public record JobRunDTO(
    Instant startedAt,
    Instant finishedAt,
    String status,
    String message,
    long durationMs,
    boolean manual) {}
