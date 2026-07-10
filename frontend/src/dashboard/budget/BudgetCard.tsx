import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../utils/types";
import { STATUS_META, barPercent, periodLabel } from "./budgetLogic";

interface BudgetCardProps {
  budget: Budget;
  currency: string;
  canEdit: boolean;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  currency,
  canEdit,
  onEdit,
  onDelete,
}) => {
  const meta = STATUS_META[budget.status];
  // No shared currency-format util exists yet in `utils/` (Transactions/Subscriptions
  // tabs each format money inline too) — minimal local Intl formatter.
  const money = (v: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);

  return (
    <div className="rounded-[var(--r-card)] border border-app-border bg-app-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-app-text truncate">{budget.name}</h3>
          <p className="text-xs text-app-muted">
            <span>{budget.tagName ?? "Whole wallet"}</span> ·{" "}
            <span>{periodLabel(budget)}</span>
            {budget.rollover && " · Rollover"}
          </p>
        </div>
        <span
          className="shrink-0 text-xs font-bold px-2 py-1 rounded-[var(--r-sm)]"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="h-2 rounded-full bg-app-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${barPercent(budget)}%`,
            backgroundColor: meta.color,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-app-text font-semibold font-app-mono tabular-nums">
          {money(budget.spent)}{" "}
          <span className="text-app-muted font-normal">
            of {money(budget.effectiveLimit)}
          </span>
        </span>
        <span className="text-app-muted font-app-mono tabular-nums">
          {budget.percentUsed}%
        </span>
      </div>

      {!budget.active && (
        <p className="text-xs text-app-muted">
          Not active in the current period.
        </p>
      )}

      {canEdit && (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${budget.name}`}
            onClick={() => onEdit(budget)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-input hover:text-app-yellow"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${budget.name}`}
            onClick={() => onDelete(budget)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};
