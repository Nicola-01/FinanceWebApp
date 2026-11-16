import type { Budget, Subscription, Tag } from "../../types/domain";
import { generateSubscriptionOccurrences } from "../../utils/subscriptionHelper";

/** Local midnight of a `YYYY-MM-DD` string (the shape the budget dates use). */
const parseLocalDay = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Whether a subscription's tag falls in the budget's scope. Mirrors
 * BudgetService.sumExpenses, which sums the budget tag's whole subtree: the
 * subscription's tag must be the budget tag or one of its descendants.
 */
const inScope = (budget: Budget, sub: Subscription, tags: Tag[]): boolean => {
  if (budget.tagName == null) return true;
  const target = budget.tagName.toLowerCase();
  const parentOf = new Map(
    tags.map((t) => [t.name.toLowerCase(), t.parentName?.toLowerCase()]),
  );
  const seen = new Set<string>();
  let current: string | undefined = sub.tag.name.toLowerCase();
  while (current !== undefined && !seen.has(current)) {
    if (current === target) return true;
    seen.add(current);
    current = parentOf.get(current);
  }
  return false;
};

/**
 * Money still due from active expense subscriptions between today (exclusive)
 * and the budget's period end (inclusive), in the wallet currency. Uses the
 * same occurrence expansion as the Transactions "Coming up" column; bank-driven
 * subscriptions and reminders without an amount are skipped, as there.
 */
export function upcomingSubscriptionSpend(
  budget: Budget,
  subscriptions: Subscription[],
  tags: Tag[],
  today: Date = new Date(),
): number {
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const periodEnd = parseLocalDay(budget.periodEnd);

  let total = 0;
  for (const sub of subscriptions) {
    if (
      sub.type !== "EXPENSE" ||
      sub.status !== "ACTIVE" ||
      sub.bankDriven ||
      sub.amountPending ||
      !sub.amount ||
      !inScope(budget, sub, tags)
    )
      continue;

    const occurrences = generateSubscriptionOccurrences(
      sub,
      todayStart.getFullYear(),
      periodEnd.getFullYear(),
    );
    for (const due of occurrences) {
      if (due > todayStart && due <= periodEnd) total += sub.amount;
    }
  }
  return total;
}
