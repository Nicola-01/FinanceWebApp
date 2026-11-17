import React, { useMemo } from "react";
import type { Subscription } from "../../types/domain";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { SplitBar } from "../../components/ui/SplitBar.tsx";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/index.ts";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";
import { summarizeSubscriptions } from "./subscriptionSummary";

interface SubscriptionSummaryV2Props {
  subscriptions: Subscription[];
  currency: string;
  /** Investment tag names (see useInvestmentTags); their subscriptions are invested, not cost. */
  invest?: Set<string>;
}

/** v2 top box: recurring cost, yearly cost and income tiles, plus the cost split by subscription. */
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

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Recurring cost / month"
          value={summary.monthlyCost}
          currency={symbol}
          sub={
            summary.monthlyInvested > 0 ? (
              <>
                <AnimatedNumber
                  value={summary.monthlyInvested}
                  currency={symbol}
                />{" "}
                <span>Invested / month</span>
              </>
            ) : undefined
          }
        />
        <StatTile
          label="Over a year"
          value={summary.yearlyCost}
          currency={symbol}
        />
        <StatTile
          label="Recurring income / month"
          value={summary.monthlyIncome}
          currency={symbol}
          tone="income"
        />
      </div>
      {summary.costSegments.length > 0 && (
        <div className="rounded-[var(--r-card)] bg-app-card p-[18px] shadow-[var(--box-ring)]">
          <SplitBar
            segments={summary.costSegments}
            ariaLabel="Recurring costs split by subscription"
          />
        </div>
      )}
    </div>
  );
};
