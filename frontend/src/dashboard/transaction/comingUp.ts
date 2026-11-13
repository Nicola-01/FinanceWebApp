import type { Subscription } from "../../types/domain";
import { getDaysLeft } from "../../utils/subscriptionHelper";

export const COMING_UP_DAYS = 31;

export type ComingUpItem = {
  sub: Subscription;
  days: number;
  label: string;
  soon: boolean;
};

/** Relative due label; from four weeks out it reads in months, as in the mock. */
export const comingUpLabel = (days: number): string => {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days >= 28) return "in 1 month";
  return `in ${days} days`;
};

/**
 * Active subscriptions due within the next 31 days, soonest first. Bank-driven
 * subscriptions are skipped: their stored date is not a schedule.
 */
export function getComingUp(subscriptions: Subscription[]): ComingUpItem[] {
  return subscriptions
    .filter((s) => s.status === "ACTIVE" && !s.bankDriven)
    .map((sub) => ({ sub, days: getDaysLeft(sub.nextExecutionDate) ?? NaN }))
    .filter(({ days }) => days >= 0 && days <= COMING_UP_DAYS)
    .sort((a, b) => a.days - b.days)
    .map(({ sub, days }) => ({
      sub,
      days,
      label: comingUpLabel(days),
      soon: days <= 3,
    }));
}
