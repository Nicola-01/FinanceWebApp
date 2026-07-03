import { describe, it, expect } from "vitest";
import { buildMonthlyBuckets } from "../../../dashboard/statistics/chartData";
import type { Transaction } from "../../../utils/types.ts";

// NOTE: Despite its file name, chartData.ts exports the pure
// data-shaping helper `buildMonthlyBuckets` (no range-selector UI lives here).
// We test the actual exported behaviour.

const tag = { name: "Groceries", icon: "cart", colorHex: "#fff" };

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  name: "tx",
  tag,
  amount: 0,
  // Use an explicit local time (noon) so getMonth()/getFullYear() never drift
  // across a UTC-midnight day boundary regardless of the runner's timezone.
  transactionDate: "2024-01-01T12:00:00",
  type: "EXPENSE",
  ...over,
});

describe("buildMonthlyBuckets", () => {
  it("returns an empty array for no transactions", () => {
    expect(buildMonthlyBuckets([])).toEqual([]);
  });

  it("groups transactions of the same month/year into one bucket", () => {
    const buckets = buildMonthlyBuckets([
      tx({
        transactionDate: "2024-01-10T12:00:00",
        type: "INCOME",
        amount: 100,
      }),
      tx({
        transactionDate: "2024-01-20T12:00:00",
        type: "EXPENSE",
        amount: 40,
      }),
    ]);

    expect(buckets).toHaveLength(1);
    expect(buckets[0].income).toBe(100);
    expect(buckets[0].expense).toBe(40);
  });

  it("sums income and expense separately per bucket", () => {
    const buckets = buildMonthlyBuckets([
      tx({
        transactionDate: "2024-03-01T12:00:00",
        type: "INCOME",
        amount: 200,
      }),
      tx({
        transactionDate: "2024-03-05T12:00:00",
        type: "INCOME",
        amount: 50,
      }),
      tx({
        transactionDate: "2024-03-09T12:00:00",
        type: "EXPENSE",
        amount: 30,
      }),
    ]);

    expect(buckets).toHaveLength(1);
    expect(buckets[0].income).toBe(250);
    expect(buckets[0].expense).toBe(30);
  });

  it("produces one bucket per month, sorted ascending by date", () => {
    const buckets = buildMonthlyBuckets([
      // Deliberately provided out of chronological order.
      tx({
        transactionDate: "2024-03-05T12:00:00",
        type: "INCOME",
        amount: 200,
      }),
      tx({
        transactionDate: "2024-01-10T12:00:00",
        type: "INCOME",
        amount: 100,
      }),
      tx({
        transactionDate: "2024-01-20T12:00:00",
        type: "EXPENSE",
        amount: 40,
      }),
    ]);

    expect(buckets).toHaveLength(2);

    // January bucket comes first.
    expect(buckets[0].date.getFullYear()).toBe(2024);
    expect(buckets[0].date.getMonth()).toBe(0);
    expect(buckets[0].income).toBe(100);
    expect(buckets[0].expense).toBe(40);

    // March bucket comes second.
    expect(buckets[1].date.getMonth()).toBe(2);
    expect(buckets[1].income).toBe(200);
    expect(buckets[1].expense).toBe(0);
  });

  it("anchors each bucket date to the first day of its month", () => {
    const buckets = buildMonthlyBuckets([
      tx({
        transactionDate: "2024-07-23T12:00:00",
        type: "INCOME",
        amount: 10,
      }),
    ]);

    expect(buckets[0].date.getDate()).toBe(1);
    expect(buckets[0].date.getMonth()).toBe(6);
  });
});
