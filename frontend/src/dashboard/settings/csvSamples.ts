// Example rows for the CSV format reference sheet (CsvFormatModal).

import {
  TRANSACTION_COLUMNS,
  TAG_COLUMNS,
  SUBSCRIPTION_COLUMNS,
  type CsvColumn,
} from "./csvImport.ts";

export type Mode = "transactions" | "tags" | "subscriptions";

interface SampleSpec {
  filename: string;
  columns: CsvColumn[];
  rows: string[][];
}

/**
 * Example rows for each exportable CSV. The column definitions are imported
 * from `csvImport` — the single source of truth shared with the export/import
 * code — so a downloaded sample round-trips with a real export.
 */
export const SAMPLES: Record<Mode, SampleSpec> = {
  transactions: {
    filename: "transactions_sample.csv",
    columns: TRANSACTION_COLUMNS,
    rows: [
      [
        "2026-06-01",
        "Monthly Salary",
        "Salary",
        "2500",
        "INCOME",
        "June paycheck",
        "",
        "",
        "",
      ],
      [
        "2026-06-03",
        "Supermarket",
        "Groceries",
        "54.20",
        "EXPENSE",
        "Weekly shop",
        "",
        "",
        "",
      ],
      [
        "2026-06-10",
        "Hotel Tokyo",
        "Travel",
        "120.25",
        "EXPENSE",
        "Business trip",
        "18500",
        "JPY",
        "0.0065",
      ],
    ],
  },
  tags: {
    filename: "tags_sample.csv",
    columns: TAG_COLUMNS,
    rows: [
      ["Salary", "sack", "#34d399", ""],
      ["Food", "dining", "#f87171", ""],
      ["Groceries", "cart", "#fb923c", "Food"],
      ["Travel", "plane", "#60a5fa", ""],
    ],
  },
  subscriptions: {
    filename: "subscriptions_sample.csv",
    columns: SUBSCRIPTION_COLUMNS,
    rows: [
      [
        "Netflix",
        "Entertainment",
        "12.99",
        "EXPENSE",
        "ACTIVE",
        "2026-01-01",
        "MONTHLY",
        "1",
        "1",
        "false",
        "FOREVER",
        "",
        "",
        "",
        "",
        "",
        "false",
        "Streaming plan",
      ],
      [
        "Salary",
        "Salary",
        "2500",
        "INCOME",
        "ACTIVE",
        "2026-01-31",
        "MONTHLY",
        "1",
        "",
        "true",
        "FOREVER",
        "",
        "",
        "",
        "",
        "",
        "false",
        "Payday",
      ],
      [
        "Gym",
        "Health",
        "30",
        "EXPENSE",
        "PAUSED",
        "2026-02-01",
        "MONTHLY",
        "1",
        "5",
        "false",
        "UNTIL",
        "",
        "2026-12-31",
        "35",
        "USD",
        "0.92",
        "true",
        "",
      ],
    ],
  },
};
