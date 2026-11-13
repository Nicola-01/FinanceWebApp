import React from "react";
import {
  Selector,
  type SelectorOption,
} from "../../components/ui/Selector.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import type { FlowType } from "./categoryChartData.ts";

/** Income / Expenses switch shared by the category charts. */
export const FlowTypeToggle: React.FC<{
  value: FlowType;
  onChange: (type: FlowType) => void;
  /** Option order: Income first (default) or Expenses first. */
  expenseFirst?: boolean;
}> = ({ value, onChange, expenseFirst = false }) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  // v2: only income is green (style.md §8), so the active Income segment takes it.
  const INCOME: SelectorOption<FlowType> = {
    value: "INCOME",
    label: "Income",
    activeColorClass: v2 ? "text-app-income" : "text-app-text",
    // v2: the inactive Income label keeps the income hue, muted by opacity only.
    className: v2 ? "text-app-income opacity-70 hover:opacity-100" : undefined,
  };
  const EXPENSE: SelectorOption<FlowType> = {
    value: "EXPENSE",
    label: "Expenses",
    activeColorClass: "text-app-text",
  };
  return (
    <Selector
      value={value}
      onChange={onChange}
      size="sm"
      fullWidth={false}
      className="w-[180px]"
      options={expenseFirst ? [EXPENSE, INCOME] : [INCOME, EXPENSE]}
    />
  );
};
