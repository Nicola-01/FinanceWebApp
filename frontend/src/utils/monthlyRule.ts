import type { Subscription, Weekday } from "../types/domain";
import { WEEKDAYS } from "./subscriptionHelper";

/**
 * Which day of the month a MONTHLY subscription runs on — the rule fields of a
 * `SubscriptionRequest`. At most one rule is set; `monthlySpecificDay: null`
 * with no other rule means "same day as the start date".
 */
export interface MonthlyRule {
  monthlySpecificDay: number | null;
  monthlyWorkingDay: number | null;
  monthlyWeekday: Weekday | null;
  monthlyWeekdayOrdinal: number | null;
}

export type MonthlyRuleMode = "DAY" | "WEEKDAY" | "WORKING_DAY";

export const EMPTY_MONTHLY_RULE: MonthlyRule = {
  monthlySpecificDay: null,
  monthlyWorkingDay: null,
  monthlyWeekday: null,
  monthlyWeekdayOrdinal: null,
};

export const monthlyRuleMode = (rule: MonthlyRule): MonthlyRuleMode =>
  rule.monthlyWorkingDay != null
    ? "WORKING_DAY"
    : rule.monthlyWeekday != null
      ? "WEEKDAY"
      : "DAY";

/** Default rule when switching mode, derived from the start date. */
export const defaultRuleForMode = (
  mode: MonthlyRuleMode,
  startDate: Date,
): MonthlyRule => {
  if (mode === "WORKING_DAY")
    return { ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: -1 };
  if (mode === "WEEKDAY")
    return {
      ...EMPTY_MONTHLY_RULE,
      monthlyWeekday: WEEKDAYS[startDate.getDay()],
      monthlyWeekdayOrdinal: Math.min(Math.ceil(startDate.getDate() / 7), 4),
    };
  return EMPTY_MONTHLY_RULE;
};

/** Form state from a saved subscription (legacy last-working-day flag → -1). */
export const monthlyRuleFromSub = (
  sub: Subscription,
  startDate: Date,
): MonthlyRule => {
  if (sub.lastWorkingDayOfMonth)
    return { ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: -1 };
  return {
    // The start day is the implicit default — keep it following the start date.
    monthlySpecificDay:
      sub.monthlySpecificDay === startDate.getDate()
        ? null
        : (sub.monthlySpecificDay ?? null),
    monthlyWorkingDay: sub.monthlyWorkingDay ?? null,
    monthlyWeekday: sub.monthlyWeekday ?? null,
    monthlyWeekdayOrdinal: sub.monthlyWeekdayOrdinal ?? null,
  };
};

/**
 * Request fields for the rule. A plain "day of month" rule is pinned to the
 * start day so months after a short one (Jan 31 → Feb 29 → Mar 31) don't drift.
 */
export const monthlyRulePayload = (
  rule: MonthlyRule,
  frequencyType: Subscription["frequencyType"],
  startDate: Date,
) => {
  if (frequencyType !== "MONTHLY")
    return { ...EMPTY_MONTHLY_RULE, lastWorkingDayOfMonth: false };
  const mode = monthlyRuleMode(rule);
  return {
    ...rule,
    monthlySpecificDay:
      mode === "DAY" ? (rule.monthlySpecificDay ?? startDate.getDate()) : null,
    lastWorkingDayOfMonth: false,
  };
};

/** "1st", "2nd", "last", "2nd to last" … */
export const ordinalLabel = (n: number): string => {
  if (n === -1) return "last";
  if (n < 0) return `${ordinalLabel(-n)} to last`;
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ||
        "th";
  return `${n}${suffix}`;
};

export const weekdayLabel = (w: Weekday): string =>
  w.charAt(0) + w.slice(1).toLowerCase();

/** Human summary, e.g. "on the last working day", or null when implicit. */
export const describeMonthlyRule = (sub: Subscription): string | null => {
  if (sub.frequencyType !== "MONTHLY") return null;
  const workingDay = sub.lastWorkingDayOfMonth ? -1 : sub.monthlyWorkingDay;
  if (workingDay) return `on the ${ordinalLabel(workingDay)} working day`;
  if (sub.monthlyWeekday && sub.monthlyWeekdayOrdinal)
    return `on the ${ordinalLabel(sub.monthlyWeekdayOrdinal)} ${weekdayLabel(sub.monthlyWeekday)}`;
  const day = sub.monthlySpecificDay;
  if (!day) return null;
  return day > 0
    ? `on the ${ordinalLabel(day)}`
    : `on the ${ordinalLabel(day)} day`;
};
