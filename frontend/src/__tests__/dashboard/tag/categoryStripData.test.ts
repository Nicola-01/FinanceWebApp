import { describe, it, expect } from "vitest";
import { rankExpenseCategories } from "../../../dashboard/tag/categoryStripData";
import type { Tag, Transaction } from "../../../types/domain";

const tag = (
  name: string,
  parentName: string | null = null,
  colorHex = "#123456",
): Tag => ({
  name,
  icon: "tag",
  colorHex,
  parentName,
});

const tx = (type: "EXPENSE" | "INCOME", amount: number, t: Tag): Transaction =>
  ({
    id: `${t.name}-${amount}-${type}`,
    type,
    amount,
    tag: t,
  }) as unknown as Transaction;

describe("rankExpenseCategories", () => {
  const food = tag("Food", null, "#f0b85a");
  const groceries = tag("Groceries", "Food");
  const home = tag("Home", null, "#7aaaf5");

  it("groups sub-categories under their top-level category, largest first", () => {
    const result = rankExpenseCategories(
      [
        tx("EXPENSE", 30, groceries),
        tx("EXPENSE", 20, food),
        tx("EXPENSE", 60, home),
      ],
      [food, groceries, home],
      new Set(),
    );

    expect(result.map((c) => c.name)).toEqual(["Home", "Food"]);
    expect(result.map((c) => c.percent)).toEqual([55, 45]);
    expect(result[1].color).toBe("#f0b85a");
  });

  it("rounds shares to whole percents", () => {
    const result = rankExpenseCategories(
      [tx("EXPENSE", 1, home), tx("EXPENSE", 2, food)],
      [food, home],
      new Set(),
    );
    expect(result.map((c) => c.percent)).toEqual([67, 33]);
  });

  it("ignores income", () => {
    const result = rankExpenseCategories(
      [tx("INCOME", 100, home), tx("EXPENSE", 10, food)],
      [food, home],
      new Set(),
    );
    expect(result.map((c) => c.name)).toEqual(["Food"]);
    expect(result[0].percent).toBe(100);
  });

  it("never ranks spending filed under an investment tag", () => {
    const stocks = tag("Stocks", null, "#22c55e");
    const result = rankExpenseCategories(
      [tx("EXPENSE", 90, stocks), tx("EXPENSE", 10, food)],
      [food, stocks],
      new Set(["Stocks"]),
    );
    expect(result.map((c) => c.name)).toEqual(["Food"]);
    expect(result[0].percent).toBe(100);
  });

  it("returns nothing when there is no expense in the period", () => {
    expect(
      rankExpenseCategories([tx("INCOME", 10, home)], [home], new Set()),
    ).toEqual([]);
    expect(rankExpenseCategories([], [home], new Set())).toEqual([]);
  });

  it("falls back to a neutral colour for a category missing from the tag list", () => {
    const result = rankExpenseCategories(
      [tx("EXPENSE", 5, tag("Orphan"))],
      [],
      new Set(),
    );
    expect(result[0].color).toBe("#9ca3af");
  });
});
