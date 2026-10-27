import React from "react";
import { Selector } from "../../components/ui/Selector.tsx";
import type { FlowType } from "./categoryChartData.ts";

const INCOME = {
  value: "INCOME" as const,
  label: "Income",
  activeColorClass: "text-app-text",
};
const EXPENSE = {
  value: "EXPENSE" as const,
  label: "Expenses",
  activeColorClass: "text-app-text",
};

/** Income / Expenses switch shared by the category charts. */
export const FlowTypeToggle: React.FC<{
  value: FlowType;
  onChange: (type: FlowType) => void;
  /** Option order: Income first (default) or Expenses first. */
  expenseFirst?: boolean;
}> = ({ value, onChange, expenseFirst = false }) => (
  <Selector
    value={value}
    onChange={onChange}
    size="sm"
    fullWidth={false}
    className="w-[180px]"
    options={expenseFirst ? [EXPENSE, INCOME] : [INCOME, EXPENSE]}
  />
);
