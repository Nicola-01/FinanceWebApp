import React, { forwardRef } from "react";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon shown inside, on the left. */
  leadingIcon?: React.ReactNode;
  /** Node shown inside, on the right (e.g. a password-visibility toggle). */
  rightSlot?: React.ReactNode;
  /** Red border for validation errors. */
  invalid?: boolean;
  /** `sm` = compact chip-height field (inline editors). Default `md`. */
  inputSize?: "sm" | "md";
}

/**
 * Shared boxed input primitive. Theme-aware (uses app-* tokens) so it works in
 * both light and dark; on the always-dark auth screens it inherits the forced
 * dark tokens from the wrapper.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leadingIcon,
      rightSlot,
      invalid,
      inputSize = "md",
      className = "",
      ...props
    },
    ref,
  ) => {
    const [ui] = useUiVersion();
    const sm = inputSize === "sm";
    // ui-v2-switch
    const isV2 = ui === "v2";
    return (
      <div
        className={`relative flex items-center ${sm ? "rounded-[var(--r-sm)]" : "rounded-[var(--r-input)]"} ${
          // ui-v2-switch
          isV2
            ? `bg-app-raised transition-shadow duration-200 ${
                invalid
                  ? "ring-2 ring-app-danger"
                  : "focus-within:ring-2 focus-within:ring-wallet/40"
              }`
            : `border bg-app-input/70 transition-colors duration-200 ${
                invalid
                  ? "border-app-red"
                  : "border-app-border focus-within:border-[var(--brand-1)] focus-within:ring-1 focus-within:ring-[var(--brand-1)]/50"
              }`
        }`}
      >
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-app-muted">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full bg-transparent text-app-text outline-none ${
            // ui-v2-switch
            isV2
              ? "placeholder:text-app-faint tabular-nums"
              : "placeholder:text-app-muted"
          } ${sm ? "py-1.5 text-xs" : "py-2.5"} ${
            leadingIcon
              ? "pl-10"
              : sm
                ? "pl-2.5"
                : // ui-v2-switch
                  isV2
                  ? "pl-3"
                  : "pl-3.5"
          } ${
            rightSlot
              ? sm
                ? "pr-6"
                : "pr-11"
              : sm
                ? "pr-2.5"
                : // ui-v2-switch
                  isV2
                  ? "pr-3"
                  : "pr-3.5"
          } ${className}`}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-1.5 flex items-center">
            {rightSlot}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
