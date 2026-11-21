import React from "react";
import { Plus } from "lucide-react";
import { CategoryIcon } from "../../ui/CategoryIcon";
import { V2_MICRO_EXPENSES } from "../landingDemoData";

/** UI v2 "the problem" band: small expenses one by one, and the monthly total they add up to. */
const ProblemBandV2: React.FC = () => (
  <section className="border-t border-app-border px-4 py-14 text-center lg:px-8 lg:py-20">
    <div className="mx-auto max-w-6xl">
      <p className="mb-3 text-[13px] font-semibold text-app-muted">
        The problem
      </p>
      <h2 className="mx-auto max-w-[22ch] font-display text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-app-text lg:text-[42px]">
        Small, one by one. Not so small, added up.
      </h2>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
        {V2_MICRO_EXPENSES.map((e, i) => (
          <React.Fragment key={e.label}>
            {i > 0 && (
              <Plus
                className="h-4 w-4 shrink-0 text-app-faint"
                aria-hidden="true"
              />
            )}
            <div className="flex items-center gap-2.5 rounded-[var(--r-input)] bg-app-card py-1.5 pr-3.5 pl-1.5 shadow-[var(--box-ring)]">
              <CategoryIcon icon={e.icon} color={e.color} />
              <span className="text-sm text-app-muted">{e.label}</span>
              <span className="text-[15px] font-semibold text-app-text tabular-nums">
                €{e.amount.toFixed(2)}
              </span>
            </div>
          </React.Fragment>
        ))}
        <span className="px-1 text-lg text-app-faint">…</span>
      </div>

      <div className="mt-8 inline-flex flex-col items-center rounded-[var(--r-hero)] bg-wallet px-11 py-6 text-on-wallet">
        <span className="font-display text-[60px] leading-none font-bold tracking-[-0.02em] tabular-nums">
          €217
        </span>
        <span className="mt-2 text-[15px] opacity-80">every month</span>
      </div>

      <p className="mx-auto mt-6 max-w-xl text-[17px] text-app-muted">
        You don't notice them going out. FinanceWebApp makes sure you notice
        them adding up.
      </p>
    </div>
  </section>
);

export default ProblemBandV2;
