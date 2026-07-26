package dev.busato.FinanceWebApp.backend.scheduling;

/** How often a managed job runs. Drives the (computed) cron expression. */
public enum JobFrequency {
  HOURLY,
  DAILY,
  WEEKLY,
  MONTHLY,
  YEARLY
}
