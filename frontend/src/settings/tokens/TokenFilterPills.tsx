import React from "react";
import type { FilterKey } from "./tokenHelpers";
import { Selector } from "../../components/ui/Selector";
import { useUiVersion } from "../../hooks/useUiVersion";

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
}) => {
  const [ui] = useUiVersion();

  // ui-v2-switch: single-choice filter → shared segmented control.
  if (ui === "v2") {
    return (
      <Selector<FilterKey>
        ariaLabel="Filter tokens"
        value={filter}
        onChange={onChange}
        fullWidth={false}
        options={filters.map((f) => ({
          value: f.key,
          label: (
            <>
              {f.label}
              <span className="ml-1.5 tabular-nums text-app-muted">
                {f.count}
              </span>
            </>
          ),
        }))}
      />
    );
  }

  return (
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
};
