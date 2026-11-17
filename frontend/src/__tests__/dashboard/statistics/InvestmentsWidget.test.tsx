import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { formatAmount } from "../../../utils/format.ts";

vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => new Set(["PAC"]),
}));

// Record what each kit component receives; render children so the tree stays real.
const { calls, record } = vi.hoisted(() => {
  const calls: Record<string, Record<string, unknown>[]> = {};
  const record = (name: string, props: Record<string, unknown>) => {
    (calls[name] ??= []).push(props);
    return null;
  };
  return { calls, record };
});

vi.mock("@/components/ui/charts", () => ({
  curveMonotoneX: "monotoneX",
  ComposedChart: (props: { children?: React.ReactNode }) => (
    <div data-testid="composed">
      {record("ComposedChart", props as Record<string, unknown>)}
      {props.children}
    </div>
  ),
  SeriesBar: (p: Record<string, unknown>) => record("SeriesBar", p),
  Line: (p: Record<string, unknown>) => record("Line", p),
  Grid: (p: Record<string, unknown>) => record("Grid", p),
  XAxis: (p: Record<string, unknown>) => record("XAxis", p),
  YAxis: (p: Record<string, unknown>) => record("YAxis", p),
  ChartTooltip: (p: Record<string, unknown>) => record("ChartTooltip", p),
  TooltipContent: (p: Record<string, unknown>) => record("TooltipContent", p),
}));

import {
  ChartTooltip,
  Line,
  SeriesBar,
  TooltipContent,
} from "@/components/ui/charts";
import { InvestmentsWidget } from "../../../dashboard/statistics/InvestmentsWidget.tsx";

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  tagName: string,
  transactionDate = "2026-01-10T12:00:00",
): Transaction => ({
  id: `${type}-${tagName}-${amount}-${transactionDate}`,
  name: "tx",
  tag: { name: tagName, icon: "tag", colorHex: "#123456" },
  amount,
  transactionDate,
  type,
});

const last = (name: string) => calls[name].at(-1)!;

/** Props of the direct children of a recorded ComposedChart, filtered by kit component. */
const kids = (chart: Record<string, unknown>, type: unknown) =>
  React.Children.toArray(chart.children as React.ReactNode)
    .filter(
      (c): c is React.ReactElement<Record<string, unknown>> =>
        React.isValidElement(c) && c.type === type,
    )
    .map((c) => c.props);

/** The base chart is recorded first, the transparent overlay second. */
const baseAndOverlay = () => {
  const [base, overlay] = calls.ComposedChart;
  return { base, overlay };
};

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
});

describe("InvestmentsWidget", () => {
  it("renders nothing when the period has no investment transactions", () => {
    const { container } = render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 50, "Food")]}
        period={{ kind: "year", year: 2026 }}
        currencySymbol="€"
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(calls.ComposedChart).toBeUndefined();
  });

  it("shows the title, the facts row and the per-tag breakdown", () => {
    render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 400, "PAC"), tx("INCOME", 100, "PAC")]}
        period={{ kind: "year", year: 2026 }}
        currencySymbol="€"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Investments" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bought")).toBeInTheDocument();
    expect(screen.getByText("cashed out")).toBeInTheDocument();
    expect(screen.getByText("invested net")).toBeInTheDocument();
    expect(screen.getByText("PAC")).toBeInTheDocument();
  });

  it("draws bought up and cashed out down on their own axis, stacked per month", () => {
    render(
      <InvestmentsWidget
        transactions={[
          tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00"),
          tx("INCOME", 100, "PAC", "2025-01-20T12:00:00"),
        ]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    const { base } = baseAndOverlay();
    expect(base.stacked).toBe(true);
    expect(base.xDataKey).toBe("date");
    expect(kids(base, SeriesBar).map((p) => [p.dataKey, p.yAxisId])).toEqual([
      ["bought", undefined],
      ["cashedBelow", "cashed"],
    ]);
    expect(kids(base, SeriesBar)[0].fill).toBe("var(--color-app-invest)");
    expect(kids(base, SeriesBar)[1].fill).toContain("var(--color-app-invest)");

    // Cashed out hangs below zero; a full year of steps, one per month.
    const jan = (base.data as Record<string, unknown>[])[0];
    expect(jan).toMatchObject({
      bought: 400,
      cashedOut: 100,
      cashedBelow: -100,
    });
    expect(base.data as unknown[]).toHaveLength(12);
  });

  it("sizes one symmetric domain over the bars and the running total", () => {
    render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00")]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    const { base, overlay } = baseAndOverlay();
    // Peak is 400 (bought); 10% headroom.
    for (const chart of [base, overlay]) {
      const { left, cashed } = chart.yDomains as Record<
        string,
        [number, number]
      >;
      for (const [lo, hi] of [left, cashed]) {
        expect(lo).toBeCloseTo(-440);
        expect(hi).toBeCloseTo(440);
      }
    }
  });

  it("runs the running total as a dashed line on the transparent overlay", () => {
    render(
      <InvestmentsWidget
        transactions={[
          tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00"),
          tx("INCOME", 100, "PAC", "2025-02-10T12:00:00"),
        ]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    const { base, overlay } = baseAndOverlay();
    expect(kids(base, Line)).toEqual([]);
    expect(kids(overlay, SeriesBar).map((p) => p.fill)).toEqual([
      "transparent",
      "transparent",
    ]);
    expect(kids(overlay, Line)).toEqual([
      expect.objectContaining({
        dataKey: "cumulative",
        label: "Invested so far",
        stroke: "var(--color-app-text)",
        showMarkers: false,
        curve: "monotoneX",
        dashFromIndex: 1,
      }),
    ]);
    // Running total: Jan +400, Feb +300.
    const data = base.data as Record<string, unknown>[];
    expect(data[0].cumulative).toBe(400);
    expect(data[1].cumulative).toBe(300);
  });

  it("labels the x axis by month in month mode and by year in all-time mode", () => {
    const { unmount } = render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00")]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    expect(last("XAxis")).toMatchObject({
      numTicks: 12,
      tickMode: "data",
    });
    expect((last("XAxis").labels as string[])[0]).toBe("Jan");
    unmount();

    render(
      <InvestmentsWidget
        transactions={[
          tx("EXPENSE", 400, "PAC", "2024-03-10T12:00:00"),
          tx("INCOME", 100, "PAC", "2025-03-10T12:00:00"),
        ]}
        period={{ kind: "all" }}
        currencySymbol="€"
      />,
    );
    expect(last("XAxis").labels).toEqual(["2024", "2025"]);
  });

  it("formats tooltip rows: bought, cashed out, signed running total", () => {
    render(
      <InvestmentsWidget
        transactions={[
          tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00"),
          tx("INCOME", 100, "PAC", "2025-02-10T12:00:00"),
        ]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    const tooltip = last("ChartTooltip");
    expect(tooltip.dateLabels).toHaveLength(12);
    const rowsOf = tooltip.rows as (p: Record<string, unknown>) => {
      label: string;
      value: string;
    }[];
    const feb = (baseAndOverlay().base.data as Record<string, unknown>[])[1];
    expect(rowsOf(feb).map((r) => [r.label, r.value])).toEqual([
      ["Bought", `${formatAmount(0)} €`],
      ["Cashed out", `${formatAmount(100)} €`],
      ["Invested so far", `+${formatAmount(300)} €`],
    ]);

    const content = tooltip.content as (p: {
      point: Record<string, unknown>;
      index: number;
    }) => React.ReactElement<{ title: string; rows: unknown[] }>;
    const el = content({ point: { ...feb }, index: 1 });
    expect(el.type).toBe(TooltipContent);
    expect(el.props.title).toBe("Feb 2025");
  });

  it("lists the legend entries for bought, cashed out and the running total", () => {
    render(
      <InvestmentsWidget
        transactions={[
          tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00"),
          tx("INCOME", 100, "PAC", "2025-02-10T12:00:00"),
        ]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    expect(screen.getByText("Bought")).toBeInTheDocument();
    expect(screen.getByText("Cashed out")).toBeInTheDocument();
    expect(screen.getByText("Invested so far")).toBeInTheDocument();
  });

  it("keeps the tooltip on the base chart only", () => {
    render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 400, "PAC", "2025-01-10T12:00:00")]}
        period={{ kind: "year", year: 2025 }}
        currencySymbol="€"
      />,
    );
    const { base, overlay } = baseAndOverlay();
    expect(kids(base, ChartTooltip)).toHaveLength(1);
    expect(kids(overlay, ChartTooltip)).toEqual([]);
  });
});
