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
import { useUiVersion } from "../../hooks/useUiVersion";
import { CategoryIcon } from "../../components/ui/CategoryIcon";
import { StatusPill } from "../../components/ui/StatusPill";
import { Gauge } from "@/components/ui/charts";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";
import { getCurrencySymbol } from "../../utils/currencies/meta.ts";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import {
  STATUS_META,
  STATUS_TEXT_V2,
  STATUS_TONE,
  barPercent,
  daysLeft,
  gaugeAriaLabel,
  gaugeColor,
  gaugeNumberFormat,
  periodLabel,
} from "./budgetLogic";

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
  const [ui] = useUiVersion();
  // ui-v2-switch
  if (ui === "v2") {
    return (
      <BudgetCardV2
        budget={budget}
        currency={currency}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

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

/** v2 card: icon tile, status pill, progress bar, used/left lines. Same actions as v1. */
const BudgetCardV2: React.FC<BudgetCardProps> = ({
  budget,
  currency,
  canEdit,
  onEdit,
  onDelete,
}) => {
  const { wallet, tags } = useWalletContext();
  const tag = budget.tagName
    ? tags.find((t) => t.name === budget.tagName)
    : undefined;
  const tone = STATUS_TONE[budget.status];
  const money = (v: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  const symbol = getCurrencySymbol(currency);
  const pillText =
    budget.status === "EXCEEDED"
      ? `${STATUS_TEXT_V2.EXCEEDED} ${money(budget.spent - budget.effectiveLimit)}`
      : STATUS_TEXT_V2[budget.status];

  return (
    <div className="flex flex-col gap-3 rounded-[var(--r-card)] bg-app-card p-4 shadow-[var(--box-ring)]">
      <div className="flex items-start gap-3">
        <CategoryIcon
          icon={tag ? tag.icon : wallet.icon}
          color={tag ? tag.colorHex : wallet.color}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
            {budget.name}
          </h3>
          <p className="truncate text-[13px] text-app-muted">
            <span>{budget.tagName ?? "Whole wallet"}</span> ·{" "}
            <span>{periodLabel(budget)}</span>
            {budget.rollover && " · Rollover"}
          </p>
        </div>
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

      <StatusPill status={tone}>{pillText}</StatusPill>

      {/* Arc clamps at full; the centre shows the real percentage. */}
      <div className="relative mx-auto w-full min-w-0 max-w-[180px] text-app-text">
        <Gauge
          arcStyle="solid"
          arcThickness={0.05}
          ariaLabel={gaugeAriaLabel(budget)}
          ariaDescription={`${budget.percentUsed}%`}
          centerValue={budget.percentUsed}
          defaultLabel="used"
          formatOptions={gaugeNumberFormat(budget.percentUsed)}
          inactiveFillOpacity={0.6}
          minWidth={0}
          suffix="%"
          value={barPercent(budget)}
          activeFill={gaugeColor(budget.status)}
        />
      </div>
      <p className="text-center text-[12px] text-app-muted">
        <AnimatedNumber value={budget.spent} currency={symbol} /> of{" "}
        <AnimatedNumber value={budget.effectiveLimit} currency={symbol} />
      </p>

      <p className="text-[13px] tabular-nums text-app-muted">
        <AnimatedNumber
          value={Math.max(0, budget.remaining)}
          currency={symbol}
        />{" "}
        left · {daysLeft(budget)} days left
      </p>

      {!budget.active && (
        <p className="text-xs text-app-muted">
          Not active in the current period.
        </p>
      )}
    </div>
  );
};
