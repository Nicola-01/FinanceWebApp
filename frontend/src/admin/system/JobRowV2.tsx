import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCalendarDay,
  faCalendarWeek,
  faChevronDown,
  faCircleCheck,
  faClock,
  faEnvelope,
  faGear,
  faPlay,
  faRepeat,
  faSpinner,
  faToggleOn,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { BoxedSelect as Select } from "../../components/ui/BoxedSelect.tsx";
import { FormRow } from "../../components/ui/FormRow";
import { StatusPill, type Status } from "../../components/ui/StatusPill";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import {
  DOM_OPTIONS,
  FREQ_OPTIONS,
  HOUR_OPTIONS,
  JOB_ICONS,
  MINUTE_OPTIONS,
  MONTH_OPTIONS,
  describeSchedule,
  formatCountdown,
  formatRunTime,
} from "./jobSchedule";
import { lastRunOf, runStatus, type RunStatus } from "./jobSort";
import { useJobSchedule } from "./useJobSchedule";
import { WeekdayPicker } from "./WeekdayPicker";
import { JobRunHistory } from "./JobRunHistory";
import type { ScheduledJobDTO } from "./types";

/** Shared column template: the desktop header row and each job row use it. */
export const JOB_GRID =
  "grid grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)_minmax(0,2fr)_auto] items-center gap-4";

const PILL: Record<RunStatus, { status: Status; label: string }> = {
  failed: { status: "danger", label: "Failed" },
  ok: { status: "ok", label: "Succeeded" },
  never: { status: "warn", label: "Never run" },
};

/**
 * v2 job entry: a row (table row on desktop, list row on phone) that expands
 * into the run-now action, the schedule editor and the run history.
 */
export const JobRowV2: React.FC<{
  job: ScheduledJobDTO;
  now: number;
  onReload: () => void;
}> = ({ job, now, onReload }) => {
  const s = useJobSchedule(job, onReload);
  const [open, setOpen] = useState(false);
  const wide = useMediaQuery("(min-width: 768px)");
  const icon = JOB_ICONS[job.key] ?? faGear;
  const isReport = job.key === "monthly-report" || job.key === "yearly-report";
  const run = lastRunOf(job);
  const pill = PILL[runStatus(job)];
  const nextLabel = job.enabled
    ? `Next run in ${formatCountdown(job.nextRunAt, now)}`
    : "Disabled";
  const panelId = `job-panel-${job.key}`;

  const runNow = (
    <Button
      variant="secondary"
      size="sm"
      onClick={s.handleRunNow}
      disabled={s.running}
    >
      <FontAwesomeIcon icon={s.running ? faSpinner : faPlay} spin={s.running} />
      Run now
    </Button>
  );

  const toggle = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={`${open ? "Hide" : "Show"} details for ${job.displayName}`}
    >
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`transition-transform ${open ? "rotate-180" : ""}`}
      />
    </Button>
  );

  const name = (sub: string) => (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-sm)] bg-app-raised text-app-muted">
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold text-app-text">
          {job.displayName}
        </div>
        <div className="truncate text-[13px] text-app-muted">{sub}</div>
      </div>
    </div>
  );

  const lastRun = (
    <div className="flex min-w-0 items-center gap-2.5">
      {run && (
        <span className="text-[13px] tabular-nums text-app-muted">
          {formatRunTime(run.startedAt)}
        </span>
      )}
      <StatusPill status={pill.status}>{pill.label}</StatusPill>
    </div>
  );

  return (
    <div>
      {wide ? (
        <div className={`${JOB_GRID} min-h-14 px-4 py-2`}>
          {name(nextLabel)}
          <span className="truncate text-[15px] text-app-muted">
            {describeSchedule(job)}
          </span>
          {lastRun}
          <div className="flex items-center justify-end gap-2">
            {runNow}
            {toggle}
          </div>
        </div>
      ) : (
        <div className="flex min-h-16 items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">{name(describeSchedule(job))}</div>
          {toggle}
        </div>
      )}

      {open && (
        <div id={panelId} className="border-t border-app-border">
          {!wide && (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <span className="text-[13px] text-app-muted">{nextLabel}</span>
                {lastRun}
              </div>
              {runNow}
            </div>
          )}

          <div className="divide-y divide-app-border">
            <FormRow icon={faToggleOn} label="Enabled">
              <Toggle
                checked={job.enabled}
                onChange={s.handleToggleEnabled}
                disabled={s.togglingEnabled}
                aria-label={`Enable ${job.displayName}`}
              />
            </FormRow>
            <FormRow icon={faRepeat} label="Frequency">
              <Select
                value={s.frequency}
                onChange={s.setFrequency}
                options={FREQ_OPTIONS}
                width="w-36"
              />
            </FormRow>
            {s.frequency === "MONTHLY" && (
              <FormRow icon={faCalendarDay} label="Day of month">
                <Select
                  value={String(s.dayOfMonth ?? 1)}
                  onChange={(v) => s.setDayOfMonth(Number(v))}
                  options={DOM_OPTIONS}
                />
              </FormRow>
            )}
            {s.frequency === "YEARLY" && (
              <>
                <FormRow icon={faCalendarDay} label="Day of month">
                  <Select
                    value={String(s.dayOfMonth ?? 1)}
                    onChange={(v) => s.setDayOfMonth(Number(v))}
                    options={DOM_OPTIONS}
                  />
                </FormRow>
                <FormRow icon={faCalendar} label="Month">
                  <Select
                    value={String(s.monthOfYear ?? 1)}
                    onChange={(v) => s.setMonthOfYear(Number(v))}
                    options={MONTH_OPTIONS}
                    width="w-36"
                  />
                </FormRow>
              </>
            )}
            {s.frequency === "HOURLY" && (
              <FormRow icon={faClock} label="Minute">
                <Select
                  value={String(s.minuteOfHour)}
                  onChange={(v) => s.setMinuteOfHour(Number(v))}
                  options={MINUTE_OPTIONS}
                />
              </FormRow>
            )}
            {s.frequency !== "HOURLY" && (
              <FormRow icon={faClock} label="Time">
                <div className="flex items-center gap-2">
                  <Select
                    value={String(s.hourOfDay)}
                    onChange={(v) => s.setHourOfDay(Number(v))}
                    options={HOUR_OPTIONS}
                  />
                  <span className="text-app-muted">:</span>
                  <Select
                    value={String(s.minuteOfHour)}
                    onChange={(v) => s.setMinuteOfHour(Number(v))}
                    options={MINUTE_OPTIONS}
                  />
                </div>
              </FormRow>
            )}
            {s.frequency === "WEEKLY" && (
              <FormRow icon={faCalendarWeek} label="Days">
                <WeekdayPicker
                  daysOfWeek={s.daysOfWeek}
                  onToggle={s.toggleDay}
                />
              </FormRow>
            )}
          </div>

          {(s.dirty || isReport) && (
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
              {isReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={s.handleSendTest}
                  disabled={s.sendingTest}
                  title="Email the last closed period's report to you only"
                >
                  <FontAwesomeIcon
                    icon={s.sendingTest ? faSpinner : faEnvelope}
                    spin={s.sendingTest}
                  />
                  Send test to me
                </Button>
              )}
              {s.dirty && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={s.handleReset}
                    disabled={s.saving}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={s.handleSave}
                    disabled={s.saving}
                  >
                    <FontAwesomeIcon
                      icon={s.saving ? faSpinner : faCircleCheck}
                      spin={s.saving}
                    />
                    Save
                  </Button>
                </>
              )}
            </div>
          )}

          {job.recentRuns.length > 0 && (
            <div className="px-4 pb-4 pt-1">
              <JobRunHistory runs={job.recentRuns} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
