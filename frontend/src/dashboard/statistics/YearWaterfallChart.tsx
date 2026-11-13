import {
  BarXAxis,
  BarYAxis,
  ChartTooltip,
  Grid,
  Waterfall,
  WaterfallChart,
} from "@/components/ui/charts";
import { KitNoData } from "./KitChartShared.tsx";
import { compactAmount } from "./kitChartData.ts";
import type { WaterfallRow } from "./statsChartRows.ts";
import { useChartPalette } from "./useChartPalette.ts";

interface YearWaterfallChartProps {
  rows: WaterfallRow[];
  /** True for the all-time view (one step per year), false for the year view (one step per month). */
  byYear: boolean;
  currencySymbol: string;
}

/** v2: waterfall of the balance from the start of the period through each period's net to now. */
export function YearWaterfallChart({
  rows,
  byYear,
  currencySymbol,
}: YearWaterfallChartProps) {
  const { income, expense, neutral } = useChartPalette();
  const title = byYear ? "How the years added up" : "How the year added up";
  const sub = byYear
    ? "Each year's net and where you are now."
    : "Start of the year, each month's net, where you are now.";
  const fmt = (v: number) =>
    (v < 0 ? "−" : "") +
    Math.round(Math.abs(v)).toLocaleString("it-IT") +
    " " +
    currencySymbol;

  return (
    <section className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4">
      <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
        {title}
      </h3>
      <p className="text-[13px] text-app-muted mt-0.5">{sub}</p>
      {rows.length === 0 || rows.every((r) => !r.value) ? (
        <KitNoData />
      ) : (
        <WaterfallChart
          data={rows}
          xDataKey="label"
          aspectRatio="3 / 1"
          margin={{ top: 24, right: 12, bottom: 28, left: 44 }}
          ariaLabel="Balance at the start, each period's net, and now"
        >
          <Grid horizontal />
          <Waterfall
            dataKey="value"
            totalKey="total"
            positiveFill={income}
            negativeFill={expense}
            totalFill={neutral}
            showConnectors
            showValues
            formatValue={fmt}
            radius={4}
          />
          <BarXAxis showAllLabels />
          <BarYAxis numTicks={4} formatValue={compactAmount} />
          <ChartTooltip />
        </WaterfallChart>
      )}
    </section>
  );
}
