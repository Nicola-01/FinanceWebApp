import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowsRotate,
  faBroom,
  faDatabase,
  faEnvelope,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import type { ScheduleDraft } from "../schedulePayload";

export const JOB_ICONS: Record<string, IconDefinition> = {
  backup: faDatabase,
  subscriptions: faArrowsRotate,
  "demo-cleanup": faBroom,
  "monthly-report": faEnvelope,
  "yearly-report": faStar,
};

export const FREQ_OPTIONS = [
  { value: "HOURLY", label: "Hourly" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export const DOM_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));
export const MONTH_OPTIONS = [
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

export const DAYS = [
  { token: "MON", label: "M" },
  { token: "TUE", label: "T" },
  { token: "WED", label: "W" },
  { token: "THU", label: "T" },
  { token: "FRI", label: "F" },
  { token: "SAT", label: "S" },
  { token: "SUN", label: "S" },
];

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: pad2(h),
}));
export const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i * 5),
  label: pad2(i * 5),
}));

/** Order-insensitive signature of a schedule, used for dirty-checking the draft. */
export function scheduleSig(j: ScheduleDraft): string {
  return `${j.frequency}|${j.hourOfDay}|${j.minuteOfHour}|${[...j.daysOfWeek]
    .sort()
    .join(",")}|${j.dayOfMonth ?? ""}|${j.monthOfYear ?? ""}`;
}

export function formatCountdown(nextIso: string | null, now: number): string {
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

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

export function formatRunTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
