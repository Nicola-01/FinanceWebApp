import React from "react";
import { CategoryIcon } from "../../components/ui/CategoryIcon.tsx";
import type { Insight, InsightTone } from "./statisticsInsights.ts";

interface WorthKnowingCardProps {
  insights: Insight[];
}

const TONE_ICON: Record<InsightTone, { icon: string; color: string }> = {
  danger: { icon: "exclamation", color: "var(--color-app-danger)" },
  income: { icon: "invest", color: "var(--color-app-income)" },
  recurring: { icon: "calendar", color: "var(--color-app-expense-mark)" },
  neutral: { icon: "scale", color: "var(--color-app-muted)" },
};

export const WorthKnowingCard: React.FC<WorthKnowingCardProps> = ({
  insights,
}) => {
  if (insights.length === 0) return null;

  return (
    <section className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4">
      <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
        Worth knowing
      </h3>
      <p className="text-[13px] text-app-muted mt-0.5">
        Computed from your transactions.
      </p>
      <ul className="mt-3">
        {insights.map((insight, index) => {
          const { icon, color } = TONE_ICON[insight.tone];
          return (
            <li
              key={insight.id}
              className={`flex gap-3 py-3 ${index > 0 ? "border-t border-app-border" : ""}`}
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
    </section>
  );
};
