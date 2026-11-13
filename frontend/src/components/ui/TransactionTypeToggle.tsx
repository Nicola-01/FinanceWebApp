import React from "react";
import { Selector } from "./Selector";
import { useUiVersion } from "../../hooks/useUiVersion";

interface Props {
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME") => void;
}

export const TransactionTypeToggle: React.FC<Props> = ({ type, setType }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: expenses stay in the text colour; only income is green.
  const isV2 = ui === "v2";
  return (
    <Selector<"EXPENSE" | "INCOME">
      className="mt-4 max-w-[250px]"
      value={type as "EXPENSE" | "INCOME"}
      onChange={setType}
      options={[
        {
          value: "EXPENSE",
          label: "Expense",
          activeBgClass: isV2 ? "bg-app-raised" : "bg-app-red/20",
          activeColorClass: isV2 ? "text-app-text" : "text-app-red",
        },
        {
          value: "INCOME",
          label: "Income",
          activeBgClass: isV2 ? "bg-app-raised" : "bg-app-green/20",
          activeColorClass: isV2 ? "text-app-income" : "text-app-green",
        },
      ]}
    />
  );
};
