import React from "react";

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

export const Selector = <T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  fullWidth = true,
  accentColor,
  className = "",
}: SelectorProps<T>) => {
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
