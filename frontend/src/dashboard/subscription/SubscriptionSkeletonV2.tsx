import React from "react";
import { Skeleton } from "../../components/ui/Skeleton.tsx";

// v2 loading fallbacks for the subscriptions tab. Classes mirror
// SubscriptionSummaryV2, SplitBar and SubscriptionRowV2 so the layout does not jump.

/** One stat tile: icon chip + label, big amount, optional sub-line (StatTile v2 shape). */
const StatTileSkeleton: React.FC<{ withSub?: boolean; className?: string }> = ({
  withSub = false,
  className = "",
}) => (
  <div
    className={`min-w-0 overflow-hidden rounded-[16px] bg-app-card px-[18px] py-4 shadow-[var(--box-ring)] ${className}`}
  >
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-[9px] max-sm:h-7 max-sm:w-7" />
        <Skeleton className="h-3 w-32 max-w-full" />
      </div>
      <Skeleton className="h-[22px] w-24" />
      {withSub && <Skeleton className="h-3 w-20" />}
    </div>
  </div>
);

/** Summary slot: three stat tiles, then the cost split card (bar + legend lines). */
export const SubscriptionSummarySkeletonV2: React.FC = () => (
  <div
    data-testid="subscription-summary-skeleton"
    className="flex flex-col gap-3.5"
  >
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3.5 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
      <StatTileSkeleton />
      <StatTileSkeleton />
      <StatTileSkeleton withSub className="col-span-2 lg:col-span-1" />
    </div>
    <div className="rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6">
      <div className="grid gap-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex flex-wrap gap-x-[18px] gap-y-1.5">
          {[16, 12, 20, 14, 10].map((w, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="mr-1.5 h-[9px] w-[9px] rounded-[3px]" />
              <Skeleton className="h-3" style={{ width: `${w * 4}px` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/** One list row, sized like SubscriptionRowV2 (px-4 py-3, 40px icon chip). */
const RowSkeleton: React.FC = () => (
  <div className="flex w-full items-center gap-3 px-4 py-3">
    <Skeleton className="h-10 w-10 shrink-0 rounded-[11px]" />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Skeleton className="h-4 w-36 max-w-full" />
      <Skeleton className="h-3 w-44 max-w-full" />
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-14" />
    </div>
  </div>
);

/** List slot: two groups (label + card), one row and then four rows, as in SubscriptionListV2. */
export const SubscriptionListSkeletonV2: React.FC = () => (
  <div
    data-testid="subscription-list-skeleton"
    className="flex w-full flex-col gap-6"
  >
    <section className="flex flex-col gap-2">
      <Skeleton className="ml-1 h-3 w-20" />
      <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
        <RowSkeleton />
      </div>
    </section>
    <section className="flex flex-col gap-2">
      <Skeleton className="ml-1 h-3 w-24" />
      <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </section>
  </div>
);
