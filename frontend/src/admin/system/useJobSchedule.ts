import { useState } from "react";
import api from "../../api/axiosConfig";
import { buildSchedulePayload } from "../schedulePayload";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError.ts";
import { scheduleSig } from "./jobSchedule";
import type { ScheduledJobDTO } from "./types";

/** Draft schedule for one job (reset on server change) + save / enable / run-now actions. */
export function useJobSchedule(job: ScheduledJobDTO, onReload: () => void) {
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

  return {
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
  };
}
