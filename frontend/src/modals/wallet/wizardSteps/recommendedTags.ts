import type { TagRequest } from "../../../dashboard/settings/csvImport";

/** A single curated tag (name + icon key + hex colour). */
export interface RecommendedTag {
  name: string;
  icon: string;
  colorHex: string;
}

/** A main category and its sub-categories, staged together as one unit. */
export interface RecommendedTagGroup {
  parent: RecommendedTag;
  children: RecommendedTag[];
}

/**
 * Curated starter categories offered in the wallet-creation wizard. Mirrors the
 * demo wallet seed (`backend .../service/DemoService.createDemoTags`) so the
 * recommended set matches what users already see in the demo. Selecting a group
 * stages the whole category (parent + all children) at once — never a lone tag.
 */
export const RECOMMENDED_TAG_GROUPS: RecommendedTagGroup[] = [
  {
    parent: { name: "Work", icon: "work", colorHex: "#4caf50" },
    children: [
      { name: "Salary", icon: "moneyBill", colorHex: "#4caf50" },
      { name: "Bonus", icon: "gift", colorHex: "#81c784" },
      { name: "Meal Vouchers", icon: "receipt", colorHex: "#a5d6a7" },
    ],
  },
  {
    parent: { name: "Home", icon: "house", colorHex: "#2196f3" },
    children: [
      { name: "Rent", icon: "bank", colorHex: "#64b5f6" },
      { name: "Gas", icon: "energy", colorHex: "#ffb74d" },
      { name: "Electricity", icon: "energy", colorHex: "#fff176" },
      { name: "Internet", icon: "internet", colorHex: "#4dd0e1" },
    ],
  },
  {
    parent: { name: "Car", icon: "car", colorHex: "#f44336" },
    children: [
      { name: "Car Tax", icon: "receipt", colorHex: "#e57373" },
      { name: "Insurance", icon: "receipt", colorHex: "#ef5350" },
      { name: "Gasoline", icon: "gas", colorHex: "#ff8a65" },
      { name: "Maintenance", icon: "repair", colorHex: "#90a4ae" },
    ],
  },
  {
    parent: { name: "Subscriptions", icon: "calendar", colorHex: "#9c27b0" },
    children: [
      { name: "Netflix", icon: "movies", colorHex: "#e50914" },
      { name: "Amazon Prime", icon: "cart", colorHex: "#00a8e1" },
      { name: "Spotify", icon: "music", colorHex: "#1db954" },
    ],
  },
  {
    parent: { name: "Groceries", icon: "basket", colorHex: "#ff9800" },
    children: [
      { name: "Food", icon: "groceries", colorHex: "#ffb74d" },
      { name: "Hygiene", icon: "health", colorHex: "#81d4fa" },
    ],
  },
  {
    parent: {
      name: "Food & Entertainment",
      icon: "dining",
      colorHex: "#e91e63",
    },
    children: [
      { name: "Pizza", icon: "pizza", colorHex: "#f06292" },
      { name: "Sushi", icon: "sushi", colorHex: "#ba68c8" },
      { name: "Ice Cream", icon: "dessert", colorHex: "#4fc3f7" },
    ],
  },
];

const keyOfName = (s: string) => s.trim().toLowerCase();

/**
 * Inverse of {@link groupToTagRequests}: group a flat tag list into categories
 * (parent + children), mirroring how the wallet tree nests. Top-level tags (no
 * `parentName`) become category parents; children attach by `parentName`; a
 * child whose parent isn't present falls back to its own top-level category.
 * Used to render imported / CSV tags as the same category cards as the presets.
 */
export const groupTagRequests = (tags: TagRequest[]): RecommendedTagGroup[] => {
  const toTag = (t: TagRequest): RecommendedTag => ({
    name: t.name,
    icon: t.icon,
    colorHex: t.colorHex,
  });
  const parents = tags.filter((t) => !t.parentName?.trim());
  const parentKeys = new Set(parents.map((p) => keyOfName(p.name)));
  const childrenByParent = new Map<string, TagRequest[]>();
  const orphans: TagRequest[] = [];
  tags.forEach((t) => {
    const pn = t.parentName?.trim();
    if (!pn) return;
    if (parentKeys.has(keyOfName(pn))) {
      const k = keyOfName(pn);
      childrenByParent.set(k, [...(childrenByParent.get(k) ?? []), t]);
    } else {
      orphans.push(t);
    }
  });
  return [
    ...parents.map((p) => ({
      parent: toTag(p),
      children: (childrenByParent.get(keyOfName(p.name)) ?? []).map(toTag),
    })),
    ...orphans.map((o) => ({
      parent: toTag(o),
      children: [] as RecommendedTag[],
    })),
  ];
};

/**
 * Flatten a group into bulk-import DTOs: the parent first (no `parentName`),
 * then each child carrying `parentName` so the backend nests it correctly.
 */
export const groupToTagRequests = (
  group: RecommendedTagGroup,
): TagRequest[] => [
  {
    name: group.parent.name,
    icon: group.parent.icon,
    colorHex: group.parent.colorHex,
  },
  ...group.children.map((c) => ({
    name: c.name,
    icon: c.icon,
    colorHex: c.colorHex,
    parentName: group.parent.name,
  })),
];
