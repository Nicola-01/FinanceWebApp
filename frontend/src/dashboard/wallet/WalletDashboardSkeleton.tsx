import React from "react";
import { Skeleton } from "../../components/ui/Skeleton.tsx";
import { SkeletonGroupV2 } from "../transaction/TransactionSkeletonV2.tsx";

/** v2 loading placeholder shaped like the wallet page: title, tabs, hero row, two transaction groups. */
export const WalletDashboardSkeleton: React.FC = () => (
  <div role="status" aria-label="Loading wallet" className="flex flex-col">
    {/* Title row (desktop only, like WalletHeaderV2) */}
    <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-[10px]" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>

    {/* Tab bar: pill-shaped segments */}
    <div className="mb-6 flex gap-2 overflow-hidden">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
      ))}
    </div>

    {/* Hero row, same grid as TransactionsHero (no investment tiles) */}
    <div className="mb-6 grid gap-3.5 lg:grid-cols-[2fr_1fr]">
      <Skeleton className="h-[196px] rounded-[var(--r-hero)]" />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-1">
        <Skeleton className="h-[92px] rounded-[var(--r-card)]" />
        <Skeleton className="h-[92px] rounded-[var(--r-card)]" />
      </div>
    </div>

    {/* Two day groups of transactions */}
    <div className="flex flex-col gap-3.5">
      <SkeletonGroupV2 />
      <SkeletonGroupV2 />
    </div>
  </div>
);
