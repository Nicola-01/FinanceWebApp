import React from "react";
import { Selector } from "../../components/ui/Selector";

interface Props {
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME") => void;
}

export const TransactionTypeToggle: React.FC<Props> = ({ type, setType }) => (
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
