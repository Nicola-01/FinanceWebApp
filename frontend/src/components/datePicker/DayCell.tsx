import React from "react";
import { format, isSameMonth, isSameDay, isAfter, isBefore } from "date-fns";
import type { PresetType } from "./datePresets";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface DayCellProps {
  day: Date;
  monthStart: Date;
  startDate: Date | null;
  endDate: Date | null;
  onClick?: () => void;
  isRange: boolean;
  preset: PresetType;
  color: string;
  isDark: boolean;
  disableDaySelection?: boolean;
}

export default function DayCell({
  day,
  monthStart,
  startDate,
  endDate,
  onClick,
  isRange,
  preset,
  color,
  isDark,
  disableDaySelection,
}: DayCellProps) {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const isCurrentMonth = isSameMonth(day, monthStart);
  const isToday = isSameDay(day, new Date());

  const isStart =
    !disableDaySelection &&
    startDate &&
    isSameDay(day, startDate) &&
    preset !== "all";
  const isEnd =
    !disableDaySelection &&
    endDate &&
    isSameDay(day, endDate) &&
    preset !== "all";
  const isSelected = isStart || isEnd;

  const isBetween =
    !disableDaySelection &&
    ((startDate &&
      endDate &&
      isAfter(day, startDate) &&
      isBefore(day, endDate)) ||
      preset === "all");

  let cellStyles =
    "relative flex items-center justify-center h-10 w-full text-sm transition-all ";
  let textStyles = "z-10 ";
  const inlineStyles: React.CSSProperties = {};

  if (isV2) {
    // ui-v2-switch: the wallet colour arrives as --wallet/--on-wallet, so the
    // fill and text colour live on the cell and no inline styles are needed.
    if (!isCurrentMonth) {
      cellStyles += "text-app-faint pointer-events-none ";
    } else {
      if (onClick) cellStyles += "cursor-pointer ";
      if (isSelected) {
        cellStyles +=
          "bg-wallet text-on-wallet font-semibold rounded-[var(--r-sm)] ";
      } else {
        cellStyles += "text-app-text ";
        if (isBetween)
          cellStyles +=
            "bg-[color-mix(in_srgb,var(--wallet)_16%,transparent)] ";
        else if (onClick)
          cellStyles += "hover:bg-app-raised rounded-[var(--r-sm)] ";
        if (isToday)
          cellStyles +=
            "font-semibold ring-1 ring-inset ring-app-border rounded-[var(--r-sm)] ";
      }
    }
  } else if (!isCurrentMonth) {
    cellStyles += isDark
      ? "theme-text-subtle pointer-events-none "
      : "theme-text-muted pointer-events-none ";
  } else {
    if (onClick) cellStyles += "cursor-pointer ";
    textStyles += isDark
      ? "theme-text-muted hover:theme-text-default "
      : "theme-text-subtle hover:theme-text-inverse ";

    if (isSelected) {
      textStyles += "font-bold theme-text-default ";
      inlineStyles.backgroundColor = color;

      if (isRange && isStart && isEnd) cellStyles += "rounded-full ";
      else if (isRange && isStart && endDate) cellStyles += "rounded-l-full ";
      else if (isRange && isEnd && startDate) cellStyles += "rounded-r-full ";
      else cellStyles += "rounded-full ";
    } else if (isBetween) {
      inlineStyles.backgroundColor = `${color}33`;
      textStyles += isDark ? "theme-text-default " : "theme-text-inverse ";
    } else {
      if (onClick)
        cellStyles += isDark
          ? "hover:theme-bg-neutral-dark rounded-full "
          : "hover:theme-bg-inverse-muted rounded-full ";
    }

    if (isToday && !isSelected) {
      textStyles += "font-bold ";
      if (!isBetween) inlineStyles.color = color;
    }
  }

  return (
    <div
      className={cellStyles}
      style={inlineStyles}
      onClick={isCurrentMonth ? onClick : undefined}
    >
      {isSelected && !isV2 && (
        <div
          className="absolute inset-2 rounded-full"
          style={{ backgroundColor: color, zIndex: 0 }}
        ></div>
      )}

      <span className={textStyles} style={{ zIndex: 10, position: "relative" }}>
        {format(day, "d")}
      </span>

      {isCurrentMonth && isToday && !isV2 && (
        <div
          className="absolute bottom-1 w-1 h-1 rounded-full"
          style={{ backgroundColor: isSelected ? "#fff" : color, zIndex: 10 }}
        ></div>
      )}
    </div>
  );
}
