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
import type { Subscription, Transaction } from "../types/domain";

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

// Ultra-compact frequency label (e.g. "mo", "yr", "2 wk").
export const formatCompactFrequency = (interval: number, type: string) => {
  const i = interval && interval > 1 ? `${interval} ` : "";
  switch (type.toUpperCase()) {
    case "MONTHLY":
      return `${i}mo`;
    case "YEARLY":
      return `${i}yr`;
    case "WEEKLY":
      return `${i}wk`;
    case "DAILY":
      return `${i}d`;
    default:
      return `${i}${type.toLowerCase().replace("ly", "")}`; // Fallback
  }
};

// Days left until the next payment.
export const getDaysLeft = (nextDateStr?: string | null) => {
  if (!nextDateStr) return null;
  const nextDate = new Date(nextDateStr);
  const today = new Date();

  // Zero the times so only whole days count.
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffTime = nextDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Colour by how close the date is.
export const getDaysLeftColor = (days: number, isIncome: boolean) => {
  if (days > 7) return "text-app-muted opacity-90";
  if (days < 0) return "text-app-muted opacity-60";

  if (!isIncome) {
    if (days >= 4) return "text-app-yellow";
    if (days >= 2) return "text-app-yellow";
    return "text-app-red";
  } else {
    if (days >= 4) return "text-app-green/40";
    if (days >= 2) return "text-app-green/70";
    return "text-app-green";
  }
};

export const getDaysLeftText = (days: number, dateStr?: string | null) => {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";

  if (!dateStr) {
    return days > 1 ? `${days} days left` : `${Math.abs(days)} days ago`;
  }

  const targetDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const isPast = days < 0;
  const laterDate = isPast ? today : targetDate;
  const earlierDate = isPast ? targetDate : today;

  const months = differenceInMonths(laterDate, earlierDate);
  const years = differenceInYears(laterDate, earlierDate);

  const suffix = isPast ? "ago" : "left";

  if (months < 1) {
    return `${Math.abs(days)} days ${suffix}`;
  }

  if (years < 1) {
    return months === 1 ? `1 month ${suffix}` : `${months} months ${suffix}`;
  }

  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return years === 1 ? `1 year ${suffix}` : `${years} years ${suffix}`;
  }

  const yearText = years === 1 ? "1 year" : `${years} years`;
  const monthText =
    remainingMonths === 1 ? "1 month" : `${remainingMonths} months`;
  return `${yearText} and ${monthText} ${suffix}`;
};

// A subscription as it looked for one of its past transactions (amount/currency of that run).
export const applyTransactionToSubscription = (
  sub: Subscription,
  tx: Transaction,
): Subscription => ({
  ...sub,
  amount: tx.amount,
  originalAmount: tx.originalAmount ?? sub.originalAmount,
  originalCurrency: tx.originalCurrency ?? sub.originalCurrency,
  exchangeValue: tx.exchangeValue ?? sub.exchangeValue,
});
