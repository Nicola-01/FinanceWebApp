import React from "react";
import { Plus, ArrowRight } from "lucide-react";
import { MICRO_EXPENSES } from "./landingDemoData";

/**
 * "The problem" band — visualises the core message: small expenses feel
 * harmless one by one, but added up over a month they are not small at all.
 */
const ProblemBand: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 max-w-6xl mx-auto relative">
      <div className="text-center mb-10">
        <div className="text-app-pink font-semibold tracking-wide uppercase text-sm mb-3">
          The problem
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-app-text">
          Small, one by one. Not so small, added up.
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* Micro-expense chips */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {MICRO_EXPENSES.map((e, i) => (
            <React.Fragment key={e.label}>
              {i > 0 && <Plus className="w-4 h-4 text-app-muted/60 shrink-0" />}
              <div className="flex items-center gap-2 rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 py-2 backdrop-blur-sm">
                <span className="text-lg leading-none">{e.emoji}</span>
                <span className="text-sm text-app-muted">{e.label}</span>
                <span className="font-app-mono tabular-nums text-sm font-semibold text-app-text">
                  €{e.amount.toFixed(2)}
                </span>
              </div>
            </React.Fragment>
          ))}
          <span className="text-app-muted/60 px-1 text-lg">…</span>
        </div>

        <ArrowRight className="hidden lg:block w-8 h-8 text-app-muted/50 shrink-0" />

        {/* Monthly total */}
        <div className="text-center rounded-[var(--r-card)] border border-app-purple/30 bg-gradient-to-br from-[var(--brand-1)]/10 to-[var(--brand-2)]/10 px-8 py-6 shrink-0">
          <div className="font-app-mono tabular-nums text-4xl md:text-5xl font-extrabold text-app-text">
            € 217
          </div>
          <div className="text-sm text-app-muted mt-1">every month</div>
        </div>
      </div>

      <p className="text-center text-app-muted mt-8 max-w-xl mx-auto">
        You don't notice them going out. FinanceWebApp makes sure you notice
        them adding up.
      </p>
    </section>
  );
};

export default ProblemBand;
