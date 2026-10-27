export type DateRangeValue = { start: Date | null; end: Date | null };
export type DatePickerValue = DateRangeValue | Date | null;
export type PresetType =
  "last30" | "month" | "year" | "all" | "custom" | "today";

// Sidebar presets shown above the divider ("Today" sits on its own below it).
export const mainPresets: { id: PresetType; label: string }[] = [
  { id: "last30", label: "Last 30 Days" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];
