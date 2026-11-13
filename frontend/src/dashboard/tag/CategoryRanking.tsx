import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faEllipsis,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../types/domain.ts";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { OTHER_COLOR } from "./categoryAgg.ts";
import { formatAmount } from "../../utils/format.ts";
import { buildRanking, type RankItem } from "./categoryChartData.ts";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";
import { useGrowIn } from "../../hooks/useGrowIn.ts";
import { toSentenceCase } from "../../utils/format.ts";

const INITIAL_VISIBLE = 7;
const STEP = 5;

/** v2 rows fill in top-down: 40ms apart, capped at 300ms. */
const staggerDelay = (index: number) => Math.min(index * 40, 300);

const RankRow: React.FC<{
  item: RankItem;
  total: number;
  currency: string;
}> = ({ item, total, currency }) => {
  const pct = total > 0 ? (item.value / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <FontAwesomeIcon
            icon={ICONS[item.icon as IconKey] ?? faTag}
            className="w-4 text-center shrink-0"
            style={{ color: item.color }}
          />
          <span className="truncate font-medium text-app-text">
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-2 font-app-mono shrink-0">
          <span className="text-app-text">
            {formatAmount(item.value)}{" "}
            <span className="text-app-muted">{currency}</span>
          </span>
          <span className="w-9 text-right text-xs text-app-muted/70">
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="w-full bg-app-input rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: item.color }}
        />
      </div>
    </div>
  );
};

/** v2 6px track; the fill grows from 0 after `delay` ms (see useGrowIn). */
const GrowBar: React.FC<{ pct: number; color: string; delay: number }> = ({
  pct,
  color,
  delay,
}) => {
  const grown = useGrowIn(delay);
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-app-raised">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${grown ? pct : 0}%`, backgroundColor: color }}
      />
    </div>
  );
};

/** v2 row (style.md §8): icon tile · name · amount + % · 6px track in the category colour. */
const RankRowV2: React.FC<{
  item: RankItem;
  total: number;
  currency: string;
  delay: number;
}> = ({ item, total, currency, delay }) => {
  const pct = total > 0 ? (item.value / total) * 100 : 0;
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3">
      <CategoryIcon icon={item.icon} color={item.color} size="sm" />
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="truncate font-medium text-app-text">
            {item.name}
          </span>
          <span className="shrink-0 tabular-nums text-app-text">
            <AnimatedNumber intro value={item.value} />{" "}
            <span className="text-app-muted">{currency}</span>
            <span className="ml-1.5 text-app-faint">
              {pct < 1 ? (
                "<1%"
              ) : (
                <AnimatedNumber intro kind="percent" value={pct} />
              )}
            </span>
          </span>
        </div>
        <GrowBar pct={pct} color={item.color} delay={delay} />
      </div>
    </div>
  );
};

interface CategoryRankingProps {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
  /** Currency symbol shown next to each amount (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}

/**
 * A "top categories" ranking as a CSS bar-list (icon · name · bar · amount · %), one card per
 * type (Income / Expense). The "Other" remainder is a button that reveals STEP more tags per
 * click. Mirrors the two-donut layout in the Categories tab.
 */
export const CategoryRanking: React.FC<CategoryRankingProps> = ({
  transactions,
  type,
  title,
  currency,
  bare = false,
}) => {
  const { items, total } = useMemo(() => {
    const txs = transactions.filter((t) => t.type === type);
    return buildRanking(txs);
  }, [transactions, type]);

  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visible = items.slice(0, visibleCount);
  const hidden = items.slice(visibleCount);
  const hiddenValue = hidden.reduce((acc, r) => acc + r.value, 0);
  const hiddenPct = total > 0 ? (hiddenValue / total) * 100 : 0;

  return (
    <div
      className={
        bare
          ? "flex flex-col w-full h-full text-app-text"
          : v2 // ui-v2-switch
            ? "flex flex-col w-full h-full bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 md:p-6 text-app-text"
            : "flex flex-col w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text"
      }
    >
      {!bare && (
        <h3
          className={
            v2 // ui-v2-switch
              ? "mb-5 font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text"
              : "text-xl font-bold text-app-text mb-6 uppercase tracking-wider"
          }
        >
          {v2 ? toSentenceCase(title) : title}
        </h3>
      )}

      {total === 0 ? (
        <div
          className={
            v2 // ui-v2-switch
              ? "w-full flex flex-col items-center justify-center flex-1 min-h-[200px] bg-app-raised rounded-[var(--r-input)]"
              : "w-full flex flex-col items-center justify-center flex-1 min-h-[200px] bg-app-input/30 rounded-xl border border-app-border border-dashed"
          }
        >
          <p className="text-app-muted">
            No {title.toLowerCase()} data available.
          </p>
        </div>
      ) : (
        <div className={`flex flex-col ${v2 ? "gap-3" : "gap-4"}`}>
          {visible.map((item, i) =>
            v2 ? ( // ui-v2-switch
              <RankRowV2
                key={item.key}
                item={item}
                total={total}
                currency={currency}
                delay={staggerDelay(i)}
              />
            ) : (
              <RankRow
                key={item.key}
                item={item}
                total={total}
                currency={currency}
              />
            ),
          )}

          {hidden.length > 0 &&
            v2 && ( // ui-v2-switch
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + STEP)}
                className="group flex w-full flex-col gap-1.5 rounded-[var(--r-sm)] py-1 text-left transition-colors hover:bg-app-raised"
              >
                <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3">
                  <span className="inline-grid h-8 w-8 place-items-center rounded-[9px] bg-app-raised text-[13px] text-app-muted">
                    <FontAwesomeIcon icon={faEllipsis} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-app-text">
                        Other{" "}
                        <span className="font-normal text-app-faint">
                          ({hidden.length})
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-app-text">
                        <AnimatedNumber intro value={hiddenValue} />{" "}
                        <span className="text-app-muted">{currency}</span>
                        <span className="ml-1.5 text-app-faint">
                          {hiddenPct < 1 ? (
                            "<1%"
                          ) : (
                            <AnimatedNumber
                              intro
                              kind="percent"
                              value={hiddenPct}
                            />
                          )}
                        </span>
                      </span>
                    </div>
                    <GrowBar
                      pct={hiddenPct}
                      color={OTHER_COLOR}
                      delay={staggerDelay(visible.length)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-app-muted transition-colors group-hover:text-app-text">
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="text-[10px]"
                  />
                  Show {Math.min(STEP, hidden.length)} more
                </div>
              </button>
            )}

          {hidden.length > 0 && !v2 && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + STEP)}
              className="group flex w-full flex-col gap-1.5 rounded-lg py-1 text-left transition-colors hover:bg-app-hover/40"
            >
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    className="w-4 text-center shrink-0"
                    style={{ color: OTHER_COLOR }}
                  />
                  <span className="truncate font-medium text-app-text">
                    Other
                  </span>
                  <span className="text-xs text-app-muted/70">
                    ({hidden.length})
                  </span>
                </div>
                <div className="flex items-center gap-2 font-app-mono shrink-0">
                  <span className="text-app-text">
                    {formatAmount(hiddenValue)}{" "}
                    <span className="text-app-muted">{currency}</span>
                  </span>
                  <span className="w-9 text-right text-xs text-app-muted/70">
                    {hiddenPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-app-input rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${hiddenPct}%`,
                    backgroundColor: OTHER_COLOR,
                  }}
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-app-muted transition-colors group-hover:text-app-text">
                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                Show {Math.min(STEP, hidden.length)} more
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
