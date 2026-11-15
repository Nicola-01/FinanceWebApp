import React, { lazy, Suspense } from "react";

// Lazy boundary: keeps the chart kit out of the main chunk (the PWA precache limit).
const HeroTrend = lazy(() =>
  import("./HeroTrend.tsx").then((m) => ({ default: m.HeroTrend })),
);

/** `HeroTrend`, code-split into its own chunk; shows a skeleton of the chart height while it loads. */
export const LazyHeroTrend: React.FC<React.ComponentProps<typeof HeroTrend>> = (
  props,
) => (
  <Suspense fallback={<div className="h-14" />}>
    <HeroTrend {...props} />
  </Suspense>
);
