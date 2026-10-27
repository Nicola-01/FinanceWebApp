import * as React from "react";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Unstable_SankeyChart as SankeyChart,
  type SankeyValueFormatterContext,
} from "@mui/x-charts-pro/SankeyChart";
import type { Transaction } from "../../types/domain";
import { useTheme } from "../../utils/ThemeContext";
import { buildSankeyData } from "./sankeyData.ts";

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

  const data = buildSankeyData(
    transactions,
    resolvedTheme === "dark" ? "#ffffff" : "#bbbbbb",
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

  const labelColor =
    resolvedTheme === "dark" ? "#ffffff" : "var(--color-app-card)";

  return (
    <div
      className={
        bare
          ? "w-full"
          : "w-full p-1 sm:p-3 md:p-4 bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border"
      }
    >
      {!bare && (
        <>
          <h2 className="text-center font-bold text-app-text text-lg md:text-2xl mb-1">
            Cash Flow Overview
          </h2>
          <p className="text-center text-app-muted text-sm md:text-base mb-2 md:mb-4">
            Flow from Income to Expenses
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
                padding: 16,
                width: isMobile ? 8 : 15,
                showLabels: true,
              },
              linkOptions: {
                opacity: 0.55,
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
                fontSize: { xs: "10px !important", sm: "12px !important" },
                fontWeight: "500 !important",
              },
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
                <rect width="8" height="8" fill="#1e3a8a" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="var(--color-app-blue)"
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
                <rect width="8" height="8" fill="#7f1d1d" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#ef4444"
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
