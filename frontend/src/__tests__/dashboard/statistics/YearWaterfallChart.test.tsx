import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { WaterfallRow } from "../../../dashboard/statistics/statsChartRows.ts";
import { compactAmount } from "../../../dashboard/statistics/kitChartData.ts";

// Record what the waterfall kit receives; render children so the tree stays real.
const { calls, record } = vi.hoisted(() => {
  const calls: Record<string, Record<string, unknown>[]> = {};
  const record = (name: string, props: Record<string, unknown>) => {
    (calls[name] ??= []).push(props);
    return null;
  };
  return { calls, record };
});

vi.mock("@/components/ui/charts", () => ({
  WaterfallChart: (props: { children?: React.ReactNode }) => (
    <div data-testid="waterfall">
      {record("WaterfallChart", props as Record<string, unknown>)}
      {props.children}
    </div>
  ),
  Waterfall: (p: Record<string, unknown>) => record("Waterfall", p),
  Grid: (p: Record<string, unknown>) => record("Grid", p),
  BarXAxis: (p: Record<string, unknown>) => record("BarXAxis", p),
  BarYAxis: (p: Record<string, unknown>) => record("BarYAxis", p),
  ChartTooltip: (p: Record<string, unknown>) => record("ChartTooltip", p),
}));

vi.mock("../../../dashboard/statistics/useChartPalette.ts", () => ({
  useChartPalette: () => ({
    isV2: true,
    income: "#income",
    expense: "#expense",
    balance: "#balance",
    grid: "",
    axis: "",
    warn: "#warn",
    danger: "#danger",
    subscription: "#subscription",
    neutral: "#neutral",
  }),
}));

import { YearWaterfallChart } from "../../../dashboard/statistics/YearWaterfallChart.tsx";

const rows: WaterfallRow[] = [
  { label: "Start", value: 1000, total: true },
  { label: "Jan", value: 250.4 },
  { label: "Feb", value: -1234.4 },
  { label: "Now", total: true },
];

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
});

const last = (name: string) => calls[name].at(-1)!;

describe("YearWaterfallChart", () => {
  it("uses the month title and sub-line by default", () => {
    render(
      <YearWaterfallChart rows={rows} byYear={false} currencySymbol="€" />,
    );
    expect(screen.getByText("How the year added up")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start of the year, each month's net, where you are now.",
      ),
    ).toBeInTheDocument();
  });

  it("uses the year title and sub-line when byYear is set", () => {
    render(<YearWaterfallChart rows={rows} byYear={true} currencySymbol="€" />);
    expect(screen.getByText("How the years added up")).toBeInTheDocument();
    expect(
      screen.getByText("Each year's net and where you are now."),
    ).toBeInTheDocument();
  });

  it("passes the rows and the chart frame to WaterfallChart", () => {
    render(
      <YearWaterfallChart rows={rows} byYear={false} currencySymbol="€" />,
    );
    expect(last("WaterfallChart")).toMatchObject({
      data: rows,
      xDataKey: "label",
      aspectRatio: "3 / 1",
      margin: { top: 24, right: 12, bottom: 28, left: 44 },
      ariaLabel: "Balance at the start, each period's net, and now",
    });
  });

  it("maps the palette to the waterfall fills and enables connectors and values", () => {
    render(
      <YearWaterfallChart rows={rows} byYear={false} currencySymbol="€" />,
    );
    expect(last("Waterfall")).toMatchObject({
      dataKey: "value",
      totalKey: "total",
      positiveFill: "#income",
      negativeFill: "#expense",
      totalFill: "#neutral",
      showConnectors: true,
      showValues: true,
      radius: 4,
    });
  });

  it("renders the grid, both axes and the tooltip inside the chart", () => {
    render(
      <YearWaterfallChart rows={rows} byYear={false} currencySymbol="€" />,
    );
    expect(last("Grid")).toMatchObject({ horizontal: true });
    expect(last("BarXAxis")).toMatchObject({ showAllLabels: true });
    expect(last("BarYAxis")).toMatchObject({ numTicks: 4 });
    expect(last("BarYAxis").formatValue).toBe(compactAmount);
    expect(last("ChartTooltip")).toEqual({});
  });

  it("formats positive, negative and rounded values with the currency symbol", () => {
    render(
      <YearWaterfallChart rows={rows} byYear={false} currencySymbol="€" />,
    );
    const fmt = last("Waterfall").formatValue as (v: number) => string;
    // it-IT does not group four-digit numbers (CLDR minimum grouping digits = 2).
    expect(fmt(1234.6)).toBe("1235 €");
    expect(fmt(-1234.4)).toBe("−1234 €");
    expect(fmt(12345.6)).toBe("12.346 €");
    expect(fmt(250.4)).toBe("250 €");
  });

  it("renders the no-data state when every value is zero or missing", () => {
    render(
      <YearWaterfallChart
        rows={[
          { label: "Start", value: 0, total: true },
          { label: "Jan", value: 0 },
          { label: "Now", total: true },
        ]}
        byYear={false}
        currencySymbol="€"
      />,
    );
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.WaterfallChart).toBeUndefined();
  });

  it("renders the no-data state instead of the chart when there are no rows", () => {
    render(<YearWaterfallChart rows={[]} byYear={true} currencySymbol="€" />);
    expect(screen.getByText("How the years added up")).toBeInTheDocument();
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.WaterfallChart).toBeUndefined();
  });
});
