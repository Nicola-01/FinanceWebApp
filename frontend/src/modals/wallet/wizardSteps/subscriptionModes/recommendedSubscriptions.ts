import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

/** A curated subscription offered as a one-tap starting point. */
export interface RecommendedSubscription {
  name: string;
  tag: string;
  amount: number;
}

/**
 * Curated starter subscriptions offered in the wallet-creation wizard. Their
 * `tag` is a plain name — it may or may not match a tag the user staged in the
 * previous step, which is exactly what the Subscriptions step flags and lets the
 * user resolve (reassign to an existing tag or create it).
 */
export const RECOMMENDED_SUBSCRIPTIONS: RecommendedSubscription[] = [
  { name: "Netflix", tag: "Entertainment", amount: 12.99 },
  { name: "Spotify", tag: "Music", amount: 9.99 },
  { name: "Gym", tag: "Fitness", amount: 30 },
  { name: "Rent", tag: "Housing", amount: 800 },
  { name: "Mobile plan", tag: "Phone", amount: 15 },
  { name: "Internet", tag: "Internet", amount: 30 },
  { name: "Insurance", tag: "Insurance", amount: 40 },
  { name: "Cloud storage", tag: "Software", amount: 2.99 },
];

/**
 * Expands a recommended suggestion (with its possibly-edited amount) into a
 * complete `SubscriptionRequest`: a monthly, active, never-ending expense
 * starting today with no multi-currency conversion.
 */
export const toSubscriptionRequest = (
  suggestion: RecommendedSubscription,
  amount: number,
): SubscriptionRequest => ({
  name: suggestion.name,
  tag: suggestion.tag,
  amount,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: new Date().toISOString().slice(0, 10),
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
});
