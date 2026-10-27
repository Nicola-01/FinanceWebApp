import type { Transaction } from "../../types/domain.ts";
import {
  OTHER_COLOR,
  buildMainCategoryMeta,
  mainCategoryName,
} from "./categoryAgg.ts";
import { MONTH_LABELS } from "../../utils/months.ts";

export type FlowType = "EXPENSE" | "INCOME";

const TREND_TOP_N = 6;
const HEATMAP_TOP_N = 8;

export interface TrendSeries {
  dataKey: string;
  label: string;
  color: string;
}

/**
 * Builds a per-month stacked dataset: for the given flow type, the top-N main categories become
 * their own stacked series (coloured by the category), everything else collapses into "Other".
 * Category keys are opaque ids (s0, s1, …) so a category named like a reserved field can't clash.
 */
export function buildTrend(
  transactions: Transaction[],
  type: FlowType,
): { dataset: Record<string, number | string>[]; series: TrendSeries[] } {
  const txs = transactions.filter((t) => t.type === type);
  if (txs.length === 0) return { dataset: [], series: [] };

  const meta = buildMainCategoryMeta(txs);
  const months = new Map<string, { date: Date; perCat: Map<string, number> }>();
  const catTotals = new Map<string, number>();

  txs.forEach((tx) => {
    const d = new Date(tx.transactionDate);
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months.has(mKey)) {
      months.set(mKey, {
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        perCat: new Map(),
      });
    }
    const main = mainCategoryName(tx);
    const bucket = months.get(mKey)!;
    bucket.perCat.set(main, (bucket.perCat.get(main) ?? 0) + tx.amount);
    catTotals.set(main, (catTotals.get(main) ?? 0) + tx.amount);
  });

  const topCats = Array.from(catTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TREND_TOP_N)
    .map(([name]) => name);
  const topIndex = new Map(topCats.map((name, i) => [name, i]));
  const hasOther = catTotals.size > topCats.length;

  const sortedMonths = Array.from(months.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const dataset = sortedMonths.map((m) => {
    const row: Record<string, number | string> = {
      period: `${MONTH_LABELS[m.date.getMonth()]} ${m.date.getFullYear()}`,
    };
    topCats.forEach((_, i) => (row[`s${i}`] = 0));
    if (hasOther) row.sOther = 0;
    m.perCat.forEach((value, cat) => {
      const i = topIndex.get(cat);
      if (i !== undefined) row[`s${i}`] = (row[`s${i}`] as number) + value;
      else if (hasOther) row.sOther = (row.sOther as number) + value;
    });
    return row;
  });

  const series: TrendSeries[] = topCats.map((name, i) => ({
    dataKey: `s${i}`,
    label: name,
    color: meta.get(name)?.color ?? OTHER_COLOR,
  }));
  if (hasOther)
    series.push({ dataKey: "sOther", label: "Other", color: OTHER_COLOR });

  return { dataset, series };
}

export interface HeatmapData {
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
export function buildHeatmap(
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
  const topCats = ranked.slice(0, HEATMAP_TOP_N).map(([name]) => name);
  const hasOther = ranked.length > HEATMAP_TOP_N;
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

export interface RankItem {
  key: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

/**
 * Ranks the given transactions by their ACTUAL tag — the leaf assigned, or a parent tag used
 * directly on a transaction — NOT rolled up to the parent category. Each tag keeps its own
 * colour/icon. Sorted by amount, descending.
 */
export function buildRanking(txs: Transaction[]): {
  items: RankItem[];
  total: number;
} {
  const map = new Map<string, RankItem>();
  let total = 0;

  txs.forEach((tx) => {
    total += tx.amount;
    // Unique per actual tag: a child and a same-named tag under another parent stay distinct.
    const key = tx.tag.parentName
      ? `${tx.tag.parentName}/${tx.tag.name}`
      : tx.tag.name;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        key,
        name: tx.tag.name,
        value: tx.amount,
        color: tx.tag.colorHex,
        icon: tx.tag.icon,
      });
    } else {
      cur.value += tx.amount;
    }
  });

  const items = Array.from(map.values()).sort((a, b) => b.value - a.value);
  return { items, total };
}
