import React from "react";

interface Props {
  type: "EXPENSE" | "INCOME" | "";
  setType: (type: "EXPENSE" | "INCOME") => void;
}

export const TransactionTypeToggle: React.FC<Props> = ({ type, setType }) => {
  return (
    <div className="mt-4 flex rounded-xl bg-app-input p-1 border border-app-border w-full max-w-[250px]">
      <button
        type="button"
        onClick={() => setType("EXPENSE")}
        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
          type === "EXPENSE"
            ? "bg-app-red/20 text-app-red shadow-sm"
            : "text-app-muted hover:text-app-text"
        }`}
      >
        Expense
      </button>
      <button
        type="button"
        onClick={() => setType("INCOME")}
        className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
          type === "INCOME"
            ? "bg-app-green/20 text-app-green shadow-sm"
            : "text-app-muted hover:text-app-text"
        }`}
      >
        Income
      </button>
    </div>
  );
};
