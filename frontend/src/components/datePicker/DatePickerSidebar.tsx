import React from "react";
import { mainPresets, type PresetType } from "./datePresets";

export interface DatePickerSidebarProps {
  preset: PresetType;
  setPreset: React.Dispatch<React.SetStateAction<PresetType>>;
  color: string;
  isDark: boolean;
}

/** Preset list (Last 30 Days / Month / Year / All / Custom + Today). */
export default function DatePickerSidebar({
  preset,
  setPreset,
  color,
  isDark,
}: DatePickerSidebarProps) {
  return (
    <div
      className={`flex flex-row sm:flex-col p-2 overflow-x-auto no-scrollbar sm:w-36 flex-shrink-0 border-b sm:border-b-0 sm:border-r ${isDark ? "theme-bg-neutral-dark theme-border-neutral" : "theme-bg-inverse-muted theme-border-inverse"}`}
    >
      <div className="flex flex-row sm:flex-col gap-1 flex-1">
        {mainPresets.map((p) => {
          const isSelected = preset === p.id;
          const btnBg = isSelected
            ? isDark
              ? "bg-app-hover text-app-text shadow-sm"
              : "bg-app-hover text-app-text shadow-sm"
            : "text-app-muted hover:bg-app-hover/50";
          return (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal ${btnBg}`}
              style={isSelected ? { color } : {}}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div
        className={`hidden sm:block h-px w-full my-2 ${isDark ? "theme-bg-neutral" : "theme-bg-inverse-subtle"}`}
      />
      <div
        className={`sm:hidden w-px h-auto mx-2 ${isDark ? "theme-bg-neutral" : "theme-bg-inverse-subtle"}`}
      />

      <div className="flex flex-row sm:flex-col gap-1">
        <button
          onClick={() => setPreset("today")}
          className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal ${
            preset === "today"
              ? isDark
                ? "bg-app-hover text-app-text shadow-sm"
                : "bg-app-hover text-app-text shadow-sm"
              : "text-app-muted hover:bg-app-hover/50"
          }`}
          style={preset === "today" ? { color } : {}}
        >
          Today
        </button>
      </div>
    </div>
  );
}
