import type { Subscription, Transaction } from "../../types/domain";
import { getDaysLeft } from "../../utils/subscriptionHelper";

export type PastPayment = { sub: Subscription; tx: Transaction };

/** `YYYY-MM` month key of a date (local time). */
export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** "March 2026" for a `YYYY-MM` key. */
export const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const byNextExecution = (a: Subscription, b: Subscription) =>
  new Date(a.nextExecutionDate).getTime() -
  new Date(b.nextExecutionDate).getTime();

/**
 * Splits subscriptions into the list's sections: upcoming (≤7 / >7 days,
 * soonest first), completed, and past payments (history) bucketed by month,
 * months newest first.
 */
export function groupSubscriptions(subscriptions: Subscription[]) {
  // NaN keeps a missing date out of both groups (as before the helper was shared).
  const daysLeft = (s: Subscription) => getDaysLeft(s.nextExecutionDate) ?? NaN;

  const activeSubs = subscriptions.filter((s) => s.status !== "COMPLETED");
  const within7Days = activeSubs.filter((s) => daysLeft(s) <= 7);
  const within31Days = activeSubs.filter((s) => daysLeft(s) > 7);
  const completedSubs = subscriptions.filter((s) => s.status === "COMPLETED");

  within7Days.sort(byNextExecution);
  within31Days.sort(byNextExecution);

  const pastTransactions: PastPayment[] = [];
  subscriptions.forEach((sub) => {
    if (sub.history) {
      sub.history.forEach((tx) => {
        pastTransactions.push({ sub, tx });
      });
    }
  });

  const groupedPastSubs: Record<string, PastPayment[]> = {};
  pastTransactions.forEach(({ sub, tx }) => {
    const monthKey = monthKeyOf(new Date(tx.transactionDate));
    if (!groupedPastSubs[monthKey]) groupedPastSubs[monthKey] = [];
    groupedPastSubs[monthKey].push({ sub, tx });
  });

  const sortedMonthKeys = Object.keys(groupedPastSubs).sort((a, b) =>
    b.localeCompare(a),
  );

  return {
    within7Days,
    within31Days,
    completedSubs,
    groupedPastSubs,
    sortedMonthKeys,
    hasPast: pastTransactions.length > 0,
  };
}
