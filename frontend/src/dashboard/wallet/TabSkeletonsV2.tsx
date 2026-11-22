import React from "react";
import { Skeleton } from "../../components/ui/Skeleton.tsx";
import { BudgetCardSkeletonV2 } from "../budget/BudgetCardSkeletonV2.tsx";
import { TabHeader } from "./TabHeader.tsx";

// Per-tab v2 loading fallbacks. Each mirrors the real tab's top-level v2 layout
// (classes copied from the tab). No chart-kit imports: this file is in the main chunk.

/** Statistics v2: real title + date picker placeholder, four summary tiles, chart cards (2/3 + 1/3). */
export const StatisticsTabSkeletonV2: React.FC = () => (
  <div role="status" aria-label="Loading statistics" className="flex flex-col">
    <TabHeader
      title="Statistics"
      actions={<Skeleton className="h-10 w-full sm:w-64" />}
    />
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Skeleton className="h-[92px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[92px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[92px] rounded-[var(--r-card)]" />
        <Skeleton className="col-span-2 h-[92px] rounded-[var(--r-card)] lg:col-span-1" />
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-[var(--r-card)] lg:col-span-2" />
        <Skeleton className="h-[360px] rounded-[var(--r-card)]" />
      </div>
    </div>
  </div>
);

/** Budget v2: real title, then the budget card grid (BudgetCard v2 shape). */
export const BudgetTabSkeletonV2: React.FC = () => (
  <div role="status" aria-label="Loading budgets" className="flex flex-col">
    <TabHeader title="Budgets" />
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      <BudgetCardSkeletonV2 />
      <BudgetCardSkeletonV2 />
      <BudgetCardSkeletonV2 />
    </div>
  </div>
);

/** Categories v2: real title, the category strip (count + chips), then two chart cards side by side. */
export const TagsTabSkeletonV2: React.FC = () => (
  <div
    role="status"
    aria-label="Loading categories"
    className="flex flex-col animate-[fadeIn_0.3s_ease-out]"
  >
    <TabHeader title="Categories" />
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
      <Skeleton className="h-[320px] rounded-[var(--r-card)]" />
      <Skeleton className="h-[320px] rounded-[var(--r-card)]" />
    </div>
  </div>
);

/** One settings box (v2 SettingsBox shape): display title, muted line, rows, footer button. */
const SettingsBoxSkeletonV2: React.FC<{ rows: number }> = ({ rows }) => (
  <div
    aria-hidden="true"
    className="flex flex-col gap-4 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6"
  >
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
    <Skeleton className="h-10 w-full self-center sm:w-48" />
  </div>
);

/** Settings v2: stacked boxes (General, Sharing, Notifications, Data, Danger zone). */
export const SettingsTabSkeletonV2: React.FC = () => (
  <div
    role="status"
    aria-label="Loading settings"
    className="flex w-full flex-col gap-6"
  >
    <SettingsBoxSkeletonV2 rows={2} />
    <SettingsBoxSkeletonV2 rows={2} />
    <SettingsBoxSkeletonV2 rows={3} />
    <SettingsBoxSkeletonV2 rows={1} />
  </div>
);
