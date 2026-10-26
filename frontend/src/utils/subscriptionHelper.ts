import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  isSameDay,
  lastDayOfMonth,
  isWeekend,
  subDays,
  getDaysInMonth,
  setDate,
  parseISO,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import type { Subscription } from "../types/domain";

// Last business day of the month.
export const getLastWorkingDayOfMonth = (date: Date): Date => {
  let lastDay = lastDayOfMonth(date);
  while (isWeekend(lastDay)) {
    lastDay = subDays(lastDay, 1);
  }
  return lastDay;
};

// Apply the monthly rules (e.g. last business day, specific day).
export const applyMonthlyRules = (sub: Subscription, date: Date): Date => {
  if (sub.frequencyType !== "MONTHLY") return date;

  if (sub.lastWorkingDayOfMonth) {
    return getLastWorkingDayOfMonth(date);
  }

  if (sub.monthlySpecificDay) {
    const maxDays = getDaysInMonth(date);
    const targetDay = Math.min(sub.monthlySpecificDay, maxDays);
    return setDate(date, targetDay);
  }

  return date;
};

// Advance by one interval according to the frequency.
export const advanceByOneInterval = (
  sub: Subscription,
  currentDate: Date,
): Date => {
  const interval =
    sub.frequencyInterval && sub.frequencyInterval > 0
      ? sub.frequencyInterval
      : 1;
  let nextDate = currentDate;

  switch (sub.frequencyType) {
    case "DAILY":
      return addDays(nextDate, interval);
    case "WEEKLY":
      return addWeeks(nextDate, interval);
    case "MONTHLY":
      nextDate = addMonths(nextDate, interval);
      return applyMonthlyRules(sub, nextDate);
    case "YEARLY":
      return addYears(nextDate, interval);
    default:
      return nextDate;
  }
};

/**
 * Computes the dates on which a subscription occurs, limited to the
 * requested years [targetStartYear, targetEndYear].
 */
export const generateSubscriptionOccurrences = (
  sub: Subscription,
  targetStartYear: number,
  targetEndYear: number,
): Date[] => {
  const startStr = sub.startDate || sub.nextExecutionDate;
  if (!startStr) return [];

  let currentDate = parseISO(startStr);

  // Apply the monthly rules to the very first date too.
  if (sub.frequencyType === "MONTHLY") {
    currentDate = applyMonthlyRules(sub, currentDate);
  }

  const occurrences: Date[] = [];

  // Generation bounds
  const minDate = new Date(targetStartYear, 0, 1);
  const maxDate = new Date(targetEndYear, 11, 31, 23, 59, 59, 999);

  const untilDate =
    sub.duration === "UNTIL" && sub.durationUntil
      ? parseISO(sub.durationUntil)
      : null;

  const maxTimes =
    sub.duration === "TIMES" && sub.durationTimes
      ? sub.durationTimes
      : Infinity;

  let executedCount = 0;

  // Guard against infinite loops on bad configurations.
  let loopGuard = 0;
  const maxLoopsLeft = 50000;

  // Fast-forward over years of executions when far away and not bounded by TIMES.
  if (
    sub.frequencyType === "DAILY" &&
    maxTimes === Infinity &&
    differenceInDays(minDate, currentDate) > 100
  ) {
    const jumps = Math.floor(
      differenceInDays(minDate, currentDate) / (sub.frequencyInterval || 1),
    );
    if (jumps > 0) {
      currentDate = addDays(currentDate, jumps * (sub.frequencyInterval || 1));
      executedCount += jumps;
    }
  } else if (
    sub.frequencyType === "WEEKLY" &&
    maxTimes === Infinity &&
    differenceInDays(minDate, currentDate) > 70
  ) {
    const jumps = Math.floor(
      differenceInDays(minDate, currentDate) /
        (7 * (sub.frequencyInterval || 1)),
    );
    if (jumps > 0) {
      currentDate = addWeeks(currentDate, jumps * (sub.frequencyInterval || 1));
      executedCount += jumps;
    }
  } else if (
    sub.frequencyType === "MONTHLY" &&
    maxTimes === Infinity &&
    differenceInMonths(minDate, currentDate) > 12
  ) {
    const jumps = Math.floor(
      differenceInMonths(minDate, currentDate) / (sub.frequencyInterval || 1),
    );
    if (jumps > 0) {
      currentDate = addMonths(
        currentDate,
        jumps * (sub.frequencyInterval || 1),
      );
      currentDate = applyMonthlyRules(sub, currentDate);
      executedCount += jumps;
    }
  } else if (
    sub.frequencyType === "YEARLY" &&
    maxTimes === Infinity &&
    differenceInYears(minDate, currentDate) > 1
  ) {
    const jumps = Math.floor(
      differenceInYears(minDate, currentDate) / (sub.frequencyInterval || 1),
    );
    if (jumps > 0) {
      currentDate = addYears(currentDate, jumps * (sub.frequencyInterval || 1));
      executedCount += jumps;
    }
  }

  while (loopGuard++ < maxLoopsLeft) {
    if (isAfter(currentDate, maxDate)) {
      break;
    }

    if (untilDate && isAfter(currentDate, untilDate)) {
      break;
    }

    if (!isBefore(currentDate, minDate)) {
      occurrences.push(currentDate);
    }

    executedCount++;

    if (executedCount >= maxTimes) {
      break;
    }

    const nextDate = advanceByOneInterval(sub, currentDate);
    // Avoid hanging the browser if the date doesn't advance.
    if (isSameDay(currentDate, nextDate)) {
      break;
    }
    currentDate = nextDate;
  }

  return occurrences;
};

// Builds year → (day "yyyy-MM-dd" → subscriptions) for the requested years.
// Pure function (no React state/effects), so it's easy to test.
export const buildYearsMap = (
  subscriptions: Subscription[],
  years: number[],
): Record<number, Record<string, Subscription[]>> => {
  const map: Record<number, Record<string, Subscription[]>> = {};

  for (const y of years) {
    const yearOccurrences: Record<string, Subscription[]> = {};

    subscriptions.forEach((sub) => {
      // 1. Historical transactions
      if (sub.history) {
        sub.history.forEach((tx) => {
          const txDate = new Date(tx.transactionDate);
          if (txDate.getFullYear() === y) {
            const dateStr = format(txDate, "yyyy-MM-dd");
            if (!yearOccurrences[dateStr]) yearOccurrences[dateStr] = [];
            if (!yearOccurrences[dateStr].find((s) => s.id === sub.id)) {
              yearOccurrences[dateStr].push(sub);
            }
          }
        });
      }

      if (sub.status === "COMPLETED") return;

      // 2. Future occurrences (from nextExecutionDate on only)
      const dates = generateSubscriptionOccurrences(sub, y, y);
      dates.forEach((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const nextExecStr = sub.nextExecutionDate
          ? format(new Date(sub.nextExecutionDate), "yyyy-MM-dd")
          : null;

        if (nextExecStr && dateStr >= nextExecStr) {
          if (!yearOccurrences[dateStr]) yearOccurrences[dateStr] = [];
          if (!yearOccurrences[dateStr].find((s) => s.id === sub.id)) {
            yearOccurrences[dateStr].push(sub);
          }
        }
      });
    });

    map[y] = yearOccurrences;
  }

  return map;
};
