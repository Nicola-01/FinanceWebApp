import React, { useMemo, useRef } from "react";
import type { Subscription } from "../../types/domain";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { SplitBar } from "../../components/ui/SplitBar.tsx";
import { useSharedFitFont } from "../../hooks/useSharedFitFont.ts";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import { summarizeSubscriptions } from "./subscriptionSummary";

interface SubscriptionSummaryV2Props {
  subscriptions: Subscription[];
  currency: string;
  /** Investment tag names (see useInvestmentTags); their subscriptions are invested, not cost. */
  invest?: Set<string>;
}

/** v2 top box: recurring tiles (cost leads on phones) plus the cost split by subscription. */
export const SubscriptionSummaryV2: React.FC<SubscriptionSummaryV2Props> = ({
  subscriptions,
  currency,
  invest,
}) => {
  const summary = useMemo(
    () => summarizeSubscriptions(subscriptions, invest),
    [subscriptions, invest],
  );
  const symbol = CURRENCY_META[currency as CurrencyCode]?.symbol ?? "";
  const { monthlyCost, yearlyCost, monthlyIncome, monthlyInvested } = summary;
  const hasInvested = monthlyInvested > 0;
  const tilesRef = useRef<HTMLDivElement>(null);
  useSharedFitFont(tilesRef, { max: 22, min: 14 }, [
    monthlyCost,
    yearlyCost,
    monthlyIncome,
    monthlyInvested,
    symbol,
  ]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Phones: 2 columns; Over a year spans full width unless Invested makes a 2x2. lg: one row. */}
      <div
        ref={tilesRef}
        className={[
          "grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5",
          hasInvested
            ? "lg:grid-cols-[repeat(4,minmax(0,1fr))]"
            : "lg:grid-cols-[repeat(3,minmax(0,1fr))]",
        ].join(" ")}
      >
        <StatTile
          label="Recurring cost / month"
          value={monthlyCost}
          currency={symbol}
          icon={
            <CategoryIcon
              icon="receipt"
              color="var(--color-app-expense-mark)"
            />
          }
        />
        <StatTile
          label="Recurring income / month"
          value={monthlyIncome}
          currency={symbol}
          tone="income"
          icon={<CategoryIcon icon="sack" color="var(--color-app-income)" />}
        />
        <StatTile
          label="Over a year"
          value={yearlyCost}
          currency={symbol}
          className={hasInvested ? "" : "col-span-2 lg:col-span-1"}
          sub={`${summary.activeCount} ${summary.activeCount === 1 ? "subscription" : "subscriptions"}`}
          icon={<CategoryIcon icon="calendar" color="var(--color-app-muted)" />}
        />
        {hasInvested && (
          <StatTile
            label="Recurring invested / month"
            value={monthlyInvested}
            currency={symbol}
            icon={
              <CategoryIcon icon="invest" color="var(--color-app-invest)" />
            }
          />
        )}
      </div>
      {summary.costSegments.length > 0 && (
        <div className="rounded-[var(--r-card)] bg-app-card p-5 sm:p-6 shadow-[var(--box-ring)]">
          <SplitBar
            segments={summary.costSegments}
            ariaLabel="Recurring costs split by subscription"
          />
        </div>
      )}
    </div>
  );
};
