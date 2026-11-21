import type { Subscription, Tag, Transaction } from "../../../types/domain";

// Static example data for the landing "What changes when you use it" proofs.
// Figures are examples, not real data.

const tag = (name: string, icon: string, colorHex: string): Tag => ({
  name,
  icon,
  colorHex,
});

export const TAG_GROCERIES = tag("Groceries", "groceries", "#34d399");
export const TAG_ENTERTAINMENT = tag("Entertainment", "music", "#60a5fa");
export const TAG_HEALTH = tag("Health", "health", "#fb923c");
export const TAG_INVEST = tag("Investments", "invest", "#a78bfa");

/** Local calendar date `days` from today, as YYYY-MM-DD (what the subscription rows parse). */
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const BASE_SUBSCRIPTION = {
  autoExchangeRate: false,
  exchangeValue: 1,
  originalCurrency: "EUR",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 0,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
} as const;

export const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    ...BASE_SUBSCRIPTION,
    id: "demo-sub-spotify",
    name: "Spotify",
    tag: TAG_ENTERTAINMENT,
    amount: 30,
    originalAmount: 30,
    nextExecutionDate: isoDaysFromToday(10),
  },
  {
    ...BASE_SUBSCRIPTION,
    id: "demo-sub-gym",
    name: "Gym",
    tag: TAG_HEALTH,
    amount: 40,
    originalAmount: 40,
    lastWorkingDayOfMonth: true,
    nextExecutionDate: isoDaysFromToday(3),
  },
];

/** The Spotify charge the bank import was matched to (shown in the bank proof). */
export const DEMO_MATCHED_TRANSACTION: Transaction = {
  id: "demo-tx-spotify",
  subscriptionId: "demo-sub-spotify",
  name: "Spotify",
  tag: TAG_ENTERTAINMENT,
  amount: 30,
  type: "EXPENSE",
  transactionDate: isoDaysFromToday(0),
};

/** March spending split for the categories proof (amounts in EUR, shares of the total). */
export const DEMO_SPEND_SPLIT = [
  { label: "Housing", amount: "€770", share: 59, color: "#f87171" },
  { label: "Food and dining", amount: "€415", share: 32, color: "#fbbf24" },
  { label: "Other", amount: "€115", share: 9, color: "#60a5fa" },
] as const;

export const DEMO_MEMBERS = [
  { initial: "Y", name: "You", meta: "Created the wallet", role: "Owner" },
  {
    initial: "P",
    name: "Partner",
    meta: "Adds and edits transactions",
    role: "EDITOR",
  },
  {
    initial: "F",
    name: "Family member",
    meta: "Reads the numbers only",
    role: "VIEWER",
  },
] as const;

export const DEMO_CHAT = {
  question: "How much did I spend on restaurants in March?",
  answer: {
    amount: "€95.00",
    rest: " on Eating Out, about 7% of your expenses. Want a monthly cap for this category?",
  },
};
