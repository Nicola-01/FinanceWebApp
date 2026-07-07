import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Card } from "../components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
}

/**
 * Compact stat cell for the admin stat strip. Sober glass surface, a small
 * brand-tinted icon chip and the value in tabular mono — no saturated fills,
 * no coloured glow (accent outside a wallet = brand gradient).
 */
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-gradient-to-br from-[var(--brand-1)]/20 to-[var(--brand-2)]/20 text-[var(--brand-1)]">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-app-muted">
            {title}
          </span>
          <span className="font-app-mono text-2xl font-bold leading-tight text-app-text">
            {value}
          </span>
        </div>
      </div>
    </Card>
  );
};
