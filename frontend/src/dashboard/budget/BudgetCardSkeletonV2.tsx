import React from "react";
import { Skeleton } from "../../components/ui/Skeleton.tsx";

/** v2 loading placeholder shaped like BudgetCard v2: header, arc gauge, hero line, facts. */
export const BudgetCardSkeletonV2: React.FC = () => (
  <div
    aria-hidden="true"
    className="flex flex-col gap-3 rounded-[var(--r-card)] bg-app-card p-5 shadow-[var(--box-ring)] sm:p-6"
  >
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-[11px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="mt-1 h-5 w-20 shrink-0 rounded-full" />
    </div>

    <div className="flex items-center gap-4 max-[379px]:flex-col">
      <Skeleton className="h-[120px] w-[120px] shrink-0 rounded-full sm:h-[128px] sm:w-[128px] max-[379px]:self-center" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 max-[379px]:w-full">
        <Skeleton className="h-6 w-1/2" />
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
    </div>
  </div>
);
