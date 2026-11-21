import { describe, it, expect } from "vitest";
import { sortJobs } from "../../../admin/system/jobSort";
import type { JobRunDTO, ScheduledJobDTO } from "../../../admin/system/types";

const run = (startedAt: string, status = "SUCCESS"): JobRunDTO => ({
  startedAt,
  finishedAt: null,
  status,
  message: null,
  durationMs: 0,
  manual: false,
});

const job = (
  key: string,
  displayName: string,
  overrides: Partial<ScheduledJobDTO> = {},
): ScheduledJobDTO => ({
  key,
  displayName,
  enabled: true,
  frequency: "DAILY",
  hourOfDay: 2,
  minuteOfHour: 0,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  nextRunAt: null,
  recentRuns: [],
  ...overrides,
});

const names = (jobs: ScheduledJobDTO[]) => jobs.map((j) => j.displayName);

describe("sortJobs", () => {
  const jobs = [
    job("c", "Subscriptions"),
    job("a", "backup"),
    job("b", "Demo cleanup"),
  ];

  it("sorts by name A→Z, case-insensitively, by default", () => {
    expect(names(sortJobs(jobs, "name"))).toEqual([
      "backup",
      "Demo cleanup",
      "Subscriptions",
    ]);
  });

  it("reverses with desc", () => {
    expect(names(sortJobs(jobs, "name", "desc"))).toEqual([
      "Subscriptions",
      "Demo cleanup",
      "backup",
    ]);
  });

  it("does not mutate the input", () => {
    const copy = [...jobs];
    sortJobs(jobs, "name");
    expect(jobs).toEqual(copy);
  });

  it("is stable for equal keys", () => {
    const same = [job("x", "Same"), job("y", "Same")];
    expect(sortJobs(same, "name").map((j) => j.key)).toEqual(["x", "y"]);
  });

  it("orders last run newest first with missing runs last", () => {
    const list = [
      job("none", "None"),
      job("old", "Old", { recentRuns: [run("2026-01-01T02:00:00Z")] }),
      job("new", "New", { recentRuns: [run("2026-03-01T02:00:00Z")] }),
    ];
    expect(sortJobs(list, "lastRun").map((j) => j.key)).toEqual([
      "new",
      "old",
      "none",
    ]);
    expect(sortJobs(list, "lastRun", "desc").map((j) => j.key)).toEqual([
      "old",
      "new",
      "none",
    ]);
  });

  it("puts failed jobs first for status", () => {
    const list = [
      job("ok", "Ok", { recentRuns: [run("2026-01-01T02:00:00Z")] }),
      job("never", "Never"),
      job("fail", "Fail", {
        recentRuns: [run("2026-01-01T02:00:00Z", "FAILURE")],
      }),
    ];
    expect(sortJobs(list, "status").map((j) => j.key)).toEqual([
      "fail",
      "never",
      "ok",
    ]);
  });

  it("orders next run soonest first with missing last", () => {
    const list = [
      job("none", "None"),
      job("late", "Late", { nextRunAt: "2026-05-02T00:00:00Z" }),
      job("soon", "Soon", { nextRunAt: "2026-05-01T00:00:00Z" }),
    ];
    expect(sortJobs(list, "nextRun").map((j) => j.key)).toEqual([
      "soon",
      "late",
      "none",
    ]);
  });
});
