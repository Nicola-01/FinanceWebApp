import React from "react";
import { useTheme } from "../../utils/ThemeContext.tsx";
import {
  PieArcLabel,
  pieArcClasses,
  pieArcLabelClasses,
  PieChart,
} from "@mui/x-charts/PieChart";
import { styled } from "@mui/material/styles";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Transaction } from "../../types/domain.ts";
import { hexToRgba, onColor } from "../../utils/color.ts";
import { toSentenceCase } from "../../utils/format.ts";
import { getCurrencySymbol } from "../../utils/currencies/index.ts";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";

const StyledText = styled("text")(() => ({
  fill: "currentColor",
  textAnchor: "middle",
  dominantBaseline: "central",
  fontSize: 16,
  fontWeight: "bold",
}));

/** v2 centre: the animated total in the display face, with a muted "spent"/"earned" caption (HTML inside the SVG, for NumberFlow). */
function V2CenterLabel({
  total,
  currency,
  caption,
}: {
  total: number;
  currency: string;
  caption: string;
}): React.ReactElement {
  const { width, height, left, top } = useDrawingArea();
  return (
    <foreignObject x={left} y={top} width={width} height={height}>
      <div className="flex h-full flex-col items-center justify-center text-app-text">
        <div className="font-display text-[16px] leading-tight font-semibold tracking-[-0.02em]">
          <AnimatedNumber
            value={total}
            currency={getCurrencySymbol(currency)}
            decimals={0}
          />
        </div>
        <div className="text-[12px] text-app-muted">{caption}</div>
      </div>
    </foreignObject>
  );
}

/** v2 slice label: inside labels sit on the slice (ink picked for contrast), outside ones on the card. */
// ui-v2-switch
function V2ArcLabel(props: React.ComponentProps<typeof PieArcLabel>) {
  const inside = props.arcLabelRadius < props.outerRadius;
  return (
    <PieArcLabel
      {...props}
      style={{
        fill: inside ? onColor(props.color) : "rgb(var(--text-primary))",
      }}
    />
  );
}

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
  currency = "EUR",
  bare = false,
}: {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
  /** Currency code for the centre total (defaults to EUR for the landing/demo usage). */
  currency?: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}) => {
  const { resolvedTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const txs = transactions.filter((t) => t.type === type);
  const totalAmount = txs.reduce((acc, t) => acc + t.amount, 0);

  const shellClass = bare
    ? "flex flex-col items-center w-full h-full text-app-text"
    : v2 // ui-v2-switch
      ? "flex flex-col items-center w-full h-full bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 md:p-6 text-app-text"
      : "flex flex-col items-center w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border py-3 md:p-6 text-app-text";

  const titleClass = v2 // ui-v2-switch
    ? "mb-6 w-full font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text"
    : "text-xl font-bold text-app-text mb-6 uppercase tracking-wider";
  const shownTitle = v2 ? toSentenceCase(title) : title; // ui-v2-switch

  if (totalAmount === 0) {
    return (
      <div className={shellClass}>
        {!bare && (
          <h3
            className={
              v2 // ui-v2-switch
                ? titleClass
                : "text-xl font-bold text-app-text mb-6 uppercase tracking-wider opacity-50"
            }
          >
            {shownTitle}
          </h3>
        )}

        <div
          className={
            v2 // ui-v2-switch
              ? "w-full flex flex-col items-center justify-center flex-1 min-h-[400px] bg-app-raised rounded-[var(--r-input)]"
              : "w-full flex flex-col items-center justify-center flex-1 min-h-[400px] bg-app-input/30 rounded-xl border border-app-border border-dashed"
          }
        >
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
    <div className={shellClass}>
      {!bare && <h3 className={titleClass}>{shownTitle}</h3>}

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
            [`& .${pieArcLabelClasses.root}`]: v2
              ? {
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: "bold",
                } // ui-v2-switch
              : {
                  fill:
                    resolvedTheme === "dark"
                      ? "#ffffff"
                      : "var(--color-app-card)",
                  fontSize: isMobile ? "9px" : "11px",
                  fontWeight: "bold",
                },
            ...(v2 // ui-v2-switch
              ? {
                  [`& .${pieArcClasses.root}`]: {
                    stroke: "rgb(var(--bg-card))",
                  },
                }
              : {}),
          }}
          slots={v2 ? { pieArcLabel: V2ArcLabel } : undefined} // ui-v2-switch
          hideLegend
        >
          {v2 ? ( // ui-v2-switch
            <V2CenterLabel
              total={totalAmount}
              currency={currency}
              caption={type === "INCOME" ? "earned" : "spent"}
            />
          ) : (
            <PieCenterLabel>
              {totalAmount.toLocaleString("it-IT", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              })}
            </PieCenterLabel>
          )}
        </PieChart>
      </div>
    </div>
  );
};
