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

  describe("investments", () => {
    const invest = new Set(["PAC"]);

    it("adds Invested and Liquidity left nodes and a Cashed out source", () => {
      const data = buildSankeyData(
        [
          tx("INCOME", 1000, "Salary"),
          tx("EXPENSE", 100, "Rent"),
          tx("EXPENSE", 300, "PAC"),
          tx("INCOME", 50, "PAC"),
        ],
        "#bbbbbb",
        invest,
      )!;
      const ids = data.nodes.map((n) => n.id);

      expect(ids).toEqual(
        expect.arrayContaining([
          "Invested",
          "INV-PAC",
          "Cashed out",
          "Savings",
        ]),
      );
      expect(ids).not.toContain("OUT-PAC");
      expect(data.nodes.find((n) => n.id === "Savings")?.label).toBe(
        "Liquidity left",
      );
      expect(data.nodes.find((n) => n.id === "INV-PAC")?.parentId).toBe(
        "Invested",
      );
      // Liquidity = Income 1000 - Spent 100 - (Bought 300 - Cashed out 50).
      expect(data.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "Income",
            target: "Invested",
            value: 300,
          }),
          expect.objectContaining({
            source: "Invested",
            target: "INV-PAC",
            value: 300,
          }),
          expect.objectContaining({
            source: "Cashed out",
            target: "Income",
            value: 50,
          }),
          expect.objectContaining({
            source: "Income",
            target: "Savings",
            value: 650,
          }),
        ]),
      );
    });

    it("feeds a Deficit into Income when the invested money outruns income", () => {
      const data = buildSankeyData(
        [tx("INCOME", 1000, "Salary"), tx("EXPENSE", 1500, "PAC")],
        "#bbbbbb",
        invest,
      )!;
      expect(data.nodes.map((n) => n.id)).toContain("Deficit");
      expect(data.links).toContainEqual(
        expect.objectContaining({
          source: "Deficit",
          target: "Income",
          value: 500,
        }),
      );
    });
  });
});
