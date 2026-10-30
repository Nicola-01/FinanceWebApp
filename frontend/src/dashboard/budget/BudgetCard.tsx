import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faPenToSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { Budget } from "../../types/domain";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
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
        <div className="flex shrink-0 items-center gap-1">
          <Badge size="md" shape="square" color={meta.color}>
            {meta.label}
          </Badge>
          {canEdit && (
            <Menu width={176}>
              <Menu.Trigger>
                {({ open, toggle }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Actions for ${budget.name}`}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggle}
                  >
                    <FontAwesomeIcon icon={faEllipsisVertical} />
                  </Button>
                )}
              </Menu.Trigger>
              <Menu.Content>
                <Menu.Item icon={faPenToSquare} onClick={() => onEdit(budget)}>
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  icon={faTrash}
                  tone="danger"
                  onClick={() => onDelete(budget)}
                >
                  Delete
                </Menu.Item>
              </Menu.Content>
            </Menu>
          )}
        </div>
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
    </div>
  );
};
