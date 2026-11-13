import React from "react";
import type { KitSeries } from "./kitChartData.ts";

/** Legend under a kit chart: a dot and label per series. */
export const KitLegend: React.FC<{ series: KitSeries[] }> = ({ series }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-3">
    {series.map((s) => (
      <div key={s.key} className="flex items-center gap-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: s.color }}
        />
        <span className="text-[13px] text-app-muted">{s.label}</span>
      </div>
    ))}
  </div>
);

export const KitNoData: React.FC = () => (
  <div className="flex items-center justify-center h-[300px] text-app-muted">
    No data available.
  </div>
);
