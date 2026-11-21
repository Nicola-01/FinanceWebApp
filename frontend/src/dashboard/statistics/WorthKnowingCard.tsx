import React from "react";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import { StatCard } from "./StatCard.tsx";
import type { Insight, InsightTone } from "./statisticsInsights.ts";

interface WorthKnowingCardProps {
  insights: Insight[];
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
  bare = false,
}) => {
  if (insights.length === 0) return null;

  return (
    <StatCard
      title="Worth knowing"
      subtitle="Computed from your transactions."
      bare={bare}
    >
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
    </StatCard>
  );
};
