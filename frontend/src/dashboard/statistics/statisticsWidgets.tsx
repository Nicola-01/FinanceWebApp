import {
  faChartLine,
  faChartSimple,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../types/domain.ts";
import type { WidgetDef } from "../layout/widgetTypes.ts";
import { Collapse } from "../../components/ui/Collapse.tsx";
import { YearWaterfallChart } from "./YearWaterfallChart.tsx";
import { BalanceProjectionChart } from "./BalanceProjectionChart.tsx";
import { OverviewTableV2 } from "./OverviewTableV2.tsx";
import type { MonthByMonthRow, WaterfallRow } from "./statsChartRows.ts";
import type { Insight } from "./statisticsInsights.ts";

export const STATISTICS_TAB_ID = "statistics";

/** Data the v2 Statistics widgets need to render. */
export interface StatisticsWidgetCtx {
  rows: MonthByMonthRow[];
  waterfall: WaterfallRow[];
  history: { date: Date; balance: number }[];
  insights: Insight[];
  transactions: Transaction[];
  /** True for the all-time view (one step per year), false for a single year. */
  byYear: boolean;
  currencySymbol: string;
}

/** The v2 Statistics registry (below the pinned summary + month-by-month row). Order here = the default layout. */
export const STATISTICS_WIDGETS: WidgetDef<StatisticsWidgetCtx>[] = [
  {
    id: "year-waterfall",
    span: "full",
    title: "How the year added up",
    subtitle: "Start of the year, each month's net, where you are now.",
    label: "Year",
    icon: faChartSimple,
    render: (ctx, bare) => (
      <YearWaterfallChart
        rows={ctx.waterfall}
        byYear={ctx.byYear}
        currencySymbol={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "balance-projection",
    span: "full",
    title: "Where you're heading",
    subtitle: "Today's balance plus your typical month, ahead.",
    label: "Projection",
    icon: faChartLine,
    render: (ctx, bare) => (
      <BalanceProjectionChart
        history={ctx.history}
        currencySymbol={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "numbers",
    span: "full",
    title: "Show the numbers",
    subtitle: "The figures behind the charts, by period.",
    label: "Numbers",
    icon: faTableCells,
    render: (ctx) => (
      <Collapse title="Show the numbers" size="sm">
        <OverviewTableV2 transactions={ctx.transactions} />
      </Collapse>
    ),
  },
];
