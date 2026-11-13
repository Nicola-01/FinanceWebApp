import { describe, expect, it } from "vitest";
import { periodLabel, sumByType } from "../../utils/period";
import type { Transaction } from "../../types/domain";

const oct = {
  start: new Date(2026, 9, 1),
  end: new Date(2026, 9, 31, 23, 59, 59, 999),
};

describe("periodLabel", () => {
  it("names months and years", () => {
    expect(periodLabel(oct, "month")).toBe("October 2026");
    expect(periodLabel(oct, "year")).toBe("2026");
    expect(periodLabel(oct, "all")).toBe("");
  });
});

describe("sumByType", () => {
  it("sums income and expense separately", () => {
    const tx = (type: "INCOME" | "EXPENSE", amount: number) =>
      ({ type, amount }) as Transaction;
    expect(
      sumByType([tx("INCOME", 100), tx("EXPENSE", 30), tx("EXPENSE", 2.5)]),
    ).toEqual({
      income: 100,
      expense: 32.5,
    });
    expect(sumByType([])).toEqual({ income: 0, expense: 0 });
  });
});
