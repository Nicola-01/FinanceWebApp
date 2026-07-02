import React from "react";
import { useTheme } from "../../utils/ThemeContext.tsx";
import { pieArcLabelClasses, PieChart } from "@mui/x-charts/PieChart";
import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Transaction } from "../../utils/types.ts";

const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex) return `rgba(0, 255, 127, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StyledText = styled("text")(() => ({
  fill: "currentColor",
  textAnchor: "middle",
  dominantBaseline: "central",
  fontSize: 16,
  fontWeight: "bold",
}));

function PieCenterLabel({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { width, height, left, top } = useDrawingArea();
  return (
    <StyledText x={left + width / 2} y={top + height / 2}>
      {children}
    </StyledText>
  );
}

export const TransactionPieChart = ({
  transactions,
  type,
  title,
}: {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
}) => {
  const { resolvedTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const txs = transactions.filter((t) => t.type === type);
  const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);

  if (totalAmount === 0) {
    return (
      <div className="flex flex-col items-center w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border py-3 md:p-6 text-app-text">
        <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider opacity-50">
          {title}
        </h3>

        <div className="w-full flex flex-col items-center justify-center flex-1 min-h-[400px] bg-app-input/30 rounded-xl border border-app-border border-dashed">
          <p className="text-app-muted">
            No {title.toLowerCase()} data available.
          </p>
        </div>
      </div>
    );
  }

  const mainMap = new Map<string, { value: number; color: string }>();
  const subMap = new Map<
    string,
    { main: string; value: number; color: string }
  >();

  txs.forEach((tx) => {
    const mainName = tx.tag.parentName || tx.tag.name;
    const subName = tx.tag.name;

    if (!mainMap.has(mainName))
      mainMap.set(mainName, { value: 0, color: tx.tag.colorHex });
    mainMap.get(mainName)!.value += tx.amount;

    if (!subMap.has(subName))
      subMap.set(subName, { main: mainName, value: 0, color: tx.tag.colorHex });
    subMap.get(subName)!.value += tx.amount;
  });

  const innerData = Array.from(mainMap.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .map(([id, data]) => ({
      id,
      label: id,
      value: data.value,
      percentage: (data.value / totalAmount) * 100,
      color: data.color,
    }));

  const outerData: typeof innerData = [];
  innerData.forEach((mainItem) => {
    const subs = Array.from(subMap.entries())
      .filter(([, data]) => data.main === mainItem.id)
      .sort((a, b) => b[1].value - a[1].value);

    subs.forEach(([subId, subData]) => {
      outerData.push({
        id: subId,
        label: subId,
        value: subData.value,
        percentage: (subData.value / totalAmount) * 100,
        color:
          subId === mainItem.id ? subData.color : hexToRgba(subData.color, 0.6),
      });
    });
  });

  const innerRadius = isMobile ? 45 : 50;
  const middleRadius = isMobile ? 120 : 140;
  const outerRadiusDelta = isMobile ? 20 : 20;

  return (
    <div className="flex flex-col items-center w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border py-3 md:p-6 text-app-text">
      <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider">
        {title}
      </h3>

      <div className="w-full flex justify-center h-[400px]">
        <PieChart
          margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
          series={[
            {
              innerRadius,
              outerRadius: middleRadius,
              data: innerData,
              arcLabel: (item) =>
                (item.value / totalAmount) * 100 > 5 ? `${item.id}` : "",
              valueFormatter: ({ value }) =>
                `${value.toFixed(2)} (${((value / totalAmount) * 100).toFixed(1)}%)`,
              highlightScope: { fade: "global", highlight: "item" },
              highlighted: { additionalRadius: 2 },
              cornerRadius: 3,
            },
            {
              innerRadius: middleRadius + 2,
              outerRadius: middleRadius + outerRadiusDelta,
              data: outerData,
              arcLabel: (item) => {
                if ((item.value / totalAmount) * 100 <= 3) return "";
                const label = String(item.id);
                if (isMobile) {
                  return label.length > 3
                    ? `${label.substring(0, 3)}...`
                    : label;
                }
                return label;
              },
              valueFormatter: ({ value }) =>
                `${value.toFixed(2)} (${((value / totalAmount) * 100).toFixed(1)}%)`,
              arcLabelRadius: middleRadius + (isMobile ? 15 : 35),
              highlightScope: { fade: "global", highlight: "item" },
              highlighted: { additionalRadius: 2 },
              cornerRadius: 2,
            },
          ]}
          sx={{
            [`& .${pieArcLabelClasses.root}`]: {
              fill:
                resolvedTheme === "dark" ? "#ffffff" : "var(--color-app-card)",
              fontSize: isMobile ? "9px" : "11px",
              fontWeight: "bold",
            },
          }}
          hideLegend
        >
          <PieCenterLabel>
            {totalAmount.toLocaleString("it-IT", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })}
          </PieCenterLabel>
        </PieChart>
      </div>
    </div>
  );
};
