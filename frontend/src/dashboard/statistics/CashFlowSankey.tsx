import * as React from "react";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Unstable_SankeyChart as SankeyChart,
  type SankeyValueFormatterContext,
} from "@mui/x-charts-pro/SankeyChart";
import type { Transaction } from "../../types/domain";
import { useTheme } from "../../utils/ThemeContext";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { buildSankeyData } from "./sankeyData.ts";
import { useChartPalette } from "./useChartPalette.ts";
import {
  SankeyChart as KitSankeyChart,
  SankeyLink,
  SankeyNode,
  SankeyTooltip,
} from "@/components/ui/charts";
import { formatAmount } from "../../utils/format.ts";
import { getCurrencySymbol } from "../../utils/currencies/meta.ts";
import { cashFlowFooter, cashFlowTotals, toKitSankey } from "./sankeyKit.ts";

interface CashFlowSankeyProps {
  transactions: Transaction[];
  /** Currency code for formatting (defaults to EUR for the landing/demo usage). */
  currency?: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}

const CHART_HEIGHT = 600;

export const CashFlowSankey: React.FC<CashFlowSankeyProps> = ({
  transactions,
  currency = "EUR",
  bare = false,
}) => {
  const { resolvedTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  // ui-v2-switch: v2 income nodes use the --income token, text uses the app tokens.
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const palette = useChartPalette();
  // ui-v2-switch: the v2 card uses the kit's Sankey (CashFlowSankeyV2).
  if (isV2)
    return (
      <CashFlowSankeyV2
        transactions={transactions}
        currency={currency}
        bare={bare}
      />
    );

  const data = buildSankeyData(
    transactions,
    isV2 ? palette.income : resolvedTheme === "dark" ? "#ffffff" : "#bbbbbb",
  );
  if (!data) return null;

  const valueFormatter = (
    value: number,
    context: SankeyValueFormatterContext,
  ) => {
    const fmt = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
    return context.type === "node" ? `${fmt} total` : fmt;
  };

  const sidePadding = isMobile ? 12 : 24;

  const labelColor = isV2
    ? "var(--color-app-text)"
    : resolvedTheme === "dark"
      ? "#ffffff"
      : "var(--color-app-card)";

  const shell = bare
    ? "w-full"
    : isV2
      ? "w-full p-4 md:p-5 bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]"
      : "w-full p-1 sm:p-3 md:p-4 bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border";

  return (
    <div className={shell}>
      {!bare && (
        <>
          <h2
            className={
              isV2
                ? "font-display text-xl font-semibold text-app-text mb-1"
                : "text-center font-bold text-app-text text-lg md:text-2xl mb-1"
            }
          >
            {isV2 ? "Cash flow overview" : "Cash Flow Overview"}
          </h2>
          <p
            className={
              isV2
                ? "text-app-muted text-[13px] mb-3"
                : "text-center text-app-muted text-sm md:text-base mb-2 md:mb-4"
            }
          >
            {isV2
              ? "Flow from income to expenses"
              : "Flow from Income to Expenses"}
          </p>
        </>
      )}

      <div className="w-full flex justify-center">
        <div className="w-full" style={{ height: CHART_HEIGHT }}>
          <SankeyChart
            height={CHART_HEIGHT}
            margin={{
              top: 20,
              bottom: 20,
              left: sidePadding,
              right: sidePadding,
            }}
            series={{
              data,
              valueFormatter,
              nodeOptions: {
                sort: "fixed",
                // ui-v2-switch: wider gaps keep small flows' labels apart; thin nodes.
                padding: isV2 ? 24 : 16,
                width: isMobile ? 8 : isV2 ? 12 : 15,
                showLabels: true,
                fade: isV2 ? "global" : "none",
              },
              linkOptions: {
                opacity: isV2 ? 0.35 : 0.55,
                curveCorrection: 10,
                showValues: false,
                sort: "fixed",
                highlight: "nodes",
                fade: "global",
              },
              iterations: 32,
            }}
            sx={{
              "& .MuiChartsSankey-label, & text": {
                fill: `${labelColor} !important`,
                fontFamily: "inherit",
                fontSize: isV2
                  ? "12px !important"
                  : { xs: "10px !important", sm: "12px !important" },
                fontWeight: "500 !important",
              },
              ...(isV2 ? { "& [data-node] rect": { rx: 4, ry: 4 } } : {}),
            }}
          >
            <defs>
              <pattern
                id="savingsPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                {isV2 ? (
                  <rect
                    width="8"
                    height="8"
                    style={{
                      fill: "color-mix(in srgb, var(--color-app-income) 22%, transparent)",
                    }}
                  />
                ) : (
                  <rect width="8" height="8" fill="#1e3a8a" />
                )}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  {...(isV2
                    ? {
                        style: {
                          stroke:
                            "color-mix(in srgb, var(--color-app-income) 60%, transparent)",
                        },
                      }
                    : { stroke: "var(--color-app-blue)" })}
                  strokeWidth="4"
                />
              </pattern>
              <pattern
                id="deficitPattern"
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                {isV2 ? (
                  <rect
                    width="8"
                    height="8"
                    style={{
                      fill: `color-mix(in srgb, ${palette.expense} 16%, transparent)`,
                    }}
                  />
                ) : (
                  <rect width="8" height="8" fill="#7f1d1d" />
                )}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke={isV2 ? palette.expense : "#ef4444"}
                  strokeWidth="4"
                />
              </pattern>
            </defs>
          </SankeyChart>
        </div>
      </div>
    </div>
  );
};

/** v2 card: the kit's Sankey with the same graph as v1, plus a savings summary line. */
const CashFlowSankeyV2: React.FC<CashFlowSankeyProps> = ({
  transactions,
  currency = "EUR",
  bare = false,
}) => {
  const isMobile = useMediaQuery(useMuiTheme().breakpoints.down("sm"));
  const graph = buildSankeyData(transactions, "var(--color-app-income)");
  if (!graph) return null;

  const { data, colors } = toKitSankey(graph);
  const symbol = getCurrencySymbol(currency);
  const money = (value: number) => `${formatAmount(value)} ${symbol}`;
  const footer = cashFlowFooter(cashFlowTotals(transactions), money);
  // Side margins leave room for the node labels; the kit defaults are wider.
  const sideMargin = isMobile ? 96 : 150;

  return (
    <div
      className={
        bare
          ? "w-full"
          : "w-full p-4 md:p-5 bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]"
      }
    >
      {!bare && (
        <>
          <h2 className="font-display text-xl font-semibold text-app-text mb-1">
            Cash flow overview
          </h2>
          <p className="text-app-muted text-[13px] mb-3">
            Flow from income to expenses
          </p>
        </>
      )}
      <KitSankeyChart
        data={data}
        ariaLabel="Cash flow overview"
        aspectRatio={isMobile ? "1 / 1" : "16 / 9"}
        margin={{ top: 20, bottom: 20, left: sideMargin, right: sideMargin }}
        nodeWidth={isMobile ? 8 : 12}
        nodePadding={24}
      >
        <SankeyNode
          getNodeColor={(_node, index) => colors[index]}
          formatValue={money}
        />
        <SankeyLink strokeOpacity={0.35} />
        <SankeyTooltip formatValue={money} valueLabel="Amount" />
      </KitSankeyChart>
      {footer !== null && (
        <p className="mt-3 text-[13px] text-app-muted">{footer}</p>
      )}
    </div>
  );
};
