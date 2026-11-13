import type { Subscription } from "../../types/domain";
import type { SplitSegment } from "../../utils/splitParts";

// Average month lengths, so a weekly or daily plan spreads evenly over a year.
const DAYS_PER_MONTH = 365 / 12;
const WEEKS_PER_MONTH = 52 / 12;
const TOP_SEGMENTS = 5;

const intervalOf = (sub: Subscription) =>
  sub.frequencyInterval > 0 ? sub.frequencyInterval : 1;

/** How many times a subscription fires in an average month. */
export const occurrencesPerMonth = (sub: Subscription): number => {
  const n = intervalOf(sub);
  switch (sub.frequencyType) {
    case "DAILY":
      return DAYS_PER_MONTH / n;
    case "WEEKLY":
      return WEEKS_PER_MONTH / n;
    case "MONTHLY":
      return 1 / n;
    case "YEARLY":
      return 1 / (12 * n);
  }
};

/** Monthly-equivalent amount. Bank-driven and reminder rows have no reliable amount/schedule, so they count as 0. */
export const monthlyEquivalent = (sub: Subscription): number => {
  if (sub.status !== "ACTIVE" || sub.bankDriven || sub.amountPending) return 0;
  return sub.amount * occurrencesPerMonth(sub);
};

/** "every month", "every 2 weeks", "every year"... */
export const formatEvery = (sub: Subscription): string => {
  const n = intervalOf(sub);
  const unit = {
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year",
  }[sub.frequencyType];
  return n === 1 ? `every ${unit}` : `every ${n} ${unit}s`;
};

/**
 * Relative due copy: "Today", "in 3 days", "in 5 months", "2 days overdue".
 * Days are whole days from today (negative = overdue).
 */
export const formatDueRelative = (days: number): string => {
  if (days === 0) return "Today";
  if (days < 0) {
    const late = -days;
    return `${late} ${late === 1 ? "day" : "days"} overdue`;
  }
  if (days < 30) return `in ${days} ${days === 1 ? "day" : "days"}`;
  const months = Math.round(days / 30);
  return `in ${months} ${months === 1 ? "month" : "months"}`;
};

/** Text tone for a due label: overdue = danger, due within 3 days = warn, else muted. */
export const dueToneClass = (days: number): string => {
  if (days < 0) return "text-app-danger";
  if (days <= 3) return "text-app-warn";
  return "text-app-muted";
};

export interface SubscriptionSummary {
  monthlyCost: number;
  yearlyCost: number;
  monthlyIncome: number;
  /** Cost share per subscription, top N by value, the rest folded into "Other". */
  costSegments: SplitSegment[];
}

export const summarizeSubscriptions = (
  subscriptions: Subscription[],
  top = TOP_SEGMENTS,
): SubscriptionSummary => {
  const expenses = subscriptions.filter((s) => s.type !== "INCOME");
  const incomes = subscriptions.filter((s) => s.type === "INCOME");

  const costs = expenses
    .map((s) => ({ sub: s, value: monthlyEquivalent(s) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const monthlyCost = costs.reduce((sum, c) => sum + c.value, 0);
  const monthlyIncome = incomes.reduce(
    (sum, s) => sum + monthlyEquivalent(s),
    0,
  );

  const costSegments: SplitSegment[] = costs
    .slice(0, top)
    .map(({ sub, value }) => ({
      id: sub.id,
      label: sub.name,
      value,
      color: sub.tag?.colorHex || "rgb(var(--text-faint))",
    }));
  const rest = costs.slice(top).reduce((sum, c) => sum + c.value, 0);
  if (rest > 0) {
    costSegments.push({
      id: "other",
      label: "Other",
      value: rest,
      color: "rgb(var(--text-faint))",
    });
  }

  return {
    monthlyCost,
    yearlyCost: monthlyCost * 12,
    monthlyIncome,
    costSegments,
  };
};
