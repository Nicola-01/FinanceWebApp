import {
  faChartColumn,
  faChartPie,
  faDiagramProject,
  faRankingStar,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../utils/types.ts";
import type { WidgetDef } from "../layout/widgetTypes.ts";
import { TransactionPieChart } from "./CategoryCharts.tsx";
import { CategoryRanking } from "./CategoryRanking.tsx";
import { CategoryTrendChart } from "./CategoryTrendChart.tsx";
import { CategoryHeatmapChart } from "./CategoryHeatmapChart.tsx";
import { CashFlowSankey } from "../statistics/CashFlowSankey.tsx";

export const CATEGORIES_TAB_ID = "categories";

/** Data the Categories-tab widgets need to render. */
export interface CategoriesWidgetCtx {
  /** The tab's date-filtered transactions. */
  transactions: Transaction[];
  /** ISO currency code for chart totals (e.g. "EUR"). */
  currencyCode: string;
  /** Currency symbol for row amounts (e.g. "€"). */
  currencySymbol: string;
}

/**
 * The Categories tab's widget registry. Order here = the default layout;
 * `hiddenByDefault` widgets start in the hidden tray.
 */
export const CATEGORIES_WIDGETS: WidgetDef<CategoriesWidgetCtx>[] = [
  {
    id: "income-pie",
    span: "half",
    title: "Income Distribution",
    subtitle: "Income by category and sub-category.",
    label: "Income",
    icon: faChartPie,
    render: (ctx, bare) => (
      <TransactionPieChart
        transactions={ctx.transactions}
        type="INCOME"
        title="Income Distribution"
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
  {
    id: "expense-pie",
    span: "half",
    title: "Expense Distribution",
    subtitle: "Expenses by category and sub-category.",
    label: "Expenses",
    icon: faChartPie,
    render: (ctx, bare) => (
      <TransactionPieChart
        transactions={ctx.transactions}
        type="EXPENSE"
        title="Expense Distribution"
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
  {
    id: "income-ranking",
    span: "half",
    title: "Top Income Categories",
    subtitle: "Which categories bring the most in.",
    label: "Top Income",
    icon: faRankingStar,
    render: (ctx, bare) => (
      <CategoryRanking
        transactions={ctx.transactions}
        type="INCOME"
        title="Top Income Categories"
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "expense-ranking",
    span: "half",
    title: "Top Expense Categories",
    subtitle: "Where the money goes, ranked.",
    label: "Top Expenses",
    icon: faRankingStar,
    render: (ctx, bare) => (
      <CategoryRanking
        transactions={ctx.transactions}
        type="EXPENSE"
        title="Top Expense Categories"
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "trend",
    span: "full",
    title: "Category Trend",
    subtitle: "Top categories per month, stacked over time.",
    label: "Trend",
    icon: faChartColumn,
    render: (ctx, bare) => (
      <CategoryTrendChart
        transactions={ctx.transactions}
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "heatmap",
    span: "full",
    hiddenByDefault: true,
    title: "Category Heatmap",
    subtitle: "Where the money concentrates, by category and month.",
    label: "Heatmap",
    icon: faTableCells,
    render: (ctx, bare) => (
      <CategoryHeatmapChart
        transactions={ctx.transactions}
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "sankey",
    span: "full",
    title: "Cash Flow Overview",
    subtitle: "Flow from Income to Expenses.",
    label: "Cash Flow",
    icon: faDiagramProject,
    render: (ctx, bare) => (
      <CashFlowSankey
        transactions={ctx.transactions}
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
];
