import React from "react";
import { mainPresets, type PresetType } from "./datePresets";
import { useUiVersion } from "../../hooks/useUiVersion";

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
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 rows are flat; the active one is a raised fill, no accent text.
  const isV2 = ui === "v2";

  const renderPreset = (id: PresetType, label: string) => {
    const isSelected = preset === id;
    const btnBg = isV2
      ? isSelected
        ? "bg-app-raised text-app-text"
        : "text-app-muted hover:bg-app-raised"
      : isSelected
        ? "bg-app-hover text-app-text shadow-sm"
        : "text-app-muted hover:bg-app-hover/50";
    return (
      <button
        key={id}
        onClick={() => setPreset(id)}
        className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal ${btnBg}`}
        style={isSelected && !isV2 ? { color } : {}}
      >
        {label}
      </button>
    );
  };

  const dividerBg = isV2
    ? "bg-app-border"
    : isDark
      ? "theme-bg-neutral"
      : "theme-bg-inverse-subtle";

  return (
    <div
      className={`flex flex-row sm:flex-col p-2 overflow-x-auto no-scrollbar sm:w-36 flex-shrink-0 ${
        // ui-v2-switch
        isV2
          ? ""
          : `border-b sm:border-b-0 sm:border-r ${isDark ? "theme-bg-neutral-dark theme-border-neutral" : "theme-bg-inverse-muted theme-border-inverse"}`
      }`}
    >
      <div className="flex flex-row sm:flex-col gap-1 flex-1">
        {mainPresets.map((p) => renderPreset(p.id, p.label))}
      </div>

      <div className={`hidden sm:block h-px w-full my-2 ${dividerBg}`} />
      <div className={`sm:hidden w-px h-auto mx-2 ${dividerBg}`} />

      <div className="flex flex-row sm:flex-col gap-1">
        {renderPreset("today", "Today")}
      </div>
    </div>
  );
}
