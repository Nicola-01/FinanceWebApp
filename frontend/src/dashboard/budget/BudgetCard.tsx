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
import { Gauge } from "@/components/ui/charts";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";
import { getCurrencySymbol } from "../../utils/currencies/meta.ts";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { upcomingSubscriptionSpend } from "./budgetUpcoming";
import {
  STATUS_META,
  STATUS_TEXT_V2,
  arcPoint,
  projectedCommitted,
  STATUS_TONE,
  barPercent,
  daysLeft,
  gaugeAriaLabel,
  gaugeColor,
  gaugeAlertTicks,
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
  // Investment goal: the amount to go (or the reached pill) replaces the spent-of-limit line.
  const goal = budget.goal === true;
  const reached = budget.status === "GOAL_REACHED";
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
          {/* A goal carries its status in the line below, so no badge. */}
          {!goal && (
            <Badge size="md" shape="square" color={meta.color}>
              {meta.label}
            </Badge>
          )}
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
            backgroundColor: goal ? "var(--color-app-invest)" : meta.color,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-app-text font-semibold font-app-mono tabular-nums">
          {goal ? (
            reached ? (
              <span className="rounded-full bg-app-income/15 px-2.5 py-0.5 font-sans font-semibold text-app-income">
                Goal reached
              </span>
            ) : (
              <>{money(budget.remaining)} to go</>
            )
          ) : (
            <>
              {money(budget.spent)}{" "}
              <span className="text-app-muted font-normal">
                of {money(budget.effectiveLimit)}
              </span>
            </>
          )}
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

/** Due-soon arc and figure colour: the mock's terracotta, kept apart from the amber WARNING arc. */
// shortcut: no v2 theme token for this terracotta yet, so it is a literal; move it to theme-tokens.css if a second surface needs it.
const DUE_COLOUR = "#c8705a";

/** Header status text colour per tone (token-based, same tones as StatusPill). */
const TONE_TEXT: Record<"ok" | "warn" | "danger", string> = {
  ok: "text-app-income",
  warn: "text-app-warn",
  danger: "text-app-danger",
};

/** Radius of the Gauge's value arc inside the 100x100 overlay box (the mid-point of the alert ticks). */
const ARC_RADIUS = 40;

/** v2 hero amount, sized like StatTile values (22px display, 650). */
const HERO =
  "min-w-0 break-words font-display text-[22px] font-[650] leading-[1.1] tracking-[-0.02em] text-app-text";

/** One figure under the hero: optional dot in an arc colour, amount, then label. */
const Fact: React.FC<{
  color?: string;
  value: React.ReactNode;
  label: string;
}> = ({ color, value, label }) => (
  <div className="min-w-0 max-w-full">
    <b className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-app-text tabular-nums">
      {value}
    </b>
    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] text-app-muted">
      {color && (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  </div>
);

/** v2 card (proposal C): status in the header, tighter arc with a pace marker, left-aligned hero and figures. Same actions as v1. */
const BudgetCardV2: React.FC<BudgetCardProps> = ({
  budget,
  currency,
  canEdit,
  onEdit,
  onDelete,
}) => {
  // `subscriptions` defaults to none so callers without it (older tests) still render.
  const { wallet, tags, subscriptions = [] } = useWalletContext();
  // A goal has no commitments: subscriptions due do not apply to it.
  const goal = budget.goal === true;
  const reached = budget.status === "GOAL_REACHED";
  const upcoming = goal
    ? 0
    : upcomingSubscriptionSpend(budget, subscriptions, tags);
  // The due-soon segment starts where the spent arc ends and is capped at the limit.
  const spentArc = barPercent(budget);
  const dueArc =
    budget.effectiveLimit > 0
      ? Math.min(100, spentArc + (upcoming / budget.effectiveLimit) * 100)
      : spentArc;
  const showDue = upcoming > 0 && dueArc > spentArc;
  const alertTicks = gaugeAlertTicks(
    budget.alertThresholds,
    budget.percentUsed,
  );
  // Money left after subscriptions still due; a negative value is the overspend.
  const left = budget.remaining - upcoming;
  const overspend = Math.max(0, -left);
  // Pace marker: where committed spend lands by period end, pinned to the arc end.
  const projected = projectedCommitted(budget, upcoming);
  const pacePoint =
    !goal && budget.effectiveLimit > 0
      ? arcPoint(
          Math.min(100, (projected / budget.effectiveLimit) * 100),
          ARC_RADIUS,
        )
      : null;
  const tag = budget.tagName
    ? tags.find((t) => t.name === budget.tagName)
    : undefined;
  const tone = STATUS_TONE[budget.status];
  const money = (v: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(v);
  const symbol = getCurrencySymbol(currency);
  const goalHero = !goal ? null : reached ? (
    <p>
      <span className="inline-flex rounded-full bg-app-income/15 px-3 py-1 text-[13px] font-semibold text-app-income">
        Goal reached
      </span>
    </p>
  ) : (
    <p className={HERO}>
      <span className="tabular-nums">
        <AnimatedNumber value={budget.remaining} currency={symbol} />
      </span>{" "}
      <span className="text-[13px] font-normal text-app-muted">to go</span>
    </p>
  );

  return (
    <div className="@container min-w-0 flex flex-col gap-3 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6">
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
        {/* A goal carries its status in the hero line below, so the header stays quiet. */}
        {!goal && (
          <span
            className={`mt-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold ${TONE_TEXT[tone]}`}
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-current"
            />
            {STATUS_TEXT_V2[budget.status]}
          </span>
        )}
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

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4">
        {/* Arc clamps at full; the centre shows the real percentage (centerValue, not value). */}
        <div className="relative w-[104px] @md:row-span-2 @md:w-[128px] shrink-0 text-app-text [&_.ts-bkm-center-stat-value]:!text-[20px]">
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
            value={showDue ? dueArc : spentArc}
            activeFill={
              goal ? "var(--color-app-invest)" : gaugeColor(budget.status)
            }
            zoneDisplay="fill"
            zones={
              showDue
                ? [
                    {
                      from: spentArc,
                      to: dueArc,
                      color: DUE_COLOUR,
                    },
                  ]
                : undefined
            }
          />
          {/* Alert ticks: the Gauge kit has no per-value marks, so they sit in an overlay on the same 100x100 box. */}
          {budget.alertThresholds.length > 0 && !goal && (
            <svg
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Alerts at ${alertTicks.map((t) => `${t.pct}%`).join(", ")}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {alertTicks.map((tick) => (
                <line
                  key={tick.pct}
                  data-alert-tick={tick.pct}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={
                    tick.passed
                      ? gaugeColor(budget.status)
                      : "var(--color-app-faint)"
                  }
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          )}
          {/* Pace marker: a dot on the arc at the projected end-of-period committed spend. */}
          {pacePoint && (
            <svg
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Pace: about ${money(projected)} committed by period end`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <circle
                data-pace-marker
                cx={pacePoint[0]}
                cy={pacePoint[1]}
                r={3.5}
                fill="var(--color-app-card)"
                stroke="var(--color-app-text)"
                strokeWidth={1.5}
              />
            </svg>
          )}
        </div>

        <div className="flex min-w-0 flex-col @md:row-span-1">
          {goalHero ??
            (overspend > 0 ? (
              <p
                className={`${HERO} ${budget.status === "EXCEEDED" ? "!text-app-danger" : "!text-app-warn"}`}
              >
                <span className="text-[13px] font-normal text-app-muted">
                  Over by
                </span>{" "}
                <span className="tabular-nums">
                  <AnimatedNumber value={overspend} currency={symbol} />
                </span>
              </p>
            ) : (
              <p className={HERO}>
                <span className="tabular-nums">
                  <AnimatedNumber value={left} currency={symbol} />
                </span>{" "}
                <span className="text-[13px] font-normal text-app-muted">
                  left
                </span>
              </p>
            ))}
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-3 border-t border-app-border pt-3 @md:col-span-1 @md:col-start-2 @md:flex @md:flex-wrap @md:gap-x-4 @md:gap-y-2 @md:border-0 @md:pt-0">
          <Fact
            color={gaugeColor(budget.status)}
            value={<AnimatedNumber value={budget.spent} currency={symbol} />}
            label="spent"
          />
          {!goal && (
            <Fact
              color={DUE_COLOUR}
              value={<AnimatedNumber value={upcoming} currency={symbol} />}
              label="still due"
            />
          )}
          <Fact
            value={
              <>
                <span className="tabular-nums">{daysLeft(budget)}</span>{" "}
                <span className="text-[13px] font-normal text-app-muted">
                  days
                </span>
              </>
            }
            label="left in period"
          />
        </div>

        {pacePoint && (
          <p
            data-testid="pace-legend"
            className="col-span-2 flex items-center gap-1.5 text-[13px] text-app-muted @md:col-span-1 @md:col-start-2"
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full border-[1.5px] border-app-text bg-app-card"
            />
            {`At this pace: ${money(projected)} by period end`}
          </p>
        )}
      </div>

      {!budget.active && (
        <p className="text-xs text-app-muted">
          Not active in the current period.
        </p>
      )}
    </div>
  );
};
