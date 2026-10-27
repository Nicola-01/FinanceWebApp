import { describe, it, expect } from "vitest";
import type { Tag, Transaction } from "../../../types/domain";
import {
  buildHeatmap,
  buildRanking,
  buildTrend,
} from "../../../dashboard/tag/categoryChartData";
import { OTHER_COLOR } from "../../../dashboard/tag/categoryAgg";

let seq = 0;
const tag = (
  name: string,
  colorHex = "#111111",
  parentName: string | null = null,
): Tag => ({ name, icon: "tag", colorHex, parentName });
const tx = (
  t: Tag,
  amount: number,
  date: string,
  type: Transaction["type"] = "EXPENSE",
): Transaction => ({
  id: String(seq++),
  name: "x",
  tag: t,
  amount,
  type,
  transactionDate: date,
});

describe("buildTrend", () => {
  it("returns empty for no matching transactions", () => {
    expect(
      buildTrend([tx(tag("A"), 1, "2026-01-05", "INCOME")], "EXPENSE"),
    ).toEqual({ dataset: [], series: [] });
  });

  it("stacks main categories per month, chronologically", () => {
    const food = tag("Food", "#ff0000");
    const pizza = tag("Pizza", "#00ff00", "Food");
    const { dataset, series } = buildTrend(
      [
        tx(pizza, 10, "2026-02-03"),
        tx(food, 5, "2026-01-10"),
        tx(tag("Car", "#0000ff"), 3, "2026-02-20"),
      ],
      "EXPENSE",
    );
    expect(series).toEqual([
      { dataKey: "s0", label: "Food", color: "#ff0000" },
      { dataKey: "s1", label: "Car", color: "#0000ff" },
    ]);
    expect(dataset).toEqual([
      { period: "Jan 2026", s0: 5, s1: 0 },
      { period: "Feb 2026", s0: 10, s1: 3 },
    ]);
  });

  it("collapses categories beyond the top 6 into Other", () => {
    const txs = Array.from({ length: 8 }, (_, i) =>
      tx(tag(`C${i}`), 100 - i, "2026-03-01"),
    );
    const { dataset, series } = buildTrend(txs, "EXPENSE");
    expect(series).toHaveLength(7);
    expect(series[6]).toEqual({
      dataKey: "sOther",
      label: "Other",
      color: OTHER_COLOR,
    });
    expect(dataset[0].sOther).toBe(93 + 94);
  });
});

describe("buildHeatmap", () => {
  it("returns an empty grid for no data", () => {
    expect(buildHeatmap([], "INCOME")).toEqual({
      xLabels: [],
      yLabels: [],
      cells: [],
      maxValue: 0,
    });
  });

  it("emits every month × category cell, with zeros", () => {
    const res = buildHeatmap(
      [
        tx(tag("A"), 4, "2026-01-02", "INCOME"),
        tx(tag("B"), 9, "2026-02-02", "INCOME"),
      ],
      "INCOME",
    );
    expect(res.xLabels).toEqual(["Jan 2026", "Feb 2026"]);
    expect(res.yLabels).toEqual(["B", "A"]);
    expect(res.cells).toEqual([
      [0, 0, 0],
      [0, 1, 4],
      [1, 0, 9],
      [1, 1, 0],
    ]);
    expect(res.maxValue).toBe(9);
  });

  it("aggregates categories beyond the top 8 into Other", () => {
    const txs = Array.from({ length: 10 }, (_, i) =>
      tx(tag(`C${i}`), 100 - i, "2026-03-01"),
    );
    const res = buildHeatmap(txs, "EXPENSE");
    expect(res.yLabels).toHaveLength(9);
    expect(res.yLabels[8]).toBe("Other");
    expect(res.cells[8]).toEqual([0, 8, 92 + 91]);
  });
});

describe("buildRanking", () => {
  it("ranks by actual tag, keeping same-named children distinct", () => {
    const { items, total } = buildRanking([
      tx(tag("Misc", "#1", "Food"), 2, "2026-01-01"),
      tx(tag("Misc", "#2", "Home"), 5, "2026-01-01"),
      tx(tag("Misc", "#2", "Home"), 1, "2026-01-01"),
    ]);
    expect(total).toBe(8);
    expect(items.map((i) => [i.key, i.value, i.color])).toEqual([
      ["Home/Misc", 6, "#2"],
      ["Food/Misc", 2, "#1"],
    ]);
  });
});
