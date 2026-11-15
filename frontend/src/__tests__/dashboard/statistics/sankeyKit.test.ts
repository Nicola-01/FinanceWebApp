import { describe, expect, it } from "vitest";
import {
  compactSankeyGraph,
  limitSankeyGraph,
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

describe("compactSankeyGraph", () => {
  // Top-level expense tags (no parent) plus one income sub-tag, so the graph has sub nodes.
  const graphWith = (expenseAmounts: [string, number][]) =>
    buildSankeyData(
      [
        tx("INCOME", 10000, "Salary"),
        tx("INCOME", 400, "Bonus", "Work"),
        tx("EXPENSE", 50, "Groceries", "Food"),
        ...expenseAmounts.map(([name, amount]) => tx("EXPENSE", amount, name)),
      ],
      "#bbbbbb",
    )!;

  const sumIncomeLinks = (g: { links: { source: string; value: number }[] }) =>
    g.links
      .filter((l) => l.source === "Income")
      .reduce((sum, l) => sum + l.value, 0);

  it("drops sub-tag nodes and every link touching one", () => {
    const compact = compactSankeyGraph(graphWith([["Rent", 100]]));

    const subs = (id: string) => id.includes("-SUB-");
    expect(compact.nodes.some((n) => subs(n.id))).toBe(false);
    expect(compact.links.some((l) => subs(l.source) || subs(l.target))).toBe(
      false,
    );
    expect(compact.nodes.map((n) => n.id)).toContain("OUT-Food");
    expect(compact.nodes.map((n) => n.id)).toContain("IN-Work");
  });

  it("folds the tags past the five largest into one Others node", () => {
    const compact = compactSankeyGraph(
      graphWith([
        ["A", 800],
        ["B", 700],
        ["C", 600],
        ["D", 500],
        ["E", 400],
        ["F", 300],
        ["G", 200],
        ["H", 100],
      ]),
      5,
    );

    const outIds = compact.nodes
      .map((n) => n.id)
      .filter((id) => id.startsWith("OUT-"));
    expect(outIds).toEqual([
      "OUT-A",
      "OUT-B",
      "OUT-C",
      "OUT-D",
      "OUT-E",
      "OUT-__other",
    ]);
    expect(compact.nodes.find((n) => n.id === "OUT-__other")).toEqual({
      id: "OUT-__other",
      label: "Others",
      color: "#8a857c",
    });
    // Folded tags F, G, H and the Food parent (50) = 650.
    expect(compact.links.find((l) => l.target === "OUT-__other")?.value).toBe(
      650,
    );
    expect(compact.links.some((l) => l.target === "OUT-F")).toBe(false);
  });

  it("does not fold when there are at most maxExpenses + 1 expense tags", () => {
    // Five named tags plus the Food parent = six expense tags.
    const compact = compactSankeyGraph(
      graphWith([
        ["A", 600],
        ["B", 500],
        ["C", 400],
        ["D", 300],
        ["E", 200],
      ]),
      5,
    );

    expect(compact.nodes.map((n) => n.id)).not.toContain("OUT-__other");
    expect(
      compact.links.filter((l) => l.target.startsWith("OUT-")),
    ).toHaveLength(6);
  });

  it("keeps Savings last and the total Income outflow unchanged", () => {
    const graph = graphWith([
      ["A", 800],
      ["B", 700],
      ["C", 600],
      ["D", 500],
      ["E", 400],
      ["F", 300],
    ]);
    const compact = compactSankeyGraph(graph, 5);

    expect(compact.nodes.at(-1)?.id).toBe("Savings");
    expect(compact.links.some((l) => l.target === "Savings")).toBe(true);
    expect(sumIncomeLinks(compact)).toBe(sumIncomeLinks(graph));
  });
});

describe("limitSankeyGraph", () => {
  const expenseTx = (amounts: [string, number][]) =>
    amounts.map(([name, amount]) => tx("EXPENSE", amount, name));
  const sumLinks = (
    links: { source: string; target: string; value: number }[],
    pick: (l: { source: string; target: string }) => boolean,
  ) => links.filter(pick).reduce((sum, l) => sum + l.value, 0);
  const toIncome = (l: { target: string }) => l.target === "Income";
  const fromIncome = (l: { source: string }) => l.source === "Income";
  const build = (txs: Transaction[]) => buildSankeyData(txs, "#bbbbbb")!;
  const ids = (g: { nodes: { id: string }[] }) => g.nodes.map((n) => n.id);

  it("folds expense tags past the eight largest into Others at ten tags", () => {
    // Nine named tags plus the Food parent (50) = ten expense tags.
    const graph = build([
      tx("INCOME", 10000, "Salary"),
      tx("EXPENSE", 50, "Groceries", "Food"),
      ...expenseTx([
        ["A", 900],
        ["B", 800],
        ["C", 700],
        ["D", 600],
        ["E", 500],
        ["F", 400],
        ["G", 300],
        ["H", 200],
        ["I", 100],
      ]),
    ]);

    const limited = limitSankeyGraph(graph);
    const outIds = ids(limited).filter((id) => id.startsWith("OUT-"));
    expect(outIds).toEqual([
      "OUT-A",
      "OUT-B",
      "OUT-C",
      "OUT-D",
      "OUT-E",
      "OUT-F",
      "OUT-G",
      "OUT-H",
      "OUT-__other",
    ]);
    // Folded: I (100) and Food (50) with its sub-tag removed.
    expect(limited.links.find((l) => l.target === "OUT-__other")?.value).toBe(
      150,
    );
    expect(ids(limited)).not.toContain("OUT-SUB-Groceries");
    expect(limited.nodes.find((n) => n.id === "OUT-__other")?.label).toBe(
      "Others",
    );
  });

  it("does not fold at nine expense tags", () => {
    // Eight named tags plus the Food parent = nine expense tags.
    const limited = limitSankeyGraph(
      build([
        tx("INCOME", 10000, "Salary"),
        tx("EXPENSE", 50, "Groceries", "Food"),
        ...expenseTx([
          ["A", 800],
          ["B", 700],
          ["C", 600],
          ["D", 500],
          ["E", 400],
          ["F", 300],
          ["G", 200],
          ["H", 100],
        ]),
      ]),
    );

    expect(ids(limited)).not.toContain("OUT-__other");
    expect(
      limited.links.filter((l) => fromIncome(l) && l.target.startsWith("OUT-"))
        .length,
    ).toBe(9);
  });

  it("folds sub-tags past the four largest under their parent, right after its last kept sub", () => {
    // Home has six sub-tags (600..100), Travel two; Home is the largest parent.
    const graph = build([
      tx("INCOME", 10000, "Salary"),
      ...[600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("EXPENSE", amount, `S${i + 1}`, "Home"),
      ),
      tx("EXPENSE", 40, "T1", "Travel"),
      tx("EXPENSE", 30, "T2", "Travel"),
    ]);

    const limited = limitSankeyGraph(graph);
    const nodeIds = ids(limited);
    const other = "OUT-SUB-__other-OUT-Home";
    const lastKept = nodeIds.indexOf("OUT-SUB-S4");

    expect(nodeIds).not.toContain("OUT-SUB-S5");
    expect(nodeIds).not.toContain("OUT-SUB-S6");
    expect(nodeIds[lastKept + 1]).toBe(other);
    expect(limited.nodes[lastKept + 1]).toEqual({
      id: other,
      label: "Others",
      color: "#123456",
      parentId: "OUT-Home",
    });
    expect(nodeIds).toContain("OUT-SUB-T1");
    expect(nodeIds).toContain("OUT-SUB-T2");

    const linkAt = limited.links.findIndex((l) => l.target === other);
    expect(limited.links[linkAt]).toEqual({
      source: "OUT-Home",
      target: other,
      value: 300,
      color: "target",
    });
    expect(limited.links[linkAt - 1].target).toBe("OUT-SUB-S4");
  });

  it("folds income tags and income sub-tags with the same limits", () => {
    const incomeTx = (name: string, amount: number, parent?: string) =>
      tx("INCOME", amount, name, parent);
    const graph = build([
      ...[900, 800, 700, 600, 500, 400, 300, 200, 100].map((amount, i) =>
        incomeTx(`I${i + 1}`, amount),
      ),
      ...[500, 400, 300, 200, 100, 50].map((amount, i) =>
        incomeTx(`W${i + 1}`, amount, "Work"),
      ),
      tx("EXPENSE", 200, "Rent"),
    ]);

    const limited = limitSankeyGraph(graph);
    const nodeIds = ids(limited);

    // Nine income tags plus Work = ten: Work (1550) and I1..I7 are kept,
    // I8 (200) and I9 (100) fold into IN-__other.
    expect(nodeIds).toContain("IN-__other");
    expect(nodeIds).not.toContain("IN-I8");
    expect(nodeIds).not.toContain("IN-I9");
    expect(limited.links.find((l) => l.source === "IN-__other")).toEqual({
      source: "IN-__other",
      target: "Income",
      value: 300,
      color: "source",
    });
    expect(nodeIds[nodeIds.indexOf("IN-__other") + 1]).toBe("Income");

    // Work has six sub-tags: the two smallest fold under it.
    const other = "IN-SUB-__other-IN-Work";
    expect(nodeIds).toContain(other);
    expect(nodeIds).not.toContain("IN-SUB-W5");
    expect(nodeIds[nodeIds.indexOf("IN-SUB-W4") + 1]).toBe(other);
    expect(limited.links.find((l) => l.source === other)).toMatchObject({
      target: "IN-Work",
      value: 150,
      color: "source",
    });
  });

  it("keeps the Income totals on both sides and the tail node last", () => {
    const graph = build([
      ...[900, 800, 700, 600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("INCOME", amount, `I${i + 1}`),
      ),
      ...[500, 400, 300, 200, 100, 50].map((amount, i) =>
        tx("INCOME", amount, `W${i + 1}`, "Work"),
      ),
      ...[900, 800, 700, 600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("EXPENSE", amount, `E${i + 1}`),
      ),
      ...[600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("EXPENSE", amount, `S${i + 1}`, "Home"),
      ),
    ]);

    const limited = limitSankeyGraph(graph);

    expect(sumLinks(limited.links, fromIncome)).toBe(
      sumLinks(graph.links, fromIncome),
    );
    expect(sumLinks(limited.links, toIncome)).toBe(
      sumLinks(graph.links, toIncome),
    );
    expect(limited.nodes.at(-1)?.id).toBe(graph.nodes.at(-1)?.id);
  });

  it("keeps the surviving nodes in their original order", () => {
    const graph = build([
      tx("INCOME", 10000, "Salary"),
      ...[900, 800, 700, 600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("EXPENSE", amount, `E${i + 1}`),
      ),
      ...[600, 500, 400, 300, 200, 100].map((amount, i) =>
        tx("EXPENSE", amount, `S${i + 1}`, "Home"),
      ),
    ]);

    const limited = limitSankeyGraph(graph);
    const synthetic = (id: string) => id.includes("__other");
    const expected = ids(graph).filter((id) => ids(limited).includes(id));
    expect(ids(limited).filter((id) => !synthetic(id))).toEqual(expected);
  });
});
