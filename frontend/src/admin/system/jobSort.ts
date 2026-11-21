import type { ScheduledJobDTO } from "./types";

export type JobSortKey = "name" | "lastRun" | "status" | "nextRun";
/** `asc` = the key's default order (A→Z, newest run first, failed first, soonest first). */
export type SortDir = "asc" | "desc";

export const JOB_SORT_OPTIONS: { value: JobSortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "lastRun", label: "Last run" },
  { value: "status", label: "Status" },
  { value: "nextRun", label: "Next run" },
];

/** Server returns `recentRuns` newest first. */
export function lastRunOf(job: ScheduledJobDTO) {
  return job.recentRuns[0];
}

export type RunStatus = "failed" | "ok" | "never";

export function runStatus(job: ScheduledJobDTO): RunStatus {
  const run = lastRunOf(job);
  if (!run) return "never";
  return run.status === "SUCCESS" ? "ok" : "failed";
}

const STATUS_RANK: Record<RunStatus, number> = { failed: 0, never: 1, ok: 2 };

/** Missing timestamps always sort last, whatever the direction. */
function byTime(
  a: string | null | undefined,
  b: string | null | undefined,
  multiplier: number,
): number {
  if (!a || !b) return a ? -1 : b ? 1 : 0;
  return multiplier * (Date.parse(a) - Date.parse(b));
}

/**
 * Returns a sorted copy (stable; ties keep the input order). Name compares
 * case-insensitively. Jobs with no run / no next run go last.
 */
export function sortJobs(
  jobs: ScheduledJobDTO[],
  key: JobSortKey,
  dir: SortDir = "asc",
): ScheduledJobDTO[] {
  const sign = dir === "asc" ? 1 : -1;
  const compare: Record<
    JobSortKey,
    (a: ScheduledJobDTO, b: ScheduledJobDTO) => number
  > = {
    name: (a, b) =>
      sign *
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      }),
    status: (a, b) =>
      sign * (STATUS_RANK[runStatus(a)] - STATUS_RANK[runStatus(b)]),
    // Default: newest run first, so the time difference is negated.
    lastRun: (a, b) =>
      byTime(lastRunOf(a)?.startedAt, lastRunOf(b)?.startedAt, -sign),
    nextRun: (a, b) => byTime(a.nextRunAt, b.nextRunAt, sign),
  };
  return [...jobs].sort(compare[key]);
}
