import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faEllipsis,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../utils/types.ts";
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { OTHER_COLOR } from "./categoryAgg.ts";

const INITIAL_VISIBLE = 7;
const STEP = 5;

const formatAmount = (value: number): string =>
  value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface RankItem {
  key: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

/**
 * Ranks the given transactions by their ACTUAL tag — the leaf assigned, or a parent tag used
 * directly on a transaction — NOT rolled up to the parent category. Each tag keeps its own
 * colour/icon. Sorted by amount, descending.
 */
function buildRanking(txs: Transaction[]): {
  items: RankItem[];
  total: number;
} {
  const map = new Map<string, RankItem>();
  let total = 0;

  txs.forEach((tx) => {
    total += tx.amount;
    // Unique per actual tag: a child and a same-named tag under another parent stay distinct.
    const key = tx.tag.parentName
      ? `${tx.tag.parentName}/${tx.tag.name}`
      : tx.tag.name;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        key,
        name: tx.tag.name,
        value: tx.amount,
        color: tx.tag.colorHex,
        icon: tx.tag.icon,
      });
    } else {
      cur.value += tx.amount;
    }
  });

  const items = Array.from(map.values()).sort((a, b) => b.value - a.value);
  return { items, total };
}

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

interface CategoryRankingProps {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
  /** Currency symbol shown next to each amount (e.g. "€"). */
  currency: string;
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
}) => {
  const { items, total } = useMemo(() => {
    const txs = transactions.filter((t) => t.type === type);
    return buildRanking(txs);
  }, [transactions, type]);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const visible = items.slice(0, visibleCount);
  const hidden = items.slice(visibleCount);
  const hiddenValue = hidden.reduce((acc, r) => acc + r.value, 0);
  const hiddenPct = total > 0 ? (hiddenValue / total) * 100 : 0;

  return (
    <div className="flex flex-col w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text">
      <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider">
        {title}
      </h3>

      {total === 0 ? (
        <div className="w-full flex flex-col items-center justify-center flex-1 min-h-[200px] bg-app-input/30 rounded-xl border border-app-border border-dashed">
          <p className="text-app-muted">
            No {title.toLowerCase()} data available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((item) => (
            <RankRow
              key={item.key}
              item={item}
              total={total}
              currency={currency}
            />
          ))}

          {hidden.length > 0 && (
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
