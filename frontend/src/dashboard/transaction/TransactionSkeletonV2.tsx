import { Skeleton } from "../../components/ui/Skeleton.tsx";

/** v2 loading placeholder: one surface box with three rows shaped like TransactionRowV2. */
export const SkeletonGroupV2 = () => (
  <div
    aria-hidden="true"
    className="rounded-[var(--r-card)] bg-app-card p-2 shadow-[var(--box-ring)]"
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5"
      >
        <Skeleton className="h-10 w-10 rounded-[11px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);
