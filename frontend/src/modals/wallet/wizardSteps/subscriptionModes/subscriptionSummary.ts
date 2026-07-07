import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

const UNIT: Record<SubscriptionRequest["frequencyType"], string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  YEARLY: "year",
};

/**
 * Human recurrence label shown on the recommended cards and staged rows, e.g.
 * `Repeat every 1 month` / `Repeat every 2 weeks`.
 */
export const formatFrequency = (
  interval: number,
  type: SubscriptionRequest["frequencyType"],
): string => {
  const n = Math.max(1, interval);
  return `Repeat every ${n} ${UNIT[type]}${n > 1 ? "s" : ""}`;
};
