export const VALID_TABS = [
  "transactions",
  "subscription",
  "category",
  "statistics",
  "budget",
  "settings",
  "data",
] as const;

export type TabType = (typeof VALID_TABS)[number];
