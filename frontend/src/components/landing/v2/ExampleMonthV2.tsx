import React from "react";
import { StatTile } from "../../ui/StatTile";

/** UI v2 "Example month" strip: before/after framing and three example numbers. */
const ExampleMonthV2: React.FC = () => (
  <section className="border-t border-app-border px-4 py-14 lg:px-8 lg:py-20">
    <div className="mx-auto max-w-6xl">
      <p className="mb-3 text-[13px] font-semibold text-app-muted">
        Example month
      </p>
      <h2 className="font-display text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-app-text lg:text-[42px]">
        A better month, in three numbers.
      </h2>

      <div className="mt-8 grid gap-4 text-[15px] sm:grid-cols-2">
        <div className="rounded-[var(--r-card)] bg-app-card px-5 py-4 shadow-[var(--box-ring)]">
          <b className="mb-1 block text-xs font-semibold text-app-faint">
            Before
          </b>
          A bank balance and a feeling about where it went.
        </div>
        <div className="rounded-[var(--r-card)] bg-app-card px-5 py-4 shadow-[var(--box-ring)]">
          <b className="mb-1 block text-xs font-semibold text-app-faint">
            After
          </b>
          Every euro named, every renewal seen, a clear number kept.
        </div>
      </div>

      <div
        className="mt-6 grid gap-4 sm:grid-cols-3"
        style={{ "--stat-value-size": "56px" } as React.CSSProperties}
      >
        <StatTile label="of small leaks found" value="€217" />
        <StatTile label="renewals caught before they hit" value="3" />
        <StatTile
          label="kept at the end of the month"
          value="€412"
          tone="income"
        />
      </div>
      <p className="mt-3 text-xs text-app-faint">
        Example month, not real data.
      </p>
    </div>
  </section>
);

export default ExampleMonthV2;
