import React from "react";

/**
 * v2 wallet-tab title row. Owns the space below the title (`mb-6`), so every
 * tab puts its content the same distance under the heading. `actions` sit on
 * the right; on phones they wrap under the title when they ask for full width.
 */
export const TabHeader: React.FC<{
  title: string;
  actions?: React.ReactNode;
}> = ({ title, actions }) => (
  <div className="mb-6 flex min-h-10 flex-wrap items-center justify-between gap-3">
    <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
      {title}
    </h2>
    {actions}
  </div>
);
