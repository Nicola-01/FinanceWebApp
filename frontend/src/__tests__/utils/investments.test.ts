import { describe, expect, it } from "vitest";
import {
  investmentTagNames,
  isInvestmentTx,
  sumFlows,
} from "../../utils/investments";
import type { Tag, Transaction } from "../../types/domain";

const tag = (
  name: string,
  parentName: string | null = null,
  investment?: boolean,
): Tag => ({
  name,
  icon: "faTags",
  colorHex: "#000000",
  parentName,
  investment,
});

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  tagName?: string,
  needsReview = false,
): Transaction =>
  ({
    id: `${type}-${amount}-${tagName ?? "none"}`,
    name: "t",
    tag: tagName === undefined ? undefined : tag(tagName),
    amount,
    type,
    needsReview,
    transactionDate: "2026-01-01",
  }) as unknown as Transaction;

describe("investmentTagNames", () => {
  it("flags a tagged subtree under a flagged parent", () => {
    const names = investmentTagNames([
      tag("Investments", null, true),
      tag("Stocks", "Investments"),
      tag("ETF", "Stocks"),
      tag("Food"),
    ]);
    expect([...names].sort()).toEqual(["ETF", "Investments", "Stocks"]);
  });

  it("a flagged child does not flag its unflagged parent or siblings", () => {
    const names = investmentTagNames([
      tag("Food"),
      tag("Snacks", "Food", true),
      tag("Groceries", "Food"),
    ]);
    expect([...names]).toEqual(["Snacks"]);
  });

  it("handles a cycle in the parent chain and terminates", () => {
    const names = investmentTagNames([
      tag("A", "B", true),
      tag("B", "A"),
      tag("C", "D"),
      tag("D", "C"),
    ]);
    expect([...names].sort()).toEqual(["A", "B"]);
  });

  it("never includes the placeholder, which is absent from the tag list", () => {
    const names = investmentTagNames([tag("Investments", null, true)]);
    expect(names.has("To categorise")).toBe(false);
  });
});

describe("isInvestmentTx", () => {
  const invest = new Set(["Stocks"]);

  it("matches on the transaction's tag name", () => {
    expect(isInvestmentTx(tx("EXPENSE", 10, "Stocks"), invest)).toBe(true);
    expect(isInvestmentTx(tx("EXPENSE", 10, "Food"), invest)).toBe(false);
  });

  it("an untagged transaction is not an investment", () => {
    expect(isInvestmentTx(tx("EXPENSE", 10), invest)).toBe(false);
  });

  it("the placeholder import is never an investment", () => {
    const placeholder = tx("EXPENSE", 10, "To categorise", true);
    expect(isInvestmentTx(placeholder, invest)).toBe(false);
  });
});

describe("sumFlows", () => {
  const invest = new Set(["Stocks"]);

  it("splits income/spent from bought/cashed out", () => {
    const flows = sumFlows(
      [
        tx("INCOME", 2400, "Salary"),
        tx("EXPENSE", 1380, "Food"),
        tx("EXPENSE", 500, "Stocks"),
        tx("INCOME", 200, "Stocks"),
      ],
      invest,
    );
    expect(flows).toEqual({
      income: 2400,
      spent: 1380,
      bought: 500,
      cashedOut: 200,
      investedNet: 300,
      net: 1020,
      liquidityLeft: 720,
    });
  });

  it("invested net is negative when cashed out exceeds bought", () => {
    const flows = sumFlows(
      [
        tx("INCOME", 1000, "Salary"),
        tx("EXPENSE", 200, "Food"),
        tx("INCOME", 500, "Stocks"),
      ],
      invest,
    );
    expect(flows.bought).toBe(0);
    expect(flows.cashedOut).toBe(500);
    expect(flows.investedNet).toBe(-500);
    expect(flows.net).toBe(800);
    expect(flows.liquidityLeft).toBe(flows.net + 500);
  });

  it("untagged transactions are income/spent", () => {
    const flows = sumFlows([tx("INCOME", 100), tx("EXPENSE", 40)], invest);
    expect(flows.income).toBe(100);
    expect(flows.spent).toBe(40);
    expect(flows.bought).toBe(0);
    expect(flows.cashedOut).toBe(0);
  });
});
