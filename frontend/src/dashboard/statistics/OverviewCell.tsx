import React from "react";
import { formatAmount } from "../../utils/format.ts";

export type CellType = "income" | "expense" | "balance";

interface OverviewCellContentProps {
  value: number;
  type: CellType;
  isBold?: boolean;
}

interface OverviewCellProps extends OverviewCellContentProps {
  className?: string;
}

/** The formatted value span, without the `<td>` wrapper. */
export const OverviewCellContent: React.FC<OverviewCellContentProps> = ({
  value,
  type,
  isBold = false,
}) => {
  const hasData = value !== 0;
  let color = "text-app-muted/30";
  let prefix = "";
  let displayValue = value;

  if (hasData) {
    if (type === "income") {
      color = "text-app-green";
      prefix = "+";
    } else if (type === "expense") {
      color = "text-app-red";
      prefix = "-";
      displayValue = Math.abs(value);
    } else {
      color = value >= 0 ? "text-app-green" : "text-app-red";
      prefix = value >= 0 ? "+" : "-";
      displayValue = Math.abs(value);
    }
  }

  return (
    <span
      className={`text-xs md:text-sm whitespace-nowrap ${isBold ? "font-bold" : "font-medium"} ${color}`}
    >
      {hasData
        ? `${prefix}${formatAmount(displayValue, { zeroAsDash: true })}`
        : "—"}
    </span>
  );
};

export const OverviewCell: React.FC<OverviewCellProps> = ({
  className = "",
  ...content
}) => (
  <td className={`text-center px-1 py-3 ${className}`.trim()}>
    <OverviewCellContent {...content} />
  </td>
);
