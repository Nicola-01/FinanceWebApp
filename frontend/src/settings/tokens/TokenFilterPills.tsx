import React from "react";
import type { FilterKey } from "./tokenHelpers";

interface Props {
  filters: { key: FilterKey; label: string; count: number }[];
  filter: FilterKey;
  onChange: (key: FilterKey) => void;
}

/** Toolbar: All / Manual / MCP filter pills with counts. */
export const TokenFilterPills: React.FC<Props> = ({
  filters,
  filter,
  onChange,
}) => (
  <div className="mb-4 flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input p-1">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={`rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-bold transition-colors ${
            filter === f.key
              ? "bg-app-surface text-app-text"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          {f.label}
          <span className="ml-1.5 text-app-muted">{f.count}</span>
        </button>
      ))}
    </div>
  </div>
);
