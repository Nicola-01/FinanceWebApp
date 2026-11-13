import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeContext } from "../../../utils/ThemeContext.tsx";
import { TooltipContent } from "@/components/ui/charts";
import { BalanceProjectionChart } from "../../../dashboard/statistics/BalanceProjectionChart.tsx";

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
  LineChart: (props: { children?: React.ReactNode; data: unknown }) => (
    <div data-testid="line-chart">
      {record("LineChart", props as Record<string, unknown>)}
      {props.children}
    </div>
  ),
  Band: (p: Record<string, unknown>) => record("Band", p),
  Line: (p: Record<string, unknown>) => record("Line", p),
  Grid: (p: Record<string, unknown>) => record("Grid", p),
  XAxis: (p: Record<string, unknown>) => record("XAxis", p),
  YAxis: (p: Record<string, unknown>) => record("YAxis", p),
  ChartTooltip: (p: Record<string, unknown>) => record("ChartTooltip", p),
  TooltipContent: (p: Record<string, unknown>) => record("TooltipContent", p),
}));

const withTheme = (ui: React.ReactElement) => (
  <ThemeContext.Provider
    value={{ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }}
  >
    {ui}
  </ThemeContext.Provider>
);

const last = (name: string) => calls[name].at(-1)!;

/** Date of the last plotted row, i.e. the projection's end month. */
const endDate = () => (last("LineChart").data as { date: Date }[]).at(-1)!.date;

/** Monthly history starting January of `year`; balance grows by `step` each month. */
const monthly = (count: number, step: number, year = 2025) =>
  Array.from({ length: count }, (_, i) => ({
    date: new Date(year, i, 1),
    balance: 1000 + step * i,
  }));

// Three months of +100: pace 100, last balance 1200.
const threeMonths = monthly(3, 100, 2026);

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
});

describe("BalanceProjectionChart", () => {
  it("renders nothing with fewer than 3 months of history", () => {
    const { container } = render(
      withTheme(
        <BalanceProjectionChart history={monthly(2, 100)} currencySymbol="€" />,
      ),
    );
    expect(container).toBeEmptyDOMElement();
    expect(calls.LineChart).toBeUndefined();
  });

  it("states the pace, the end balance, the month and the likely range", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    // 1y horizon from Mar 2026 → Mar 2027: end 1200 + 12 * 100 = 2400,
    // band 1.28 * 10 * sqrt(12) ≈ 44 each side.
    expect(screen.getByText(/usual pace/)).toHaveTextContent(
      "At your usual pace of +100 € a month you'd have about 2400 € by Mar 2027 (likely 2356 € – 2444 €).",
    );
    expect(screen.getByText("Where you're heading")).toBeInTheDocument();
  });

  it("re-computes the projection when the horizon changes", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    expect(endDate()).toEqual(new Date(2027, 2, 1));

    fireEvent.click(screen.getByRole("button", { name: "5 years" }));
    expect(endDate()).toEqual(new Date(2031, 2, 1));
    expect(screen.getByText(/usual pace/)).toHaveTextContent("by Mar 2031");

    fireEvent.click(screen.getByRole("button", { name: "End of year" }));
    expect(endDate()).toEqual(new Date(2026, 11, 1));
  });

  it("shows only the last 12 history months, followed by the projection", () => {
    // 15 months (Jan 2025 – Mar 2026) + 12-month horizon.
    render(
      withTheme(
        <BalanceProjectionChart
          history={monthly(15, 100)}
          currencySymbol="€"
        />,
      ),
    );
    const data = last("LineChart").data as { date: Date; balance?: number }[];
    expect(data).toHaveLength(12 + 12);
    expect(data[0].date).toEqual(new Date(2025, 3, 1));
    expect(data[11].balance).toBe(1000 + 100 * 14);
    expect(data[12].balance).toBeUndefined();
    expect(data[11].value).toBe(data[11].balance);
    expect(data[12].value).toBe(data[12].projected);
  });

  it("draws one value series, dashed from the last real row", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    const data = last("LineChart").data as {
      balance?: number;
      projected?: number;
      value?: number;
    }[];
    // Every row carries a value: the balance while real, the projection after.
    expect(data.every((r) => r.value !== undefined)).toBe(true);
    expect(data[2]).toMatchObject({ balance: 1200, value: 1200 });
    expect(data[3].value).toBe(data[3].projected);

    expect(last("Line")).toMatchObject({
      dataKey: "value",
      dashFromIndex: 2,
      dashArray: "6,4",
    });
    expect(calls.ProjectionLine).toBeUndefined();
  });

  it("titles the tooltip with the month and year", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    const content = last("ChartTooltip").content as (p: {
      point: Record<string, unknown>;
      index: number;
    }) => React.ReactElement<{ title: string; rows: unknown[] }>;
    const el = content({
      point: {
        date: new Date(2026, 5, 1),
        projected: 1600,
        low: 1560,
        high: 1640,
      },
      index: 5,
    });
    expect(el.type).toBe(TooltipContent);
    expect(el.props.title).toBe("Jun 2026");
    expect(el.props.rows).toHaveLength(2);
  });

  it("builds tooltip rows for real and projected points", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    const tooltipRows = last("ChartTooltip").rows as (
      p: Record<string, unknown>,
    ) => { color: string; label: string; value: string }[];

    const real = tooltipRows({ date: new Date(2026, 2, 1), balance: 1200 });
    expect(real.map((r) => [r.label, r.value])).toEqual([
      ["Balance", "1200 €"],
    ]);

    const projected = tooltipRows({
      date: new Date(2026, 5, 1),
      projected: 1600,
      low: 1560,
      high: 1640,
    });
    expect(projected.map((r) => [r.label, r.value])).toEqual([
      ["Projected", "1600 €"],
      ["Likely", "1560 € – 1640 €"],
    ]);

    const stroke = last("Line").stroke;
    expect(last("Line").curve).toBe("monotoneX");
    expect([...real, ...projected].every((r) => r.color === stroke)).toBe(true);
  });

  it("passes the month labels to the tooltip and renders the legend", () => {
    render(
      withTheme(
        <BalanceProjectionChart history={threeMonths} currencySymbol="€" />,
      ),
    );
    expect(last("ChartTooltip").dateLabels).toEqual([
      "Jan 2026",
      "Feb 2026",
      "Mar 2026",
      "Apr 2026",
      "May 2026",
      "Jun 2026",
      "Jul 2026",
      "Aug 2026",
      "Sep 2026",
      "Oct 2026",
      "Nov 2026",
      "Dec 2026",
      "Jan 2027",
      "Feb 2027",
      "Mar 2027",
    ]);
    expect(screen.getByText("Projection")).toBeInTheDocument();
    expect(screen.getByText("Likely range")).toBeInTheDocument();
    expect(last("Band")).toMatchObject({
      lowerKey: "low",
      upperKey: "high",
      showInTooltip: false,
    });
  });
});
