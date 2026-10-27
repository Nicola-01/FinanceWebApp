import { describe, it, expect } from "vitest";
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

describe("buildSankeyData", () => {
  it("returns null when there is no positive income/expense", () => {
    expect(buildSankeyData([], "#fff")).toBeNull();
    expect(buildSankeyData([tx("EXPENSE", 0, "Food")], "#fff")).toBeNull();
  });

  it("builds sorted nodes, a Savings node and crossing-free links", () => {
    const data = buildSankeyData(
      [
        tx("INCOME", 1000, "Salary"),
        tx("EXPENSE", 100, "Rent"),
        tx("EXPENSE", 300, "Groceries", "Food"),
        tx("EXPENSE", 50, "Snacks", "Food"),
      ],
      "#bbbbbb",
    )!;

    expect(data.nodes.map((n) => n.id)).toEqual([
      "IN-Salary",
      "Income",
      "OUT-Food",
      "OUT-Rent",
      "OUT-SUB-Groceries",
      "OUT-SUB-Snacks",
      "Savings",
    ]);
    expect(data.nodes.find((n) => n.id === "Income")?.color).toBe("#bbbbbb");
    expect(data.nodes.find((n) => n.id === "OUT-SUB-Snacks")?.parentId).toBe(
      "OUT-Food",
    );

    expect(data.links).toEqual([
      { source: "IN-Salary", target: "Income", value: 1000, color: "source" },
      { source: "Income", target: "OUT-Food", value: 350, color: "target" },
      { source: "Income", target: "OUT-Rent", value: 100, color: "target" },
      { source: "Income", target: "Savings", value: 550, color: "target" },
      {
        source: "OUT-Food",
        target: "OUT-SUB-Groceries",
        value: 300,
        color: "target",
      },
      {
        source: "OUT-Food",
        target: "OUT-SUB-Snacks",
        value: 50,
        color: "target",
      },
    ]);
  });

  it("adds a Deficit node feeding Income when expenses exceed income", () => {
    const data = buildSankeyData(
      [tx("INCOME", 100, "Bonus", "Work"), tx("EXPENSE", 250, "Rent")],
      "#fff",
    )!;

    expect(data.nodes.map((n) => n.id)).toEqual([
      "IN-SUB-Bonus",
      "IN-Work",
      "Income",
      "OUT-Rent",
      "Deficit",
    ]);
    expect(data.links).toContainEqual({
      source: "Deficit",
      target: "Income",
      value: 150,
      color: "source",
    });
    expect(data.links).toContainEqual({
      source: "IN-SUB-Bonus",
      target: "IN-Work",
      value: 100,
      color: "source",
    });
  });
});
