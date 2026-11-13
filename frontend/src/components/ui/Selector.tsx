import React from "react";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface SelectorOption<T extends string | number> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  activeColorClass?: string;
  activeBgClass?: string;
  disabled?: boolean;
  disabledTitle?: string;
  /** Tooltip + accessible name — use for icon-only options that have no label. */
  title?: string;
  style?: React.CSSProperties;
  /**
   * v2 only: the inactive state uses this instead of the default muted text
   * colour. Ignored in v1.
   */
  className?: string;
}

export interface SelectorProps<T extends string | number> {
  options: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  /**
   * Flat accent fill for the active segment (e.g. `wallet.color`) — mirrors
   * `Button`/`Toggle`. The active segment gets a solid accent background + white
   * text; per-option `activeBgClass`/`activeColorClass` still win over it.
   */
  accentColor?: string;
  className?: string;
}

// Shared visible focus ring — same treatment as `Button`/`Toggle`.
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
  "focus-visible:ring-offset-1 focus-visible:ring-offset-transparent";

// v2 focus: 2px outline in the text colour.
const FOCUS_V2 =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-text";

export const Selector = <T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = true,
  accentColor,
  className = "",
}: SelectorProps<T>) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";

  // ui-v2-switch
  if (isV2) {
    const v2ContainerSize =
      size === "sm" ? "h-8 p-0.5" : size === "lg" ? "h-12 p-1" : "h-10 p-1";
    const v2ButtonSize =
      size === "sm"
        ? "text-[10px] rounded-[9px] gap-1.5"
        : size === "lg"
          ? "text-sm rounded-[9px] gap-2"
          : "text-xs rounded-[9px] gap-2";

    return (
      <div
        className={`grid grid-flow-col auto-cols-fr bg-app-card shadow-[var(--box-ring)] rounded-[12px] ${v2ContainerSize} ${fullWidth ? "w-full" : ""} ${className}`}
      >
        {options.map((option) => {
          const isActive = value === option.value;
          const isDisabled = option.disabled;

          const currentClass = isDisabled
            ? "opacity-40 cursor-not-allowed text-app-muted font-semibold"
            : isActive
              ? `${option.activeBgClass || "bg-app-raised"} ${option.activeColorClass || "text-app-text"} font-semibold`
              : `${option.className ?? "text-app-muted hover:text-app-text"} font-medium`;

          // Active icon takes the wallet colour; the segment itself never fills.
          const iconClass =
            isActive && !accentColor
              ? "flex items-center justify-center text-wallet"
              : "flex items-center justify-center";
          const iconStyle =
            isActive && accentColor ? { color: accentColor } : undefined;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              title={isDisabled ? option.disabledTitle : option.title}
              className={`flex-1 flex items-center justify-center transition-all px-2 ${FOCUS_V2} ${v2ButtonSize} ${currentClass}`}
              style={option.style}
            >
              {option.icon && (
                <span className={iconClass} style={iconStyle}>
                  {option.icon}
                </span>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  const containerSizeClass =
    size === "sm"
      ? "h-8 rounded-lg p-0.5"
      : size === "lg"
        ? "h-12 rounded-xl p-1"
        : "h-10 rounded-lg p-1";

  const buttonSizeClass =
    size === "sm"
      ? "text-[10px] rounded gap-1.5"
      : size === "lg"
        ? "text-sm rounded-lg gap-2"
        : "text-xs rounded-md gap-2";

  const containerClassName = `grid grid-flow-col auto-cols-fr bg-app-input border border-app-border shadow-inner ${containerSizeClass} ${fullWidth ? "w-full" : ""} ${className}`;

  const inactiveClassName = "text-app-muted hover:text-app-text";

  const useAccent = Boolean(accentColor);
  // Default active look: raised neutral surface (sober). With `accentColor`,
  // the fill comes from the inline style below and the text goes white.
  const defaultActiveBg = useAccent ? "" : "bg-app-surface";
  const defaultActiveText = useAccent ? "text-white" : "text-app-text";

  return (
    <div className={containerClassName}>
      {options.map((option) => {
        const isActive = value === option.value;
        const isDisabled = option.disabled;

        let currentClass = isActive
          ? `${option.activeBgClass || defaultActiveBg} ${option.activeColorClass || defaultActiveText} shadow-sm font-bold`
          : `${inactiveClassName} font-semibold`;

        if (isDisabled) {
          currentClass =
            "opacity-40 cursor-not-allowed text-app-muted font-semibold";
        }

        // Flat accent fill only when active, accent requested and the option
        // doesn't pin its own background.
        const accentStyle =
          isActive && useAccent && !option.activeBgClass
            ? { backgroundColor: accentColor }
            : undefined;

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => !isDisabled && onChange(option.value)}
            disabled={isDisabled}
            title={isDisabled ? option.disabledTitle : option.title}
            className={`flex-1 flex items-center justify-center transition-all px-2 ${FOCUS} ${buttonSizeClass} ${currentClass}`}
            style={{ ...accentStyle, ...option.style }}
          >
            {option.icon && (
              <span className="flex items-center justify-center">
                {option.icon}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
