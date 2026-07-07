import {
  RECOMMENDED_TAG_GROUPS,
  type RecommendedTag,
} from "../recommendedTags";
import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

/** A Recommended tag together with the parent category it belongs to. */
export type RecommendedSubscriptionTag = RecommendedTag & {
  parentName?: string;
};

/**
 * A curated subscription offered as a one-tap starting point. Its `tag` is a
 * real tag taken from the Recommended tag set ({@link RECOMMENDED_TAG_GROUPS}),
 * so staging it lines up with the categories a user picks in the Tags step — no
 * phantom tag to reconcile later.
 */
export interface RecommendedSubscription {
  name: string;
  tag: RecommendedSubscriptionTag;
  amount: number;
  type: "EXPENSE" | "INCOME";
}

/**
 * Resolve a leaf tag from the Recommended tag groups by parent + child name, so
 * recommended subscriptions reuse the exact same tag (icon/colour) as the Tags
 * step. A typo throws at module load, catching drift in development.
 */
const leaf = (
  parentName: string,
  childName: string,
): RecommendedSubscriptionTag => {
  const group = RECOMMENDED_TAG_GROUPS.find(
    (g) => g.parent.name === parentName,
  );
  const child = group?.children.find((c) => c.name === childName);
  if (!child)
    throw new Error(
      `recommendedSubscriptions: no tag "${childName}" under "${parentName}"`,
    );
  return { ...child, parentName };
};

/**
 * Curated starter subscriptions offered in the wallet-creation wizard. Every
 * `tag` is a real Recommended tag, so the proposed subscriptions and the
 * proposed tags are one and the same set.
 */
export const RECOMMENDED_SUBSCRIPTIONS: RecommendedSubscription[] = [
  {
    name: "Netflix",
    tag: leaf("Subscriptions", "Netflix"),
    amount: 12.99,
    type: "EXPENSE",
  },
  {
    name: "Amazon Prime",
    tag: leaf("Subscriptions", "Amazon Prime"),
    amount: 4.99,
    type: "EXPENSE",
  },
  {
    name: "Spotify",
    tag: leaf("Subscriptions", "Spotify"),
    amount: 9.99,
    type: "EXPENSE",
  },
  { name: "Rent", tag: leaf("Home", "Rent"), amount: 800, type: "EXPENSE" },
  {
    name: "Internet",
    tag: leaf("Home", "Internet"),
    amount: 30,
    type: "EXPENSE",
  },
  { name: "Gas", tag: leaf("Home", "Gas"), amount: 40, type: "EXPENSE" },
  {
    name: "Electricity",
    tag: leaf("Home", "Electricity"),
    amount: 50,
    type: "EXPENSE",
  },
  {
    name: "Insurance",
    tag: leaf("Car", "Insurance"),
    amount: 40,
    type: "EXPENSE",
  },
];

/**
 * Expands a recommended suggestion (with its possibly-edited amount) into a
 * complete `SubscriptionRequest`: a monthly, active, never-ending payment
 * starting today with no multi-currency conversion. The `tag` is stored as the
 * tag's name (the shape the bulk-import endpoint expects).
 */
export const toSubscriptionRequest = (
  suggestion: RecommendedSubscription,
  amount: number,
): SubscriptionRequest => ({
  name: suggestion.name,
  tag: suggestion.tag.name,
  amount,
  type: suggestion.type,
  status: "ACTIVE",
  startDate: new Date().toISOString().slice(0, 10),
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
});
