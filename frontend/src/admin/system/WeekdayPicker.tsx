import React from "react";
import { DAYS } from "./jobSchedule";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../../components/ui/Button";

export const WeekdayPicker: React.FC<{
  daysOfWeek: string[];
  onToggle: (token: string) => void;
}> = ({ daysOfWeek, onToggle }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: shared Button segments instead of hand-rolled toggles.
  if (ui === "v2") {
    return (
      <div className="flex items-center gap-1">
        {DAYS.map((d, i) => {
          const active = daysOfWeek.includes(d.token);
          return (
            <Button
              key={`${d.token}-${i}`}
              type="button"
              size="sm"
              variant={active ? "primary" : "secondary"}
              onClick={() => onToggle(d.token)}
              aria-label={d.token}
              aria-pressed={active}
              className="w-8 px-0"
            >
              {d.label}
            </Button>
          );
        })}
      </div>
    );
  }
  return (
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
};
