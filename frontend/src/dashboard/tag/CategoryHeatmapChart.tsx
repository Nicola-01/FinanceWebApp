import React, { useMemo, useState } from "react";
import { Heatmap } from "@mui/x-charts-pro/Heatmap";
import { ChartZoomSlider } from "@mui/x-charts-pro/ChartZoomSlider";
import type { Transaction } from "../../utils/types.ts";
import { Selector } from "../../components/ui/Selector.tsx";
import { mainCategoryName } from "./categoryAgg.ts";
import { useRecentMonthsZoom } from "./useRecentMonthsZoom.ts";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TOP_N = 8;

const formatAmount = (value: number): string =>
  value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type FlowType = "EXPENSE" | "INCOME";

// Soft sequential scales (low-alpha tint → soft 400 tint), per flow type.
const COLOR_SCALE: Record<FlowType, readonly [string, string]> = {
  EXPENSE: ["rgba(248,113,113,0.10)", "#f87171"],
  INCOME: ["rgba(52,211,153,0.10)", "#34d399"],
};

interface HeatmapData {
  xLabels: string[];
  yLabels: string[];
  cells: [number, number, number][];
  maxValue: number;
}

/**
 * Buckets the given flow type into a categories (rows) × months (columns) grid, where each cell
 * is the total spent in that main category that month. Rows are the top-N categories by total
 * plus an aggregated "Other"; every cell is emitted (0 when empty) so the grid is complete.
 */
function buildHeatmap(
  transactions: Transaction[],
  type: FlowType,
): HeatmapData {
  const txs = transactions.filter((t) => t.type === type);
  if (txs.length === 0)
    return { xLabels: [], yLabels: [], cells: [], maxValue: 0 };

  const months = new Map<string, Date>();
  const catTotals = new Map<string, number>();
  const perCell = new Map<string, number>(); // `${monthKey}|${cat}` -> sum

  txs.forEach((tx) => {
    const d = new Date(tx.transactionDate);
    const mKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    if (!months.has(mKey))
      months.set(mKey, new Date(d.getFullYear(), d.getMonth(), 1));
    const main = mainCategoryName(tx);
    catTotals.set(main, (catTotals.get(main) ?? 0) + tx.amount);
    const cellKey = `${mKey}|${main}`;
    perCell.set(cellKey, (perCell.get(cellKey) ?? 0) + tx.amount);
  });

  const sortedMonthKeys = Array.from(months.keys()).sort();
  const xLabels = sortedMonthKeys.map((k) => {
    const d = months.get(k)!;
    return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  });

  const ranked = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);
  const topCats = ranked.slice(0, TOP_N).map(([name]) => name);
  const hasOther = ranked.length > TOP_N;
  const yLabels = hasOther ? [...topCats, "Other"] : topCats;
  const topSet = new Set(topCats);

  const cells: [number, number, number][] = [];
  let maxValue = 0;
  sortedMonthKeys.forEach((mKey, xIdx) => {
    yLabels.forEach((cat, yIdx) => {
      let value = 0;
      if (cat === "Other" && hasOther) {
        catTotals.forEach((_, c) => {
          if (!topSet.has(c)) value += perCell.get(`${mKey}|${c}`) ?? 0;
        });
      } else {
        value = perCell.get(`${mKey}|${cat}`) ?? 0;
      }
      if (value > maxValue) maxValue = value;
      cells.push([xIdx, yIdx, value]);
    });
  });

  return { xLabels, yLabels, cells, maxValue };
}

interface CategoryHeatmapChartProps {
  transactions: Transaction[];
  /** Currency symbol shown in the tooltip (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}

/**
 * A categories × months heatmap: intensity = amount spent/earned per category per month.
 * Reveals seasonality and where the money concentrates over time. Pro `@mui/x-charts-pro`.
 */
export const CategoryHeatmapChart: React.FC<CategoryHeatmapChartProps> = ({
  transactions,
  currency,
  bare = false,
}) => {
  const [type, setType] = useState<FlowType>("EXPENSE");

  const { xLabels, yLabels, cells, maxValue } = useMemo(
    () => buildHeatmap(transactions, type),
    [transactions, type],
  );

  const [zoomData, setZoomData] = useRecentMonthsZoom(xLabels);

  // Extra bottom room reserves space for the x-axis labels + zoom slider.
  const height = Math.max(280, yLabels.length * 44 + 130);

  return (
    <div
      className={
        bare
          ? "flex flex-col w-full text-app-text"
          : "flex flex-col w-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text"
      }
    >
      <div
        className={`mb-4 flex flex-wrap items-center gap-3 ${bare ? "justify-end" : "justify-between"}`}
      >
        {!bare && (
          <div>
            <h3 className="text-xl font-bold text-app-text uppercase tracking-wider">
              Category Heatmap
            </h3>
            <p className="text-sm text-app-muted">
              Where the money concentrates, by category and month.
            </p>
          </div>
        )}
        <Selector
          value={type}
          onChange={setType}
          size="sm"
          fullWidth={false}
          className="w-[180px]"
          options={[
            {
              value: "EXPENSE",
              label: "Expenses",
              activeColorClass: "text-app-text",
            },
            {
              value: "INCOME",
              label: "Income",
              activeColorClass: "text-app-text",
            },
          ]}
        />
      </div>

      {cells.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center min-h-[240px] bg-app-input/30 rounded-xl border border-app-border border-dashed">
          <p className="text-app-muted">No data available.</p>
        </div>
      ) : (
        <div className="w-full">
          <Heatmap
            height={height}
            zoomData={zoomData}
            onZoomChange={setZoomData}
            xAxis={[
              {
                id: "x-axis",
                data: xLabels,
                zoom: { slider: { enabled: true }, minSpan: 5, panning: true },
                tickLabelStyle: {
                  fill: "var(--color-app-muted)",
                  fontSize: 11,
                },
              },
            ]}
            yAxis={[
              {
                data: yLabels,
                tickLabelStyle: {
                  fill: "var(--color-app-muted)",
                  fontSize: 11,
                },
              },
            ]}
            zAxis={[
              {
                min: 0,
                max: maxValue,
                colorMap: {
                  type: "continuous",
                  min: 0,
                  max: maxValue,
                  color: COLOR_SCALE[type],
                },
              },
            ]}
            series={[
              {
                data: cells,
                valueFormatter: (v) => `${formatAmount(v[2])} ${currency}`,
              },
            ]}
          >
            <ChartZoomSlider />
          </Heatmap>
        </div>
      )}
    </div>
  );
};
