import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faGear,
  faPlay,
  faSpinner,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { BoxedSelect as Select } from "../../components/ui/BoxedSelect.tsx";
import {
  DOM_OPTIONS,
  FREQ_OPTIONS,
  HOUR_OPTIONS,
  JOB_ICONS,
  MINUTE_OPTIONS,
  MONTH_OPTIONS,
  formatCountdown,
} from "./jobSchedule";
import { useJobSchedule } from "./useJobSchedule";
import { WeekdayPicker } from "./WeekdayPicker";
import { JobRunHistory } from "./JobRunHistory";
import type { ScheduledJobDTO } from "./types";

export const JobCard: React.FC<{
  job: ScheduledJobDTO;
  now: number;
  /** Descending across the list so an open dropdown paints over the card below. */
  zIndex: number;
  onReload: () => void;
}> = ({ job, now, zIndex, onReload }) => {
  const {
    frequency,
    setFrequency,
    hourOfDay,
    setHourOfDay,
    minuteOfHour,
    setMinuteOfHour,
    daysOfWeek,
    dayOfMonth,
    setDayOfMonth,
    monthOfYear,
    setMonthOfYear,
    dirty,
    saving,
    togglingEnabled,
    running,
    toggleDay,
    handleSave,
    handleToggleEnabled,
    handleRunNow,
    handleReset,
  } = useJobSchedule(job, onReload);

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
          <WeekdayPicker daysOfWeek={daysOfWeek} onToggle={toggleDay} />
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
      {job.recentRuns.length > 0 && <JobRunHistory runs={job.recentRuns} />}
    </div>
  );
};
