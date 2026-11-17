import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeContext } from "../../../utils/ThemeContext.tsx";
import { formatAmount } from "../../../utils/format.ts";
import { setUiVersion } from "../../../utils/uiVersion.ts";
import type { MonthByMonthRow } from "../../../dashboard/statistics/statsChartRows.ts";

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
  Scatter: (p: Record<string, unknown>) => record("Scatter", p),
  Grid: (p: Record<string, unknown>) => record("Grid", p),
  XAxis: (p: Record<string, unknown>) => record("XAxis", p),
  YAxis: (p: Record<string, unknown>) => record("YAxis", p),
  ChartTooltip: (p: Record<string, unknown>) => record("ChartTooltip", p),
  TooltipContent: (p: Record<string, unknown>) => record("TooltipContent", p),
}));

import {
  ChartTooltip,
  Line,
  Scatter,
  SeriesBar,
  TooltipContent,
} from "@/components/ui/charts";
import { MonthByMonthChart } from "../../../dashboard/statistics/MonthByMonthChart.tsx";

const monthRows: MonthByMonthRow[] = [
  { date: new Date(2026, 0, 1), income: 1000, expense: -300, kept: 700 },
  { date: new Date(2026, 1, 1), income: 500, expense: -800, kept: -300 },
  { date: new Date(2026, 2, 1) }, // future month: no amounts
];

const yearRows: MonthByMonthRow[] = [
  { date: new Date(2024, 0, 1), income: 4000, expense: -2000, kept: 2000 },
  { date: new Date(2025, 0, 1), income: 3000, expense: -3500, kept: -500 },
];

const investRows: MonthByMonthRow[] = [
  {
    date: new Date(2026, 0, 1),
    income: 1000,
    expense: -300,
    kept: 700,
    bought: 200,
    cashedOut: 0,
    liquidity: 500,
  },
  {
    date: new Date(2026, 1, 1),
    income: 500,
    expense: -100,
    kept: 400,
    bought: 100,
    cashedOut: 400,
    liquidity: 700,
  },
];

const withTheme = (ui: React.ReactElement) => (
  <ThemeContext.Provider
    value={{ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }}
  >
    {ui}
  </ThemeContext.Provider>
);

const last = (name: string) => calls[name].at(-1)!;

/** Props of the direct children of a recorded ComposedChart, filtered by kit component. */
const kids = (chart: Record<string, unknown>, type: unknown) =>
  React.Children.toArray(chart.children as React.ReactNode)
    .filter(
      (c): c is React.ReactElement<Record<string, unknown>> =>
        React.isValidElement(c) && c.type === type,
    )
    .map((c) => c.props);

/** The base chart is recorded first, the transparent Kept overlay second. */
const baseAndOverlay = () => {
  const [base, overlay] = calls.ComposedChart;
  return { base, overlay };
};

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  setUiVersion("v1");
});

describe("MonthByMonthChart", () => {
  it("stacks the base chart and puts the spent bar on its own y axis", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const { base } = baseAndOverlay();
    expect(base.stacked).toBe(true);
    expect(base.xDataKey).toBe("date");
    expect(base.data).toBe(monthRows);

    const bars = kids(base, SeriesBar).map((p) => [p.dataKey, p.yAxisId]);
    expect(bars).toEqual([
      ["income", undefined],
      ["expense", "spent"],
    ]);
  });

  it("renders a second, transparent ComposedChart overlay carrying only the Kept line and dots", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    // Two plots (without and with investments), each a base chart plus its overlay.
    expect(calls.ComposedChart).toHaveLength(4);
    const { base, overlay } = baseAndOverlay();

    // Overlay bars are transparent: they only fix the x inset.
    expect(kids(overlay, SeriesBar).map((p) => p.fill)).toEqual([
      "transparent",
      "transparent",
    ]);
    expect(kids(overlay, Line)).toEqual([
      expect.objectContaining({
        dataKey: "kept",
        stroke: "#3b82f6",
        showMarkers: false,
        curve: "monotoneX",
      }),
    ]);
    expect(kids(overlay, Scatter)).toEqual([
      expect.objectContaining({
        dataKey: "kept",
        fill: "#3b82f6",
        stroke: "#3b82f6",
        strokeWidth: 0,
        ringGap: 0,
        radius: 4,
      }),
    ]);

    // The base chart carries no Kept series, so the kit cannot paint it under the bars.
    expect(kids(base, Line)).toEqual([]);
    expect(kids(base, Scatter)).toEqual([]);
    // The hidden investments copy also draws its Liquidity line, so Line runs three times in total.
    expect(calls.Line).toHaveLength(3);
    expect(calls.Scatter).toHaveLength(2);
  });

  it("wraps the overlay in an aria-hidden, pointer-events-none layer", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const [baseEl, overlayEl] = screen.getAllByTestId("composed");
    const wrapper = overlayEl.parentElement!;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("pointer-events-none", "absolute", "inset-0");
    expect(baseEl.closest('[aria-hidden="true"]')).toBeNull();

    const { base, overlay } = baseAndOverlay();
    expect(base.ariaLabel).toBe("Earned, spent and kept per month");
    expect(overlay.ariaLabel).toBe("Kept per month");
  });

  it("keeps the tooltip on the base chart only", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const { base, overlay } = baseAndOverlay();
    expect(kids(base, ChartTooltip)).toHaveLength(1);
    expect(kids(overlay, ChartTooltip)).toEqual([]);
    expect(calls.ChartTooltip).toHaveLength(2);
  });

  it("gives the overlay the same geometry as the base so the Kept line lines up with the bars", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const { base, overlay } = baseAndOverlay();
    for (const key of [
      "data",
      "yDomains",
      "margin",
      "aspectRatio",
      "stacked",
      "maxBarSize",
      "xDataKey",
    ]) {
      expect(overlay[key]).toBe(base[key]);
    }
  });

  it("paints kept in blue on the line, the legend and the tooltip", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(last("Line").stroke).toBe("#3b82f6");

    const keptSwatch = screen.getByText("Kept").previousElementSibling;
    expect(keptSwatch).toHaveStyle({ backgroundColor: "#3b82f6" });

    const rowsOf = last("ChartTooltip").rows as (
      p: Record<string, unknown>,
    ) => {
      label: string;
      color: string;
    }[];
    expect(rowsOf(monthRows[0]).map((r) => [r.label, r.color])).toEqual([
      ["Earned", "#34d399"],
      ["Spent", "#f87171"],
      ["Kept", "#3b82f6"],
    ]);
  });

  it("uses the v2 kept token for the overlay line and dots when the v2 UI is on", () => {
    setUiVersion("v2");
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    // jsdom has no token values, so the palette falls back to the v2 kept blue.
    expect(last("Line").stroke).toBe("rgb(52 120 198)");
    expect(last("Scatter").fill).toBe("rgb(52 120 198)");
    expect(last("Scatter").stroke).toBe("rgb(52 120 198)");
  });

  it("uses one symmetric domain on both y axes", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const bound = 1000 * 1.1;
    const { base } = baseAndOverlay();
    const { yDomains } = base as {
      yDomains: Record<string, [number, number]>;
    };
    expect(Object.keys(yDomains).sort()).toEqual(["left", "spent"]);
    for (const axis of ["left", "spent"]) {
      expect(yDomains[axis][0]).toBeCloseTo(-bound);
      expect(yDomains[axis][1]).toBeCloseTo(bound);
    }
  });

  it("labels the x axis by month in month mode", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(last("XAxis")).toMatchObject({
      numTicks: 3,
      tickMode: "data",
      labels: ["Jan", "Feb", "Mar"],
    });
  });

  it("labels the x axis by year in year mode", () => {
    render(
      withTheme(
        <MonthByMonthChart rows={yearRows} byYear currencySymbol="€" />,
      ),
    );
    expect(last("XAxis").labels).toEqual(["2024", "2025"]);
  });

  it("formats tooltip rows: absolute spent, signed kept, future month omitted", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const tooltip = last("ChartTooltip");
    expect(tooltip.dateLabels).toEqual(["Jan 2026", "Feb 2026", "Mar 2026"]);

    const rowsOf = tooltip.rows as (p: Record<string, unknown>) => {
      label: string;
      value: string;
    }[];
    expect(rowsOf(monthRows[0]).map((r) => [r.label, r.value])).toEqual([
      ["Earned", `${formatAmount(1000)} €`],
      ["Spent", `${formatAmount(300)} €`],
      ["Kept", `+${formatAmount(700)} €`],
    ]);
    expect(rowsOf(monthRows[1]).map((r) => [r.label, r.value])).toEqual([
      ["Earned", `${formatAmount(500)} €`],
      ["Spent", `${formatAmount(800)} €`],
      ["Kept", `−${formatAmount(300)} €`],
    ]);
    expect(rowsOf(monthRows[2])).toEqual([]);
  });

  it("uses year labels for tooltips in year mode", () => {
    render(
      withTheme(
        <MonthByMonthChart rows={yearRows} byYear currencySymbol="€" />,
      ),
    );
    expect(last("ChartTooltip").dateLabels).toEqual(["2024", "2025"]);
  });

  it("titles the tooltip with the month and year, or the year alone in year mode", () => {
    const { unmount } = render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const content = last("ChartTooltip").content as (p: {
      point: Record<string, unknown>;
      index: number;
    }) => React.ReactElement<{ title: string; rows: unknown[] }>;
    const el = content({ point: { ...monthRows[1] }, index: 1 });
    expect(el.type).toBe(TooltipContent);
    expect(el.props.title).toBe("Feb 2026");
    expect(el.props.rows).toHaveLength(3);
    unmount();

    render(
      withTheme(
        <MonthByMonthChart rows={yearRows} byYear currencySymbol="€" />,
      ),
    );
    const yearContent = last("ChartTooltip").content as typeof content;
    expect(
      yearContent({ point: { ...yearRows[1] }, index: 1 }).props.title,
    ).toBe("2025");
  });

  it("switches the title between month and year mode", () => {
    const { unmount } = render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(screen.getByText("Month by month")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Earned above the line, spent below it. The dot is what you kept.",
      ),
    ).toBeInTheDocument();
    unmount();

    render(
      withTheme(
        <MonthByMonthChart rows={yearRows} byYear currencySymbol="€" />,
      ),
    );
    expect(screen.getByText("Year by year")).toBeInTheDocument();
    expect(screen.queryByText("Month by month")).not.toBeInTheDocument();
  });

  it("renders the legend under the chart", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(screen.getByText("Earned")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("Kept")).toBeInTheDocument();
  });

  it("shows the no-data copy when every amount is zero", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={[
            { date: new Date(2026, 0, 1), income: 0, expense: 0, kept: 0 },
            { date: new Date(2026, 1, 1), income: 0, expense: 0, kept: 0 },
          ]}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.ComposedChart).toBeUndefined();
  });

  it("shows the no-data copy inside the card when no row has amounts", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={[{ date: new Date(2026, 0, 1) }]}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(screen.getByText("Month by month")).toBeInTheDocument();
    expect(screen.getByText("No data available.")).toBeInTheDocument();
    expect(calls.ComposedChart).toBeUndefined();
  });
});

describe("MonthByMonthChart bare mode", () => {
  it("drops the card shell and heading but keeps the chart and legend", () => {
    const { container } = render(
      withTheme(
        <MonthByMonthChart
          rows={monthRows}
          byYear={false}
          currencySymbol="€"
          bare
        />,
      ),
    );
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByText(/Earned above the line/)).toBeNull();
    expect(container.firstElementChild).not.toHaveClass("bg-app-card");
    expect(calls.ComposedChart).toHaveLength(4);
    expect(screen.getByText("Earned")).toBeInTheDocument();
  });
});

describe("MonthByMonthChart investments chip", () => {
  const chip = () => screen.getByRole("switch", { name: /Investments/ });

  beforeEach(() => {
    localStorage.clear();
  });

  it("is off by default and keeps the plain stacks and a single kept line", () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={investRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(chip()).toHaveAttribute("aria-checked", "false");
    const { base, overlay } = baseAndOverlay();
    expect(kids(base, SeriesBar).map((p) => p.dataKey)).toEqual([
      "income",
      "expense",
    ]);
    expect(kids(overlay, Line).map((p) => p.dataKey)).toEqual(["kept"]);
    expect(screen.queryByText("Liquidity left")).toBeNull();
  });

  it("stacks cashed out above Earned and bought below Spent, adds the dashed liquidity line and legend entries", async () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={investRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    await userEvent.click(chip());
    expect(chip()).toHaveAttribute("aria-checked", "true");

    // Re-renders record again: read the latest base/overlay pair.
    const { length } = calls.ComposedChart;
    const base = calls.ComposedChart[length - 2];
    const overlay = calls.ComposedChart[length - 1];
    expect(kids(base, SeriesBar).map((p) => [p.dataKey, p.yAxisId])).toEqual([
      ["income", undefined],
      ["cashedOut", undefined],
      ["expense", "spent"],
      ["boughtBelow", "spent"],
    ]);
    const cashed = kids(base, SeriesBar).find((p) => p.dataKey === "cashedOut");
    expect(cashed?.fill).toBe("var(--color-app-invest)");

    // Bought hangs below the spent bar, so it is stored negative.
    expect((base.data as Record<string, unknown>[])[0]).toMatchObject({
      boughtBelow: -200,
    });

    // The kept line is untouched; liquidity joins it as a dashed line in the kept colour.
    const lines = kids(overlay, Line);
    expect(lines).toEqual([
      expect.objectContaining({ dataKey: "kept", stroke: "#3b82f6" }),
      expect.objectContaining({
        dataKey: "liquidity",
        label: "Liquidity left",
        stroke: "#3b82f6",
        dashFromIndex: 1,
      }),
    ]);

    // Stack peak is Earned + cashed out (1000 + 0 vs 500 + 400 = 900), so the bound is 1000 * 1.1.
    const { yDomains } = base as { yDomains: Record<string, [number, number]> };
    expect(yDomains.left[1]).toBeCloseTo(1100);
    expect(yDomains.spent[0]).toBeCloseTo(-1100);

    expect(screen.getByText("Invested (out ↓ · back ↑)")).toBeInTheDocument();
    expect(screen.getByText("Liquidity left")).toBeInTheDocument();
  });

  it("restores the persisted choice and saves each toggle", async () => {
    localStorage.setItem("statistics.monthByMonth.showInvestments", "true");
    render(
      withTheme(
        <MonthByMonthChart
          rows={investRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    expect(chip()).toHaveAttribute("aria-checked", "true");

    await userEvent.click(chip());
    expect(chip()).toHaveAttribute("aria-checked", "false");
    expect(
      localStorage.getItem("statistics.monthByMonth.showInvestments"),
    ).toBe("false");
    expect(screen.queryByText("Liquidity left")).toBeNull();
  });
});

describe("MonthByMonthChart investments crossfade", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const chip = () => screen.getByRole("switch", { name: /Investments/ });
  const copies = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>(".grid > div"));

  it("sizes the shared scale with the investment stacks even while the chip is off", async () => {
    // Cashed out (900) stacks on Earned (100): the bound must cover 1000 even with the chip off.
    const rows: MonthByMonthRow[] = [
      {
        date: new Date(2026, 0, 1),
        income: 100,
        expense: -50,
        kept: 50,
        cashedOut: 900,
        bought: 0,
      },
    ];
    render(
      withTheme(
        <MonthByMonthChart rows={rows} byYear={false} currencySymbol="€" />,
      ),
    );
    const off = baseAndOverlay().base.yDomains as Record<
      string,
      [number, number]
    >;
    expect(off.left[1]).toBeCloseTo(1100);
    expect(off.spent[0]).toBeCloseTo(-1100);

    await userEvent.click(chip());
    for (const call of calls.ComposedChart) {
      expect(call.yDomains).toEqual(off);
    }
  });

  it("keeps both copies mounted and swaps which one is visible on toggle", async () => {
    const { container } = render(
      withTheme(
        <MonthByMonthChart
          rows={investRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    const [offCopy, onCopy] = copies(container);
    const composedBefore = screen.getAllByTestId("composed");

    expect(offCopy).toHaveClass("opacity-100");
    expect(offCopy).not.toHaveAttribute("aria-hidden");
    expect(offCopy).not.toHaveAttribute("inert");
    expect(onCopy).toHaveClass("opacity-0", "pointer-events-none");
    expect(onCopy).toHaveAttribute("aria-hidden", "true");
    expect(onCopy).toHaveAttribute("inert");
    for (const copy of [offCopy, onCopy]) {
      expect(copy).toHaveClass(
        "[grid-area:1/1]",
        "transition-opacity",
        "duration-300",
        "ease-out",
        "motion-reduce:transition-none",
      );
    }

    await userEvent.click(chip());

    expect(copies(container)).toEqual([offCopy, onCopy]);
    expect(offCopy).toHaveClass("opacity-0", "pointer-events-none");
    expect(offCopy).toHaveAttribute("aria-hidden", "true");
    expect(offCopy).toHaveAttribute("inert");
    expect(onCopy).toHaveClass("opacity-100");
    expect(onCopy).not.toHaveAttribute("aria-hidden");
    expect(onCopy).not.toHaveAttribute("inert");
    // Same DOM nodes: the kit charts were not remounted.
    expect(screen.getAllByTestId("composed")).toEqual(composedBefore);
  });

  it("puts the Liquidity left swatch on the same row as the legend", async () => {
    render(
      withTheme(
        <MonthByMonthChart
          rows={investRows}
          byYear={false}
          currencySymbol="€"
        />,
      ),
    );
    await userEvent.click(chip());
    const row = screen.getByText("Liquidity left").closest(".flex-wrap");
    expect(row).toHaveClass("gap-x-4", "justify-center");
    expect(row).toContainElement(screen.getByText("Kept"));
  });
});
