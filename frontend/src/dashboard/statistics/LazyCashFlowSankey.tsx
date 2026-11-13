import React, { lazy, Suspense } from "react";

// Lazy boundary: keeps the chart kit and MUI Sankey out of the main chunk (the PWA precache limit).
const CashFlowSankey = lazy(() =>
  import("./CashFlowSankey.tsx").then((m) => ({ default: m.CashFlowSankey })),
);

/** `CashFlowSankey`, code-split into its own chunk; shows a skeleton of the chart height while it loads. */
export const LazyCashFlowSankey: React.FC<
  React.ComponentProps<typeof CashFlowSankey>
> = (props) => (
  <Suspense
    fallback={
      <div className="h-[600px] bg-app-card rounded-[var(--r-card)] animate-pulse" />
    }
  >
    <CashFlowSankey {...props} />
  </Suspense>
);
