import React from "react";
import { OverviewCell } from "./OverviewCell.tsx";

// Shape of the data items passed in the array
type DataItem = { income: number; expense: number };

interface OverviewRowProps {
  dataItems: DataItem[];
  border?: boolean;
  getValue: (item: DataItem) => number;
  type: "income" | "expense" | "balance";
}

export const OverviewRow: React.FC<OverviewRowProps> = ({
  dataItems,
  border = true,
  getValue,
  type,
}) => {
  return (
    <tr
      className={`${border ? "border-b border-app-border" : ""} hover:bg-app-surface/50 transition-colors`}
    >
      {dataItems.map((m, i) => (
        <OverviewCell key={i} value={getValue(m)} type={type} />
      ))}
    </tr>
  );
};
