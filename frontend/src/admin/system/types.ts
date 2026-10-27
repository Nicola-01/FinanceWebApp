// Mirror the backend DTOs.

export interface JobRunDTO {
  startedAt: string;
  finishedAt: string | null;
  status: string; // SUCCESS | FAILURE
  message: string | null;
  durationMs: number;
  manual: boolean;
}

export interface ScheduledJobDTO {
  key: string;
  displayName: string;
  enabled: boolean;
  frequency: string; // HOURLY | DAILY | WEEKLY | MONTHLY | YEARLY
  hourOfDay: number;
  minuteOfHour: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  nextRunAt: string | null;
  recentRuns: JobRunDTO[];
}
