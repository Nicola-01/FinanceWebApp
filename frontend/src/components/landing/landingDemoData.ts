import type { Transaction, Wallet } from "../../types/domain.ts";

/**
 * Landing-page demo data.
 *
 * IMPORTANT: tag `colorHex` values are **real hex strings** (not `var(--color-*)`).
 * The nested donut (`TransactionPieChart`) runs `hexToRgba(colorHex, 0.6)` on the
 * outer ring, which parses the hex — a CSS-var string would yield `NaN` and the
 * outer ring would render with no colour. Keep these as hex.
 */

export const GITHUB_URL = "https://github.com/Nicola-01/FinanceWebApp";

/* Soft 400-tints — line up with the app's chart palette. */
const C = {
  green: "#34d399",
  cyan: "#22d3ee",
  purple: "#a78bfa",
  red: "#f87171",
  orange: "#fb923c",
  amber: "#f59e0b",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  pink: "#f472b6",
} as const;

export const DEMO_TRANSACTIONS: Transaction[] = [
  // ── Income ──────────────────────────────────────────────
  {
    id: "1",
    name: "Salary",
    tag: {
      name: "Salary",
      icon: "briefcase",
      colorHex: C.green,
      parentName: "Work",
    },
    amount: 2100,
    originalCurrency: "EUR",
    type: "INCOME",
    transactionDate: "2025-03-01",
  },
  {
    id: "2",
    name: "Bonus",
    tag: {
      name: "Bonus",
      icon: "laptop",
      colorHex: C.cyan,
      parentName: "Work",
    },
    amount: 350,
    originalCurrency: "EUR",
    type: "INCOME",
    transactionDate: "2025-03-05",
  },
  {
    id: "3",
    name: "Dividends",
    tag: {
      name: "Dividends",
      icon: "trending-up",
      colorHex: C.purple,
      parentName: "Investments",
    },
    amount: 120,
    originalCurrency: "EUR",
    type: "INCOME",
    transactionDate: "2025-03-10",
  },
  // ── Expenses ────────────────────────────────────────────
  {
    id: "5",
    name: "Rent",
    tag: { name: "Rent", icon: "home", colorHex: C.red, parentName: "Housing" },
    amount: 650,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-01",
  },
  {
    id: "6",
    name: "Groceries",
    tag: {
      name: "Groceries",
      icon: "shopping-cart",
      colorHex: C.yellow,
      parentName: "Food & Dining",
    },
    amount: 320,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-03",
  },
  {
    id: "7",
    name: "Restaurant",
    tag: {
      name: "Eating Out",
      icon: "utensils",
      colorHex: C.amber,
      parentName: "Food & Dining",
    },
    amount: 95,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-08",
  },
  {
    id: "8",
    name: "Electricity",
    tag: {
      name: "Utilities",
      icon: "zap",
      colorHex: C.orange,
      parentName: "Housing",
    },
    amount: 120,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-05",
  },
  {
    id: "10",
    name: "Gym",
    tag: {
      name: "Fitness",
      icon: "heart",
      colorHex: C.pink,
      parentName: "Health",
    },
    amount: 40,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-01",
  },
  {
    id: "11",
    name: "Spotify",
    tag: {
      name: "Subscriptions",
      icon: "music",
      colorHex: C.blue,
      parentName: "Entertainment",
    },
    amount: 30,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-01",
  },
  {
    id: "12",
    name: "Cinema",
    tag: {
      name: "Leisure",
      icon: "film",
      colorHex: C.purple,
      parentName: "Entertainment",
    },
    amount: 45,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2025-03-12",
  },
];

/* Two faithful wallets for the hero mockup / multi-currency block. */
export const DEMO_WALLETS: Wallet[] = [
  {
    id: "w1",
    name: "Main Account",
    icon: "wallet",
    color: "#8b5cf6",
    currency: "EUR",
    createdAt: "2025-01-01",
    userRole: "OWNER",
  },
  {
    id: "w2",
    name: "Travel Fund",
    icon: "plane",
    color: "#f472b6",
    currency: "JPY",
    createdAt: "2025-01-01",
    userRole: "OWNER",
  },
];

/* The "small expenses add up" band. */
export interface MicroExpense {
  emoji: string;
  label: string;
  amount: number;
}

export const MICRO_EXPENSES: MicroExpense[] = [
  { emoji: "☕", label: "Coffee", amount: 3.5 },
  { emoji: "🎬", label: "Streaming", amount: 12.99 },
  { emoji: "🅿️", label: "Parking", amount: 2.0 },
  { emoji: "🥐", label: "Croissant", amount: 1.8 },
  { emoji: "🚕", label: "Taxi", amount: 9.0 },
  { emoji: "🍔", label: "Lunch", amount: 8.5 },
];

/* UI v2 landing: problem-band chips (icon keys from utils/icons.ts). */
export const V2_MICRO_EXPENSES = [
  { icon: "coffee", color: "#fb923c", label: "Coffee", amount: 3.5 },
  { icon: "movies", color: "#f472b6", label: "Streaming", amount: 12.99 },
  { icon: "car", color: "#60a5fa", label: "Parking", amount: 2.0 },
  { icon: "cart", color: "#fbbf24", label: "Croissant", amount: 1.8 },
  { icon: "car", color: "#60a5fa", label: "Taxi", amount: 9.0 },
  { icon: "dining", color: "#fbbf24", label: "Lunch", amount: 8.5 },
];

/* UI v2 landing: trust section items. */
export const V2_TRUST_ITEMS = [
  {
    icon: "eye",
    color: "#a78bfa",
    title: "Open source",
    text: "Read every line on GitHub, including the code that handles your money.",
  },
  {
    icon: "server",
    color: "#60a5fa",
    title: "Self-hostable",
    text: "Run the whole stack on your own server with Docker Compose.",
  },
  {
    icon: "ban",
    color: "#f472b6",
    title: "No ads",
    text: "No ads, no tracking pixels, and no selling of your transactions.",
  },
  {
    icon: "invoice",
    color: "#34d399",
    title: "Bring your history",
    text: "Import past transactions from a CSV file and start from real numbers.",
  },
];
