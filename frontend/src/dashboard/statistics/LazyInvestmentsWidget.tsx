import React, { lazy, Suspense } from "react";

// Lazy boundary: keeps the widget out of the main chunk (the PWA precache limit).
const InvestmentsWidget = lazy(() =>
  import("./InvestmentsWidget.tsx").then((m) => ({
    default: m.InvestmentsWidget,
  })),
);

/** `InvestmentsWidget`, code-split into its own chunk; shows a skeleton while it loads. */
export const LazyInvestmentsWidget: React.FC<
  React.ComponentProps<typeof InvestmentsWidget>
> = (props) => (
  <Suspense
    fallback={
      <div className="h-[260px] bg-app-card rounded-[var(--r-card)] animate-pulse" />
    }
  >
    <InvestmentsWidget {...props} />
  </Suspense>
);
