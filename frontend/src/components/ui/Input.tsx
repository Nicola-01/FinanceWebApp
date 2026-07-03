import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon shown inside, on the left. */
  leadingIcon?: React.ReactNode;
  /** Node shown inside, on the right (e.g. a password-visibility toggle). */
  rightSlot?: React.ReactNode;
  /** Red border for validation errors. */
  invalid?: boolean;
}

/**
 * Shared boxed input primitive. Theme-aware (uses app-* tokens) so it works in
 * both light and dark; on the always-dark auth screens it inherits the forced
 * dark tokens from the wrapper.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, rightSlot, invalid, className = "", ...props }, ref) => {
    return (
      <div
        className={`relative flex items-center rounded-[var(--r-input)] border bg-app-input/70 transition-colors duration-200 ${
          invalid
            ? "border-app-red"
            : "border-app-border focus-within:border-[var(--brand-1)] focus-within:ring-1 focus-within:ring-[var(--brand-1)]/50"
        }`}
      >
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-app-muted">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full bg-transparent py-2.5 text-app-text outline-none placeholder:text-app-muted ${
            leadingIcon ? "pl-10" : "pl-3.5"
          } ${rightSlot ? "pr-11" : "pr-3.5"} ${className}`}
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
