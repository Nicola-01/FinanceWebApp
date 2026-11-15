import React from "react";
import { Selector } from "./Selector";
import { SegmentedControl } from "./SegmentedControl";
import { useUiVersion } from "../../hooks/useUiVersion";

interface Props {
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME") => void;
}

export const TransactionTypeToggle: React.FC<Props> = ({ type, setType }) => {
  const [ui] = useUiVersion();

  // ui-v2-switch
  if (ui === "v2") {
    // Expenses stay in the text colour; only income is green.
    return (
      <SegmentedControl<"EXPENSE" | "INCOME">
        className="mt-4 w-full max-w-[260px]"
        fullWidth
        aria-label="Transaction type"
        value={type}
        onChange={setType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          {
            value: "INCOME",
            label: "Income",
            activeClassName: "text-app-income",
          },
        ]}
      />
    );
  }

  return (
    <Selector<"EXPENSE" | "INCOME">
      className="mt-4 max-w-[250px]"
      value={type as "EXPENSE" | "INCOME"}
      onChange={setType}
      options={[
        {
          value: "EXPENSE",
          label: "Expense",
          activeBgClass: "bg-app-red/20",
          activeColorClass: "text-app-red",
        },
        {
          value: "INCOME",
          label: "Income",
          activeBgClass: "bg-app-green/20",
          activeColorClass: "text-app-green",
        },
      ]}
    />
  );
};
