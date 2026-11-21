import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import type { Tag, Transaction } from "../../types/domain.ts";
import Button from "../../components/ui/Button.tsx";
import {
  rankExpenseCategories,
  type StripCategory,
} from "./categoryStripData.ts";

interface CategoryStripProps {
  /** Categorised transactions of the period (the tab's filtered set). */
  transactions: Transaction[];
  /** The wallet's tags; the hidden "To categorise" placeholder is never among them. */
  tags: Tag[];
  /** Investment tag names; their spending is not counted as a category. */
  invest: Set<string>;
  onManage: () => void;
}

/** Chips shown on wide screens; phones show one fewer (the 4th is `max-sm:hidden`). */
const CHIPS = 4;

const Chip: React.FC<{ category: StripCategory; className?: string }> = ({
  category,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold tabular-nums ${className}`}
    style={{
      color: category.color,
      backgroundColor: `color-mix(in srgb, ${category.color} 16%, transparent)`,
    }}
  >
    <span aria-hidden="true" className="size-[7px] rounded-full bg-current" />
    {category.name} {category.percent}%
  </span>
);

/** v2 Categories header: the category count, the period's largest expense categories, and Manage. */
export const CategoryStrip: React.FC<CategoryStripProps> = ({
  transactions,
  tags,
  invest,
  onManage,
}) => {
  const ranked = useMemo(
    () => rankExpenseCategories(transactions, tags, invest),
    [transactions, tags, invest],
  );
  const count = tags.length;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[var(--r-card)] bg-app-card p-5 sm:p-6 shadow-[var(--box-ring)]">
      <span className="text-sm font-semibold tabular-nums text-app-text">
        {count} {count === 1 ? "category" : "categories"}
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-hidden max-sm:order-last max-sm:basis-full sm:flex-nowrap">
        {ranked.length === 0 ? (
          <span className="text-[13px] text-app-muted">
            No spending in this period
          </span>
        ) : (
          <>
            {ranked.slice(0, CHIPS).map((c, i) => (
              <Chip
                key={c.name}
                category={c}
                className={i === CHIPS - 1 ? "max-sm:hidden" : ""}
              />
            ))}
            {ranked.length > CHIPS && (
              <span className="rounded-full bg-app-raised px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-app-muted max-sm:hidden">
                +{ranked.length - CHIPS}
              </span>
            )}
            {ranked.length > CHIPS - 1 && (
              <span className="rounded-full bg-app-raised px-2.5 py-1 text-[12.5px] font-semibold tabular-nums text-app-muted sm:hidden">
                +{ranked.length - (CHIPS - 1)}
              </span>
            )}
          </>
        )}
      </div>

      <Button variant="secondary" className="ml-auto" onClick={onManage}>
        <FontAwesomeIcon icon={faLayerGroup} />
        Manage
      </Button>
    </div>
  );
};
