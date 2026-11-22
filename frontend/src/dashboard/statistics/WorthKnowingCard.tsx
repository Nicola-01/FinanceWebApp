import React from "react";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { StatCard } from "./StatCard.tsx";
import { Skeleton } from "../../components/ui/Skeleton.tsx";
import type { Insight, InsightTone } from "./statisticsInsights.ts";

interface WorthKnowingCardProps {
  insights: Insight[];
  /** Insights are still loading: show skeleton lines instead of the empty card. */
  loading?: boolean;
  /** Render without the card shell + heading (the parent group card provides them). */
  bare?: boolean;
}

const TONE_ICON: Record<InsightTone, { icon: string; color: string }> = {
  danger: { icon: "exclamation", color: "var(--color-app-danger)" },
  income: { icon: "invest", color: "var(--color-app-income)" },
  recurring: { icon: "calendar", color: "var(--color-app-expense-mark)" },
  neutral: { icon: "scale", color: "var(--color-app-muted)" },
};

export const WorthKnowingCard: React.FC<WorthKnowingCardProps> = ({
  insights,
  loading = false,
  bare = false,
}) => {
  if (!loading && insights.length === 0) return null;

  return (
    <StatCard
      title="Worth knowing"
      subtitle="Computed from your transactions."
      bare={bare}
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {insights.map((insight, index) => {
            const { icon, color } = TONE_ICON[insight.tone];
            return (
              <li
                key={insight.id}
                className={`flex gap-3 py-3 first:pt-0 last:pb-0 ${index > 0 ? "border-t border-app-border" : ""}`}
              >
                <CategoryIcon icon={icon} color={color} size="sm" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-app-text">
                    {insight.title}
                  </p>
                  <p className="text-[13px] text-app-muted">{insight.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </StatCard>
  );
};
