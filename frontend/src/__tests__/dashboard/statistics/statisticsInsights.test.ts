import { describe, it, expect } from "vitest";
import type { Transaction } from "../../../types/domain.ts";
import { buildInsights } from "../../../dashboard/statistics/statisticsInsights.ts";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (
  date: string,
  amount: number,
  type: "INCOME" | "EXPENSE",
  extra: Partial<Transaction> = {},
): Transaction => ({
  id: `${date}-${amount}-${type}-${Math.random().toString(36).slice(2)}`,
  name: "tx",
  tag,
  amount,
  type,
  transactionDate: date,
  ...extra,
});

// Four months of 2026: expenses 100 / 100 / 300 / 100, income 1000 each.
// March is 3x the median (100) and its biggest expense is 200 of 300 (67%).
const fourMonths = (): Transaction[] => [
  tx("2026-01-05", 1000, "INCOME"),
  tx("2026-01-10", 100, "EXPENSE", { tag: { ...tag, name: "Food" } }),
  tx("2026-02-05", 1000, "INCOME"),
  tx("2026-02-05", 100, "EXPENSE", { tag: { ...tag, name: "Food" } }),
  tx("2026-03-05", 1000, "INCOME"),
  tx("2026-03-02", 100, "EXPENSE", { tag: { ...tag, name: "Food" } }),
  tx("2026-03-29", 200, "EXPENSE", { tag: { ...tag, name: "Rent" } }),
  tx("2026-04-05", 1000, "INCOME"),
  tx("2026-04-05", 100, "EXPENSE", { tag: { ...tag, name: "Food" } }),
];

describe("buildInsights", () => {
  it("returns [] with fewer than 3 months of data", () => {
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-02-05", 100, "EXPENSE"),
    ];
    expect(buildInsights(txs, { kind: "year", year: 2026 }, "€")).toEqual([]);
    expect(buildInsights([], { kind: "all" }, "€")).toEqual([]);
  });

  it("ignores calendar months with no transactions", () => {
    // Jan..Sep span 9 calendar months but only 2 of them have transactions.
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-09-05", 100, "EXPENSE"),
    ];
    expect(buildInsights(txs, { kind: "year", year: 2026 }, "€")).toEqual([]);
  });

  it("fires all rules with exact copy for a year period", () => {
    expect(
      buildInsights(fourMonths(), { kind: "year", year: 2026 }, "€"),
    ).toEqual([
      {
        id: "expensive-month",
        tone: "danger",
        title: "March cost 300 €",
        detail:
          "3× your usual month. 200 € of it is one Rent transaction on 29 Mar.",
      },
      {
        id: "best-month",
        tone: "income",
        title: "Best month: January, +900 €",
        detail: "You kept 90% of what you earned.",
      },
      {
        id: "income-steady",
        tone: "neutral",
        title: "Income is steady",
        detail: "Between 1000 € and 1000 € every month this year.",
      },
    ]);
  });

  it("uses month+year naming and no suffix for the all period", () => {
    const txs = fourMonths().map((t) => ({
      ...t,
      transactionDate: t.transactionDate.replace("2026", "2024"),
    }));
    const insights = buildInsights(txs, { kind: "all" }, "€");
    expect(insights[0]).toEqual({
      id: "expensive-month",
      tone: "danger",
      title: "March 2024 cost 300 €",
      detail:
        "3× your usual month. 200 € of it is one Rent transaction on 29 Mar 2024.",
    });
    expect(insights[1].title).toBe("Best month: January 2024, +900 €");
    expect(insights[2].detail).toBe("Between 1000 € and 1000 € every month.");
  });

  it("drops the transaction sentence when the biggest one is under 40% of the month", () => {
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-01-10", 100, "EXPENSE"),
      tx("2026-02-05", 1000, "INCOME"),
      tx("2026-02-10", 100, "EXPENSE"),
      tx("2026-03-05", 1000, "INCOME"),
      tx("2026-03-02", 100, "EXPENSE", { tag: { ...tag, name: "A" } }),
      tx("2026-03-09", 100, "EXPENSE", { tag: { ...tag, name: "B" } }),
      tx("2026-03-29", 100, "EXPENSE", { tag: { ...tag, name: "C" } }),
    ];
    const expensive = buildInsights(txs, { kind: "year", year: 2026 }, "€")[0];
    expect(expensive.id).toBe("expensive-month");
    expect(expensive.detail).toBe("3× your usual month.");
  });

  it("skips expensive-month when no month is at least 2x the median", () => {
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-01-10", 100, "EXPENSE"),
      tx("2026-02-05", 1000, "INCOME"),
      tx("2026-02-10", 100, "EXPENSE"),
      tx("2026-03-05", 1000, "INCOME"),
      tx("2026-03-10", 150, "EXPENSE"),
    ];
    const ids = buildInsights(txs, { kind: "year", year: 2026 }, "€").map(
      (i) => i.id,
    );
    expect(ids).not.toContain("expensive-month");
  });

  it("skips best-month when no month keeps money", () => {
    const txs = [
      tx("2026-01-05", 100, "INCOME"),
      tx("2026-01-10", 200, "EXPENSE"),
      tx("2026-02-05", 100, "INCOME"),
      tx("2026-02-10", 200, "EXPENSE"),
      tx("2026-03-05", 100, "INCOME"),
      tx("2026-03-10", 200, "EXPENSE"),
    ];
    const ids = buildInsights(txs, { kind: "year", year: 2026 }, "€").map(
      (i) => i.id,
    );
    expect(ids).not.toContain("best-month");
  });

  it("fires subscriptions with share and monthly average", () => {
    const txs = fourMonths().map((t) =>
      t.transactionDate === "2026-01-10"
        ? { ...t, subscriptionId: "sub-1" }
        : t,
    );
    const insights = buildInsights(txs, { kind: "year", year: 2026 }, "€");
    const subs = insights.find((i) => i.id === "subscriptions");
    // 100 subscription out of 600 total expense = 17%; 100 / 4 months = 25 €.
    expect(subs).toEqual({
      id: "subscriptions",
      tone: "recurring",
      title: "Subscriptions are 17% of spending",
      detail: "About 25 € a month, before anything else.",
    });
  });

  it("skips subscriptions when none of the expenses are subscription-generated", () => {
    const ids = buildInsights(
      fourMonths(),
      { kind: "year", year: 2026 },
      "€",
    ).map((i) => i.id);
    expect(ids).not.toContain("subscriptions");
  });

  it("reports income varies when the max exceeds 1.25x the min", () => {
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-02-05", 1000, "INCOME"),
      tx("2026-03-05", 1300, "INCOME"),
      tx("2026-03-10", 50, "EXPENSE"),
    ];
    const steady = buildInsights(txs, { kind: "year", year: 2026 }, "€").find(
      (i) => i.id === "income-steady",
    );
    expect(steady).toEqual({
      id: "income-steady",
      tone: "neutral",
      title: "Income varies",
      detail: "Between 1000 € and 1300 € every month this year.",
    });
  });

  it("skips income-steady with fewer than 3 months having income", () => {
    const txs = [
      tx("2026-01-05", 1000, "INCOME"),
      tx("2026-02-05", 1000, "INCOME"),
      tx("2026-03-10", 50, "EXPENSE"),
      tx("2026-04-10", 50, "EXPENSE"),
    ];
    const ids = buildInsights(txs, { kind: "year", year: 2026 }, "€").map(
      (i) => i.id,
    );
    expect(ids).not.toContain("income-steady");
  });

  it("only uses transactions of the selected year", () => {
    const txs = [...fourMonths(), tx("2025-05-05", 5000, "EXPENSE")];
    const insights = buildInsights(txs, { kind: "year", year: 2026 }, "€");
    expect(insights[0].title).toBe("March cost 300 €");
  });
});
