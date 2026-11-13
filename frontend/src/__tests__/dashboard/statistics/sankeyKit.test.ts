import { describe, expect, it } from "vitest";
import {
  cashFlowFooter,
  cashFlowTotals,
  toKitSankey,
} from "../../../dashboard/statistics/sankeyKit.ts";
import { buildSankeyData } from "../../../dashboard/statistics/sankeyData.ts";
import type { Transaction } from "../../../types/domain.ts";

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  name: string,
  parentName?: string,
): Transaction => ({
  id: `${type}-${name}-${amount}`,
  name: "tx",
  tag: { name, parentName, icon: "tag", colorHex: "#123456" },
  amount,
  transactionDate: "2024-01-01T12:00:00",
  type,
});

const money = (v: number) => `${v} €`;

describe("toKitSankey", () => {
  it("maps ids to node indices and keeps the link values", () => {
    const graph = buildSankeyData(
      [
        tx("INCOME", 1000, "Salary"),
        tx("EXPENSE", 100, "Rent"),
        tx("EXPENSE", 300, "Groceries", "Food"),
      ],
      "#bbbbbb",
    )!;

    const { data } = toKitSankey(graph);

    expect(data.nodes.map((n) => n.name)).toEqual(
      graph.nodes.map((n) => n.label),
    );
    expect(data.links).toEqual(
      graph.links.map((l) => ({
        source: graph.nodes.findIndex((n) => n.id === l.source),
        target: graph.nodes.findIndex((n) => n.id === l.target),
        value: l.value,
      })),
    );
  });

  it("colours income, the central node and savings with the income token", () => {
    const graph = buildSankeyData(
      [tx("INCOME", 1000, "Salary"), tx("EXPENSE", 100, "Rent")],
      "#bbbbbb",
    )!;

    const { colors } = toKitSankey(graph);
    const colorOf = (id: string) =>
      colors[graph.nodes.findIndex((n) => n.id === id)];

    expect(colorOf("IN-Salary")).toBe("var(--color-app-income)");
    expect(colorOf("Income")).toBe("var(--color-app-income)");
    expect(colorOf("Savings")).toBe("var(--color-app-income)");
    expect(colorOf("OUT-Rent")).toBe("#123456");
  });

  it("paints a deficit with the expense mark", () => {
    const graph = buildSankeyData(
      [tx("INCOME", 100, "Salary"), tx("EXPENSE", 300, "Rent")],
      "#bbbbbb",
    )!;

    const { colors } = toKitSankey(graph);
    const i = graph.nodes.findIndex((n) => n.id === "Deficit");

    expect(colors[i]).toBe("var(--color-app-expense-mark)");
  });
});

describe("cashFlowTotals", () => {
  it("sums positive income and expenses only", () => {
    expect(
      cashFlowTotals([
        tx("INCOME", 1000, "Salary"),
        tx("INCOME", 0, "Refund"),
        tx("EXPENSE", 250, "Rent"),
        tx("EXPENSE", -40, "Credit"),
      ]),
    ).toEqual({ income: 1000, expenses: 250 });
  });
});

describe("cashFlowFooter", () => {
  it("states the savings rate when income exceeds spending", () => {
    expect(cashFlowFooter({ income: 1000, expenses: 750 }, money)).toBe(
      "Saved 25% of income",
    );
  });

  it("states the overspend when spending exceeds income", () => {
    expect(cashFlowFooter({ income: 500, expenses: 700 }, money)).toBe(
      "Spent 200 € more than earned",
    );
  });

  it("reports zero savings as 0%", () => {
    expect(cashFlowFooter({ income: 500, expenses: 500 }, money)).toBe(
      "Saved 0% of income",
    );
  });

  it("returns null without income", () => {
    expect(cashFlowFooter({ income: 0, expenses: 0 }, money)).toBeNull();
  });
});
