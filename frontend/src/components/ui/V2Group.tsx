import React from "react";
import { Card } from "./Card";

/** ui-v2-switch: a group label above a flat divided card (no inner titles). */
export const V2Group: React.FC<{
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <section className="flex flex-col">
    <h3 className="mb-2 px-1 text-[13px] text-app-muted">{label}</h3>
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-col divide-y divide-app-border">{children}</div>
    </Card>
    {hint && <p className="mt-2 px-1 text-[13px] text-app-muted">{hint}</p>}
  </section>
);

/** ui-v2-switch: one toggle row — label + muted sub line left, switch right. */
export const V2ToggleRow: React.FC<{
  label: string;
  sub?: string;
  children: React.ReactNode;
}> = ({ label, sub, children }) => (
  <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
    <div className="min-w-0">
      <span className="block text-[15px] text-app-text">{label}</span>
      {sub && <span className="block text-[13px] text-app-muted">{sub}</span>}
    </div>
    {children}
  </div>
);
