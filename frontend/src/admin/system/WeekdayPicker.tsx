import React from "react";
import { DAYS } from "./jobSchedule";

export const WeekdayPicker: React.FC<{
  daysOfWeek: string[];
  onToggle: (token: string) => void;
}> = ({ daysOfWeek, onToggle }) => (
  <div className="flex items-center gap-1">
    {DAYS.map((d, i) => {
      const active = daysOfWeek.includes(d.token);
      return (
        <button
          key={`${d.token}-${i}`}
          type="button"
          onClick={() => onToggle(d.token)}
          aria-label={d.token}
          aria-pressed={active}
          className={`flex h-8 w-8 items-center justify-center rounded-[var(--r-sm)] text-xs font-bold transition-colors ${
            active
              ? "bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white"
              : "border border-app-border bg-app-input text-app-muted hover:text-app-text"
          }`}
        >
          {d.label}
        </button>
      );
    })}
  </div>
);
