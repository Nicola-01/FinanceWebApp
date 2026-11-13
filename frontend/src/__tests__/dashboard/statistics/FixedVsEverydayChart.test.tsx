import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { formatAmount } from "../../../utils/format.ts";
import type { FixedEverydayRow } from "../../../dashboard/statistics/statsChartRows.ts";

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
  ComposedChart: (props: { children?: React.ReactNode }) => (
    <div data-testid="composed">
      {record("ComposedChart", props as Record<string, unknown>)}
      {props.children}
    </div>
  ),
  SeriesBar: (p: Record<string, unknown>) => record("SeriesBar", p),
  Grid: (p: Record<string, unknown>) => record("Grid", p),
  XAxis: (p: Record<string, unknown>) => record("XAxis", p),
  YAxis: (p: Record<string, unknown>) => record("YAxis", p),
  ChartTooltip: (p: Record<string, unknown>) => record("ChartTooltip", p),
  TooltipContent: (p: Record<string, unknown>) => record("TooltipContent", p),
}));

// Pin the series colours so the assertions name them directly.
vi.mock("../../../dashboard/statistics/useChartPalette.ts", () => ({
  useChartPalette: () => ({
    subscription: "#sub",
    expense: "#exp",
    neutral: "#neu",
  }),
}));

import { TooltipContent } from "@/components/ui/charts";
import { FixedVsEverydayChart } from "../../../dashboard/statistics/FixedVsEverydayChart.tsx";

const last = (name: string) => calls[name].at(-1)!;

const monthRows: FixedEverydayRow[] = [
  {
    date: new Date(2024, 8, 1),
    subscriptions: 100,
    everyday: 300,
    everydayCapped: 300,
  },
  {
    date: new Date(2024, 9, 1),
    subscriptions: 100,
    everyday: 900,
    everydayCapped: 400,
    overflow: "10k ↑",
  },
];

const yearRows: FixedEverydayRow[] = [
  {
    date: new Date(2023, 0, 1),
    subscriptions: 1200,
    everyday: 3000,
    everydayCapped: 3000,
  },
  {
    date: new Date(2024, 0, 1),
    subscriptions: 1200,
    everyday: 0,
    everydayCapped: 0,
  },
];

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
});

describe("FixedVsEverydayChart", () => {
  it("stacks the subscription and everyday bars on one axis in that order", () => {
    render(
      <FixedVsEverydayChart
        rows={monthRows}
        byYear={false}
        currencySymbol="€"
      />,
    );
    const composed = last("ComposedChart");
    expect(composed).toMatchObject({
      xDataKey: "date",
      stacked: true,
      aspectRatio: "3 / 1",
      maxBarSize: 32,
      ariaLabel: "Subscriptions and everyday spending per month",
    });
    expect(composed.data).toBe(monthRows);

    expect(
      calls.SeriesBar.map((p) => [p.dataKey, p.label, p.fill, p.radius]),
    ).toEqual([
      ["subscriptions", "Subscriptions", "#sub", undefined],
      ["everydayCapped", "Everyday", "#exp", 4],
    ]);
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Everyday")).toBeInTheDocument();
  });

  it("draws the cut slot with an overflow tick label", () => {
    render(
      <FixedVsEverydayChart
        rows={monthRows}
        byYear={false}
        currencySymbol="€"
      />,
    );
    expect(last("XAxis")).toMatchObject({
      numTicks: 2,
      tickMode: "data",
      labels: ["Sep", "Oct 10k ↑"],
    });
    expect(last("YAxis").formatValue).toBeTypeOf("function");
  });

  it("shows the real everyday and the total in the tooltip, not the capped bar", () => {
    render(
      <FixedVsEverydayChart
        rows={monthRows}
        byYear={false}
        currencySymbol="€"
      />,
    );
    expect(last("ChartTooltip").dateLabels).toEqual(["Sep 2024", "Oct 2024"]);
    const rows = (
      last("ChartTooltip").rows as (p: Record<string, unknown>) => {
        label: string;
        value: string;
      }[]
    )(monthRows[1] as unknown as Record<string, unknown>);
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ["Subscriptions", `${formatAmount(100)} €`],
      ["Everyday", `${formatAmount(900)} €`],
      ["Total", `${formatAmount(1000)} €`],
    ]);
  });

  it("titles the tooltip with the month and year, or the year alone when byYear", () => {
    const { unmount } = render(
      <FixedVsEverydayChart
        rows={monthRows}
        byYear={false}
        currencySymbol="€"
      />,
    );
    const content = last("ChartTooltip").content as (p: {
      point: Record<string, unknown>;
      index: number;
    }) => React.ReactElement<{ title: string; rows: unknown[] }>;
    const el = content({ point: { ...monthRows[1] }, index: 1 });
    expect(el.type).toBe(TooltipContent);
    expect(el.props.title).toBe("Oct 2024");
    expect(el.props.rows).toHaveLength(3);
    unmount();

    render(
      <FixedVsEverydayChart rows={yearRows} byYear={true} currencySymbol="$" />,
    );
    expect(
      (last("ChartTooltip").content as typeof content)({
        point: { ...yearRows[0] },
        index: 0,
      }).props.title,
    ).toBe("2023");
  });

  it("labels by year when byYear is set", () => {
    render(
      <FixedVsEverydayChart rows={yearRows} byYear={true} currencySymbol="$" />,
    );
    expect(last("XAxis").labels).toEqual(["2023", "2024"]);
    expect(last("ChartTooltip").dateLabels).toEqual(["2023", "2024"]);
  });

  it("shows the no-data copy when there are no rows or every row is zero", () => {
    const { unmount } = render(
      <FixedVsEverydayChart rows={[]} byYear={false} currencySymbol="€" />,
    );
    expect(screen.getByText("Fixed vs everyday")).toBeInTheDocument();
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.ComposedChart).toBeUndefined();
    unmount();

    render(
      <FixedVsEverydayChart
        rows={[
          {
            date: new Date(2024, 0, 1),
            subscriptions: 0,
            everyday: 0,
            everydayCapped: 0,
          },
        ]}
        byYear={false}
        currencySymbol="€"
      />,
    );
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.ComposedChart).toBeUndefined();
  });
});
