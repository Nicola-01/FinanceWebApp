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

  it("shows the savings rate under the chart", () => {
    render(
      <CashFlowSankey
        transactions={[
          tx("INCOME", 1000, "Salary"),
          tx("EXPENSE", 750, "Rent"),
        ]}
      />,
    );

    expect(screen.getByText("Saved 25% of income")).toBeInTheDocument();
    expect(screen.getByText("Cash flow overview")).toBeInTheDocument();
  });

  it("reports the overspend and paints the deficit with the expense mark", () => {
    render(
      <CashFlowSankey
        transactions={[tx("INCOME", 500, "Salary"), tx("EXPENSE", 700, "Rent")]}
      />,
    );

    expect(
      screen.getByText("Spent 200,00 € more than earned"),
    ).toBeInTheDocument();
    const deficit = lastSankeyData().nodes.findIndex(
      (n) => n.name === "Deficit",
    );
    expect(deficit).toBeGreaterThanOrEqual(0);
    expect(lastNodeProps().getNodeColor(undefined, deficit)).toBe(
      "var(--color-app-expense-mark)",
    );
  });

  it("renders nothing when there is no income or expense", () => {
    const { container } = render(<CashFlowSankey transactions={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(sankeySpy).not.toHaveBeenCalled();
  });
});
