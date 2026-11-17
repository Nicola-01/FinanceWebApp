import { describe, it, expect } from "vitest";
import type { Transaction } from "../../../types/domain.ts";
import {
  monthByMonthRows,
  waterfallRows,
  balanceHistory,
  symmetricBound,
} from "../../../dashboard/statistics/statsChartRows.ts";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
let seq = 0;
const tx = (
  transactionDate: string,
  amount: number,
  type: "INCOME" | "EXPENSE",
  extra: Partial<Transaction> = {},
): Transaction => ({
  id: `t${seq++}`,
  name: "tx",
  tag,
  amount,
  type,
  transactionDate,
  ...extra,
});

// June 2026: the current year has slots Jan..Jun.
const today = new Date(2026, 5, 15);

describe("monthByMonthRows", () => {
  it("returns 12 rows for a current year, leaving future months empty", () => {
    const txs = [
      tx("2026-01-10", 1000, "INCOME"),
      tx("2026-01-20", 300, "EXPENSE"),
      tx("2026-03-05", 200, "EXPENSE"),
      tx("2026-08-01", 50, "INCOME"),
    ];
    const rows = monthByMonthRows(
      txs,
      { kind: "year", year: 2026 },
      today,
      new Set(),
    );

    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({
      date: new Date(2026, 0, 1),
      income: 1000,
      expense: -300,
      kept: 700,
      bought: 0,
      cashedOut: 0,
      liquidity: 700,
    });
    expect(rows[2]).toEqual({
      date: new Date(2026, 2, 1),
      income: 0,
      expense: -200,
      kept: -200,
      bought: 0,
      cashedOut: 0,
      liquidity: -200,
    });
    expect(rows[5].income).toBe(0);
    expect(rows[6]).toEqual({ date: new Date(2026, 6, 1) });
    expect(rows[6]).not.toHaveProperty("income");
    expect(rows[11]).not.toHaveProperty("kept");
  });

  it("fills all 12 months for a past year", () => {
    const txs = [tx("2025-12-31", 40, "EXPENSE")];
    const rows = monthByMonthRows(
      txs,
      { kind: "year", year: 2025 },
      today,
      new Set(),
    );

    expect(rows).toHaveLength(12);
    expect(rows[11]).toEqual({
      date: new Date(2025, 11, 1),
      income: 0,
      expense: -40,
      kept: -40,
      bought: 0,
      cashedOut: 0,
      liquidity: -40,
    });
    expect(rows[0].expense).toBe(0);
  });

  it("returns 12 empty rows for a future year", () => {
    const rows = monthByMonthRows(
      [tx("2026-01-10", 10, "INCOME")],
      { kind: "year", year: 2027 },
      today,
      new Set(),
    );
    expect(rows).toHaveLength(12);
    rows.forEach((r) => expect(r).not.toHaveProperty("income"));
  });

  it("gives one row per year slot for all-time, including gap years", () => {
    const txs = [
      tx("2022-05-01", 100, "INCOME"),
      tx("2024-02-01", 30, "EXPENSE"),
    ];
    const rows = monthByMonthRows(txs, { kind: "all" }, today, new Set());

    expect(rows).toEqual([
      {
        date: new Date(2022, 0, 1),
        income: 100,
        expense: 0,
        kept: 100,
        bought: 0,
        cashedOut: 0,
        liquidity: 100,
      },
      {
        date: new Date(2023, 0, 1),
        income: 0,
        expense: 0,
        kept: 0,
        bought: 0,
        cashedOut: 0,
        liquidity: 0,
      },
      {
        date: new Date(2024, 0, 1),
        income: 0,
        expense: -30,
        kept: -30,
        bought: 0,
        cashedOut: 0,
        liquidity: -30,
      },
    ]);
  });

  it("returns [] for all-time with no transactions", () => {
    expect(monthByMonthRows([], { kind: "all" }, today, new Set())).toEqual([]);
  });

  it("moves investment tags out of income and spent into bought and cashed out", () => {
    const invest = new Set(["Brokerage"]);
    const brokerage = { name: "Brokerage", icon: "tag", colorHex: "#fff" };
    const txs = [
      tx("2026-03-01", 1000, "INCOME"),
      tx("2026-03-02", 200, "EXPENSE"),
      tx("2026-03-03", 300, "EXPENSE", { tag: brokerage }),
      tx("2026-03-04", 500, "INCOME", { tag: brokerage }),
    ];
    const rows = monthByMonthRows(
      txs,
      { kind: "year", year: 2026 },
      today,
      invest,
    );

    expect(rows[2]).toEqual({
      date: new Date(2026, 2, 1),
      income: 1000,
      expense: -200,
      kept: 800,
      bought: 300,
      cashedOut: 500,
      liquidity: 1000 + 500 - 200 - 300,
    });
  });

  it("gives a month with cashed out above bought a liquidity above its kept", () => {
    const invest = new Set(["Brokerage"]);
    const brokerage = { name: "Brokerage", icon: "tag", colorHex: "#fff" };
    const txs = [
      tx("2026-02-01", 100, "EXPENSE", { tag: brokerage }),
      tx("2026-02-02", 400, "INCOME", { tag: brokerage }),
    ];
    const [, feb] = monthByMonthRows(
      txs,
      { kind: "year", year: 2026 },
      today,
      invest,
    );

    expect(feb.bought).toBe(100);
    expect(feb.cashedOut).toBe(400);
    expect(feb.kept).toBe(0);
    expect(feb.liquidity).toBe(300);
  });
});

describe("waterfallRows", () => {
  it("opens with the net of previous years and closes with Now for the current year", () => {
    const txs = [
      tx("2025-03-01", 500, "INCOME"),
      tx("2025-06-01", 200, "EXPENSE"),
      tx("2026-01-05", 100, "INCOME"),
      tx("2026-02-05", 150, "EXPENSE"),
      tx("2026-02-10", 20, "INCOME"),
    ];
    const rows = waterfallRows(txs, { kind: "year", year: 2026 }, today);

    // 1 Jan + Jan..Jun (today is June) + Now
    expect(rows).toHaveLength(8);
    expect(rows[0]).toEqual({ label: "1 Jan", value: 300, total: true });
    expect(rows[1]).toEqual({ label: "Jan", value: 100 });
    expect(rows[2]).toEqual({ label: "Feb", value: -130 });
    expect(rows[7]).toEqual({ label: "Now", total: true });
    expect(rows[7]).not.toHaveProperty("value");
  });

  it("closes with 31 Dec for a past year", () => {
    const txs = [
      tx("2024-12-01", 50, "INCOME"),
      tx("2025-01-10", 10, "EXPENSE"),
    ];
    const rows = waterfallRows(txs, { kind: "year", year: 2025 }, today);

    expect(rows).toHaveLength(14);
    expect(rows[0]).toEqual({ label: "1 Jan", value: 50, total: true });
    expect(rows[1]).toEqual({ label: "Jan", value: -10 });
    expect(rows[13]).toEqual({ label: "31 Dec", total: true });
  });

  it("returns [] for a future year", () => {
    expect(
      waterfallRows(
        [tx("2026-01-10", 10, "INCOME")],
        { kind: "year", year: 2027 },
        today,
      ),
    ).toEqual([]);
  });

  it("gives one net row per year plus Now for all-time", () => {
    const txs = [
      tx("2023-06-01", 100, "INCOME"),
      tx("2025-01-01", 40, "EXPENSE"),
      tx("2025-07-01", 10, "INCOME"),
    ];
    expect(waterfallRows(txs, { kind: "all" }, today)).toEqual([
      { label: "2023", value: 100 },
      { label: "2024", value: 0 },
      { label: "2025", value: -30 },
      { label: "Now", total: true },
    ]);
  });

  it("returns [] for all-time with no transactions", () => {
    expect(waterfallRows([], { kind: "all" }, today)).toEqual([]);
  });
});

describe("balanceHistory", () => {
  it("fills months without transactions with the previous balance, up to today", () => {
    const txs = [
      tx("2026-01-10", 1000, "INCOME"),
      tx("2026-03-05", 300, "EXPENSE"),
    ];
    const history = balanceHistory(txs, new Date(2026, 4, 20));

    expect(history).toEqual([
      { date: new Date(2026, 0, 1), balance: 1000 },
      { date: new Date(2026, 1, 1), balance: 1000 },
      { date: new Date(2026, 2, 1), balance: 700 },
      { date: new Date(2026, 3, 1), balance: 700 },
      { date: new Date(2026, 4, 1), balance: 700 },
    ]);
  });

  it("returns [] with no transactions", () => {
    expect(balanceHistory([], today)).toEqual([]);
  });
});

describe("symmetricBound", () => {
  it("is 1.1 times the largest magnitude across income, expense and kept", () => {
    const bound = symmetricBound([
      { date: new Date(2026, 0, 1), income: 100, expense: -400, kept: -300 },
      { date: new Date(2026, 1, 1), income: 250, expense: -50, kept: 200 },
    ]);
    expect(bound).toBeCloseTo(440);
  });

  it("is 100 when empty or all zero", () => {
    expect(symmetricBound([])).toBe(100);
    expect(
      symmetricBound([
        { date: new Date(2026, 0, 1), income: 0, expense: 0, kept: 0 },
        { date: new Date(2026, 1, 1) },
      ]),
    ).toBe(100);
  });
});
