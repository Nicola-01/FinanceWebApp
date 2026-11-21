import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Transaction } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const { sankeySpy } = vi.hoisted(() => ({ sankeySpy: vi.fn() }));

// The kit cannot lay out in jsdom: the chart stub records the graph it is given.
vi.mock("@/components/ui/charts", async () => {
  const { createElement } = await import("react");
  return {
    SankeyChart: (props: { data: unknown; children?: unknown }) => {
      sankeySpy(props);
      return createElement("div", null, props.children as never);
    },
    SankeyNode: () => null,
    SankeyLink: () => null,
    SankeyTooltip: () => null,
  };
});

vi.mock("../../../utils/ThemeContext", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

import { CashFlowSankey } from "../../../dashboard/statistics/CashFlowSankey";

const KEY = "statistics.cashFlow.showInvestments";

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  name: string,
): Transaction => ({
  id: `${type}-${name}-${amount}`,
  name: "tx",
  tag: { name, icon: "tag", colorHex: "#123456" },
  amount,
  transactionDate: "2024-01-01T12:00:00",
  type,
});

const flows = [
  tx("INCOME", 1000, "Salary"),
  tx("EXPENSE", 750, "Rent"),
  tx("EXPENSE", 200, "ETF"),
];
const investmentTags = new Set(["ETF"]);

const lastNodeNames = () =>
  (
    sankeySpy.mock.lastCall?.[0] as { data: { nodes: { name: string }[] } }
  ).data.nodes.map((n) => n.name);
const chip = () => screen.queryByRole("switch", { name: /Investments/ });

describe("CashFlowSankey investments toggle (v2)", () => {
  beforeEach(() => {
    localStorage.clear();
    setUiVersion("v2");
    sankeySpy.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    setUiVersion("v1");
  });

  it("hides the chip and keeps the graph when no tag is an investment", () => {
    render(<CashFlowSankey transactions={flows} investmentTags={new Set()} />);

    expect(chip()).toBeNull();
    expect(lastNodeNames()).toEqual(
      expect.arrayContaining(["Rent", "ETF", "Liquidity left"]),
    );
    expect(lastNodeNames()).not.toContain("Invested");
  });

  it("is off by default: no Invested branch and no investment leak into the flows", () => {
    render(
      <CashFlowSankey transactions={flows} investmentTags={investmentTags} />,
    );

    expect(chip()).toHaveAttribute("aria-checked", "false");
    expect(lastNodeNames()).not.toContain("Invested");
    expect(lastNodeNames()).not.toContain("ETF");
    // Savings = Income - Spent (ETF's 200 is not spent): 1000 - 750.
    const { nodes, links } = (
      sankeySpy.mock.lastCall?.[0] as {
        data: {
          nodes: { name: string }[];
          links: { target: number; value: number }[];
        };
      }
    ).data;
    const liquidity = nodes.findIndex((n) => n.name === "Liquidity left");
    expect(links).toContainEqual(
      expect.objectContaining({ target: liquidity, value: 250 }),
    );
  });

  it("turning the chip on restores the Invested branch and persists the choice", async () => {
    render(
      <CashFlowSankey transactions={flows} investmentTags={investmentTags} />,
    );

    await userEvent.click(chip()!);

    expect(chip()).toHaveAttribute("aria-checked", "true");
    expect(lastNodeNames()).toEqual(
      expect.arrayContaining(["Invested", "ETF"]),
    );
    expect(localStorage.getItem(KEY)).toBe("true");
  });

  it("restores the persisted on state on mount", () => {
    localStorage.setItem(KEY, "true");
    render(
      <CashFlowSankey transactions={flows} investmentTags={investmentTags} />,
    );

    expect(chip()).toHaveAttribute("aria-checked", "true");
    expect(lastNodeNames()).toContain("Invested");
  });

  it("keeps the chip when switching off leaves nothing to draw", async () => {
    render(
      <CashFlowSankey
        transactions={[tx("EXPENSE", 200, "ETF")]}
        investmentTags={investmentTags}
      />,
    );

    await userEvent.click(chip()!);
    expect(chip()).toHaveAttribute("aria-checked", "true");
    await userEvent.click(chip()!);
    expect(chip()).toHaveAttribute("aria-checked", "false");
  });
});
