import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const { sankeySpy, nodeSpy } = vi.hoisted(() => ({
  sankeySpy: vi.fn(),
  nodeSpy: vi.fn(),
}));

// The kit cannot lay out in jsdom: the chart stub records its data and renders
// its config children so the node/link/tooltip props are captured too.
vi.mock("@/components/ui/charts", async () => {
  const { createElement } = await import("react");
  return {
    SankeyChart: (props: { data: unknown; children?: unknown }) => {
      sankeySpy(props);
      return createElement("div", null, props.children as never);
    },
    SankeyNode: (props: Record<string, unknown>) => {
      nodeSpy(props);
      return null;
    },
    SankeyLink: () => null,
    SankeyTooltip: () => null,
  };
});

vi.mock("../../../utils/ThemeContext", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

import { CashFlowSankey } from "../../../dashboard/statistics/CashFlowSankey";

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

const lastSankeyData = () =>
  (
    sankeySpy.mock.lastCall?.[0] as {
      data: { nodes: { name: string }[]; links: unknown[] };
    }
  ).data;
const lastNodeProps = () =>
  nodeSpy.mock.lastCall?.[0] as {
    getNodeColor: (node: unknown, index: number) => string;
    formatValue: (value: number) => string;
  };

describe("CashFlowSankey (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    sankeySpy.mockClear();
    nodeSpy.mockClear();
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("passes the kit index-based nodes and links built from the same graph", () => {
    render(
      <CashFlowSankey
        transactions={[
          tx("INCOME", 1000, "Salary"),
          tx("EXPENSE", 750, "Rent"),
        ]}
      />,
    );

    const data = lastSankeyData();
    expect(data.nodes.map((n) => n.name)).toEqual([
      "Salary",
      "Income",
      "Rent",
      "Savings",
    ]);
    expect(data.links).toEqual([
      { source: 0, target: 1, value: 1000 },
      { source: 1, target: 2, value: 750 },
      { source: 1, target: 3, value: 250 },
    ]);
  });

  it("colours nodes with the v2 tokens and formats values in euro", () => {
    render(
      <CashFlowSankey
        transactions={[
          tx("INCOME", 1000, "Salary"),
          tx("EXPENSE", 750, "Rent"),
        ]}
      />,
    );

    const { getNodeColor, formatValue } = lastNodeProps();
    expect(getNodeColor(undefined, 0)).toBe("var(--color-app-income)");
    expect(getNodeColor(undefined, 2)).toBe("#123456");
    expect(formatValue(1234.5)).toBe("1234,50 €");
  });

  it("has no savings summary line under the chart", () => {
    render(
      <CashFlowSankey
        transactions={[
          tx("INCOME", 1000, "Salary"),
          tx("EXPENSE", 750, "Rent"),
        ]}
      />,
    );

    expect(screen.queryByText(/Saved 25% of income/)).not.toBeInTheDocument();
    expect(screen.getByText("Cash flow overview")).toBeInTheDocument();
  });

  it("paints the deficit with the expense mark", () => {
    render(
      <CashFlowSankey
        transactions={[tx("INCOME", 500, "Salary"), tx("EXPENSE", 700, "Rent")]}
      />,
    );

    expect(screen.queryByText(/more than earned/)).not.toBeInTheDocument();
    const deficit = lastSankeyData().nodes.findIndex(
      (n) => n.name === "Deficit",
    );
    expect(deficit).toBeGreaterThanOrEqual(0);
    expect(lastNodeProps().getNodeColor(undefined, deficit)).toBe(
      "var(--color-app-expense-mark)",
    );
  });

  it("compacts the graph on phones: no sub-tags, small expenses folded into Others", () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({ ...original(query), matches: true }) as MediaQueryList;
    try {
      const expenses = ["A", "B", "C", "D", "E", "F", "G"].map((name, i) =>
        tx("EXPENSE", 700 - i * 100, name),
      );
      render(
        <CashFlowSankey
          transactions={[
            tx("INCOME", 5000, "Salary"),
            tx("EXPENSE", 50, "Groceries", "Food"),
            ...expenses,
          ]}
        />,
      );

      const names = lastSankeyData().nodes.map((n) => n.name);
      expect(names).not.toContain("Groceries");
      expect(names).not.toContain("Food");
      expect(names).toContain("Others");
      expect(names.filter((n) => n === "Others")).toHaveLength(1);
    } finally {
      window.matchMedia = original;
    }
  });

  it("folds the smallest expense tags into Others on desktop", () => {
    const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    render(
      <CashFlowSankey
        transactions={[
          tx("INCOME", 9000, "Salary"),
          ...names.map((name, i) => tx("EXPENSE", 1000 - i * 50, name)),
        ]}
      />,
    );

    const nodeNames = lastSankeyData().nodes.map((n) => n.name);
    expect(nodeNames.filter((n) => n === "Others")).toHaveLength(1);
    expect(nodeNames).toContain("A");
    expect(nodeNames).not.toContain("I");
    expect(nodeNames).not.toContain("J");
  });

  it("renders nothing when there is no income or expense", () => {
    const { container } = render(<CashFlowSankey transactions={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(sankeySpy).not.toHaveBeenCalled();
  });
});
