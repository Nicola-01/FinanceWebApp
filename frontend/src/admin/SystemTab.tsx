import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowsRotate,
  faBroom,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faDatabase,
  faEnvelope,
  faGear,
  faPlay,
  faSpinner,
  faStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { buildSchedulePayload } from "./schedulePayload";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Card } from "../components/ui/Card";
import { getApiErrorTitle } from "../utils/apiError.ts";
import { AdminPageHeader } from "./AdminPageHeader.tsx";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";
import { CustomSelect } from "../components/ui/CustomSelect.tsx";

// ─── Types (mirror the backend DTOs) ────────────────────────────────────────

interface JobRunDTO {
  startedAt: string;
  finishedAt: string | null;
  status: string; // SUCCESS | FAILURE
  message: string | null;
  durationMs: number;
  manual: boolean;
}

interface ScheduledJobDTO {
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

// ─── Constants / helpers ─────────────────────────────────────────────────────

const JOB_ICONS: Record<string, IconDefinition> = {
  backup: faDatabase,
  subscriptions: faArrowsRotate,
  "demo-cleanup": faBroom,
  "monthly-report": faEnvelope,
  "yearly-report": faStar,
};

const FREQ_OPTIONS = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

const DOM_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1), label }));

const DAYS = [
  { token: "MON", label: "M" },
  { token: "TUE", label: "T" },
  { token: "WED", label: "W" },
  { token: "THU", label: "T" },
  { token: "FRI", label: "F" },
  { token: "SAT", label: "S" },
  { token: "SUN", label: "S" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: pad2(h),
}));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5),
  label: pad2(i * 5),
}));

function scheduleSig(j: {
  frequency: string;
  hourOfDay: number;
  minuteOfHour: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
}): string {
  return `${j.frequency}|${j.hourOfDay}|${j.minuteOfHour}|${[...j.daysOfWeek]
    .sort()
    .join(",")}|${j.dayOfMonth ?? ""}|${j.monthOfYear ?? ""}`;
}

function formatCountdown(nextIso: string | null, now: number): string {
  if (!nextIso) return "—";
  const ms = new Date(nextIso).getTime() - now;
  if (ms <= 0) return "due now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function formatRunTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

// ─── Boxed CustomSelect wrapper ──────────────────────────────────────────────

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}> = ({ value, onChange, options, width = "w-20" }) => (
  <CustomSelect
    value={value}
    onChange={onChange}
    options={options}
    className={`${width} rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-2 text-sm text-app-text`}
  />
);

// ─── Job card ────────────────────────────────────────────────────────────────

const JobCard: React.FC<{
  job: ScheduledJobDTO;
  now: number;
  /** Descending across the list so an open dropdown paints over the card below. */
  zIndex: number;
  onReload: () => void;
}> = ({ job, now, zIndex, onReload }) => {
  const [frequency, setFrequency] = useState(job.frequency);
  const [hourOfDay, setHourOfDay] = useState(job.hourOfDay);
  const [minuteOfHour, setMinuteOfHour] = useState(job.minuteOfHour);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(job.daysOfWeek);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(job.dayOfMonth);
  const [monthOfYear, setMonthOfYear] = useState<number | null>(
    job.monthOfYear,
  );

  const [saving, setSaving] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [running, setRunning] = useState(false);

  // Reset the draft whenever the server state changes (after save / reload).
  const serverSig = scheduleSig(job);
  const [syncSig, setSyncSig] = useState(serverSig);
  if (syncSig !== serverSig) {
    setSyncSig(serverSig);
    setFrequency(job.frequency);
    setHourOfDay(job.hourOfDay);
    setMinuteOfHour(job.minuteOfHour);
    setDaysOfWeek(job.daysOfWeek);
    setDayOfMonth(job.dayOfMonth);
    setMonthOfYear(job.monthOfYear);
  }

  const draftSig = scheduleSig({
    frequency,
    hourOfDay,
    minuteOfHour,
    daysOfWeek,
    dayOfMonth,
    monthOfYear,
  });
  const dirty = draftSig !== serverSig;

  const toggleDay = (token: string) =>
    setDaysOfWeek((prev) =>
      prev.includes(token) ? prev.filter((d) => d !== token) : [...prev, token],
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(
        `/admin/jobs/${job.key}/schedule`,
        buildSchedulePayload({
          frequency,
          hourOfDay,
          minuteOfHour,
          daysOfWeek,
          dayOfMonth,
          monthOfYear,
        }),
      );
      triggerToast("Schedule updated", true);
      onReload();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not update schedule"), false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (next: boolean) => {
    setTogglingEnabled(true);
    try {
      await api.put(`/admin/jobs/${job.key}/enabled`, { enabled: next });
      onReload();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not update job"), false);
    } finally {
      setTogglingEnabled(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await api.post(`/admin/jobs/${job.key}/run`);
      triggerToast(`${job.displayName} ran`, true);
      onReload();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Run failed"), false);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setFrequency(job.frequency);
    setHourOfDay(job.hourOfDay);
    setMinuteOfHour(job.minuteOfHour);
    setDaysOfWeek(job.daysOfWeek);
    setDayOfMonth(job.dayOfMonth);
    setMonthOfYear(job.monthOfYear);
  };

  const icon = JOB_ICONS[job.key] ?? faGear;

  return (
    <div
      className="relative flex flex-col gap-4 rounded-[var(--r-card)] border border-app-border bg-app-card/50 p-5 backdrop-blur-sm"
      style={{ zIndex }}
    >
      {/* Header: icon + name + next run + enable toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-gradient-to-br from-[var(--brand-1)]/20 to-[var(--brand-2)]/20 text-[var(--brand-1)]">
            <FontAwesomeIcon icon={icon} />
          </span>
          <div>
            <h3 className="m-0 text-base font-bold text-app-text">
              {job.displayName}
            </h3>
            <p className="m-0 flex items-center gap-1.5 text-xs text-app-muted">
              <FontAwesomeIcon icon={faClock} className="opacity-60" />
              {job.enabled ? (
                <>
                  next run in{" "}
                  <span className="font-app-mono text-app-text">
                    {formatCountdown(job.nextRunAt, now)}
                  </span>
                </>
              ) : (
                "disabled"
              )}
            </p>
          </div>
        </div>
        <Toggle
          checked={job.enabled}
          onChange={handleToggleEnabled}
          disabled={togglingEnabled}
          aria-label={`Enable ${job.displayName}`}
        />
      </div>

      {/* Schedule editor */}
      <div className="flex flex-wrap items-center gap-2 border-t border-app-border pt-4 text-sm text-app-muted">
        <span>Runs</span>
        <Select
          value={frequency}
          onChange={setFrequency}
          options={FREQ_OPTIONS}
          width="w-28"
        />
        {frequency === "MONTHLY" && (
          <>
            <span>on day</span>
            <Select
              value={String(dayOfMonth ?? 1)}
              onChange={(v) => setDayOfMonth(Number(v))}
              options={DOM_OPTIONS}
            />
          </>
        )}
        {frequency === "YEARLY" && (
          <>
            <span>on</span>
            <Select
              value={String(dayOfMonth ?? 1)}
              onChange={(v) => setDayOfMonth(Number(v))}
              options={DOM_OPTIONS}
            />
            <Select
              value={String(monthOfYear ?? 1)}
              onChange={(v) => setMonthOfYear(Number(v))}
              options={MONTH_OPTIONS}
              width="w-32"
            />
          </>
        )}
        {frequency === "HOURLY" ? (
          <>
            <span>at minute</span>
            <Select
              value={String(minuteOfHour)}
              onChange={(v) => setMinuteOfHour(Number(v))}
              options={MINUTE_OPTIONS}
            />
          </>
        ) : (
          <>
            <span>at</span>
            <Select
              value={String(hourOfDay)}
              onChange={(v) => setHourOfDay(Number(v))}
              options={HOUR_OPTIONS}
            />
            <span>:</span>
            <Select
              value={String(minuteOfHour)}
              onChange={(v) => setMinuteOfHour(Number(v))}
              options={MINUTE_OPTIONS}
            />
          </>
        )}

        {frequency === "WEEKLY" && (
          <div className="flex items-center gap-1">
            {DAYS.map((d, i) => {
              const active = daysOfWeek.includes(d.token);
              return (
                <button
                  key={`${d.token}-${i}`}
                  type="button"
                  onClick={() => toggleDay(d.token)}
                  aria-label={d.token}
                  aria-pressed={active}
                  className={`flex h-8 w-8 items-center justify-center rounded-[var(--r-sm)] text-xs font-bold transition-colors ${
                    active
                      ? "bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white"
                      : "border border-app-border bg-app-input text-app-muted hover:text-app-text"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faXmark} />
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <FontAwesomeIcon
                  icon={saving ? faSpinner : faCircleCheck}
                  spin={saving}
                />
                Save
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunNow}
            disabled={running}
          >
            <FontAwesomeIcon
              icon={running ? faSpinner : faPlay}
              spin={running}
            />
            Run now
          </Button>
        </div>
      </div>

      {/* Recent runs */}
      {job.recentRuns.length > 0 && (
        <div className="border-t border-app-border pt-3">
          <p className="m-0 mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-app-muted">
            Recent runs
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {job.recentRuns.slice(0, 6).map((run, i) => {
              const ok = run.status === "SUCCESS";
              return (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-app-muted"
                >
                  <FontAwesomeIcon
                    icon={ok ? faCircleCheck : faCircleXmark}
                    className={ok ? "text-app-green" : "text-app-red"}
                  />
                  <span className="font-app-mono text-app-text">
                    {formatRunTime(run.startedAt)}
                  </span>
                  <span className="font-app-mono">
                    {formatDuration(run.durationMs)}
                  </span>
                  {run.manual && (
                    <span className="rounded bg-app-input px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
                      manual
                    </span>
                  )}
                  {run.message && (
                    <span className="truncate text-app-muted/80">
                      {run.message}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── System tab ──────────────────────────────────────────────────────────────

const SystemTab: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const loadJobs = useCallback(async () => {
    try {
      const resp = await api.get<ScheduledJobDTO[]>("/admin/jobs");
      setJobs(resp.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not load jobs"), false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // One shared ticker drives every card's countdown.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-app-muted">
          <FontAwesomeIcon icon={faSpinner} spin />
          Loading jobs…
        </div>
      );
    }
    if (jobs.length === 0) {
      return (
        <Card
          padding="none"
          className="px-4 py-6 text-center text-sm text-app-muted"
        >
          No scheduled jobs.
        </Card>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {jobs.map((job, i) => (
          <JobCard
            key={job.key}
            job={job}
            now={now}
            zIndex={jobs.length - i}
            onReload={loadJobs}
          />
        ))}
      </div>
    );
  }, [loading, jobs, now, loadJobs]);

  return (
    <div className="flex flex-col gap-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
      <AdminPageHeader
        title="System"
        description="Scheduled maintenance jobs — edit schedules, run on demand, review history."
      />
      {content}
    </div>
  );
};

export default SystemTab;
