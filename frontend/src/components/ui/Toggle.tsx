import React from "react";

export type ToggleVariant = "switch" | "button";
export type ToggleSize = "sm" | "md";

export interface ToggleProps {
  /** Controlled on/off state. */
  checked: boolean;
  /** Called with the next state when the user flips it. */
  onChange: (next: boolean) => void;
  /**
   * `switch` = sliding pill (iOS-style). `button` = a button that switches its
   * pressed on/off state.
   */
  variant?: ToggleVariant;
  size?: ToggleSize;
  disabled?: boolean;
  /** switch → text beside the pill · button → the button content. */
  label?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  variant = "switch",
  size = "md",
  disabled = false,
  label,
  className = "",
  "aria-label": ariaLabel,
}) => {
  const toggle = () => {
    if (!disabled) onChange(!checked);
  };

  // Button variant: a single button that switches its active state.
  if (variant === "button") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-[var(--r-cta)] border px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
          checked
            ? "border-transparent bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_34px_-16px_rgba(0,0,0,0.85)]"
            : "border-app-border bg-app-input text-app-muted hover:bg-app-hover hover:text-app-text"
        } ${className}`}
      >
        {label}
      </button>
    );
  }

  // Switch variant: sliding pill.
  const dims =
    size === "sm"
      ? {
          track: "h-5 w-9",
          knob: "h-3.5 w-3.5",
          on: "translate-x-4",
          off: "translate-x-1",
        }
      : {
          track: "h-6 w-11",
          knob: "h-4 w-4",
          on: "translate-x-6",
          off: "translate-x-1",
        };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={toggle}
      className={`group inline-flex items-center gap-2.5 border-0 bg-transparent p-0 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } select-none ${FOCUS} ${className}`}
    >
      <span
        className={`relative inline-flex ${dims.track} shrink-0 items-center rounded-full border border-white/10 transition-colors duration-200 ${
          checked
            ? "bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)]"
            : "bg-app-hover"
        }`}
      >
        <span
          className={`${dims.knob} inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? dims.on : dims.off
          }`}
        />
      </span>
      {label != null && (
        <span className="text-sm text-app-muted transition-colors group-hover:text-app-text">
          {label}
        </span>
      )}
    </button>
  );
};

export default Toggle;
