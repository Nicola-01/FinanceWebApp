import React, { forwardRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "color"
> {
  /** Current query (controlled). */
  value: string;
  /** Called with the new query string on every keystroke. */
  onChange: (value: string) => void;
  /** Called when the clear (×) button is pressed. Defaults to `onChange("")`. */
  onClear?: () => void;
  /** Accent colour for the focus ring (e.g. `wallet.color`). Defaults to brand. */
  color?: string;
  /**
   * `boxed` = visible border (use inside dropdowns/cards where the field bg
   * matches the surface). `plain` = borderless (use on glass bars, where a
   * resting border reads as noise). Both show an accent ring on focus.
   */
  variant?: "plain" | "boxed";
  /** Height utility for the field wrapper (default `h-11`). */
  heightClassName?: string;
}

/**
 * Shared search field primitive: leading magnifier, a clear (×) button that
 * appears when there's text and keeps focus, and an accent focus ring. Used by
 * the transactions search and the tag filter so they stay consistent.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      color = "var(--brand-1)",
      variant = "boxed",
      heightClassName = "h-11",
      type = "text",
      placeholder = "Search...",
      className = "",
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const hasValue = value.length > 0;

    const surfaceClass =
      variant === "plain"
        ? "bg-app-input"
        : "border border-app-border bg-app-input/70";

    // Accent ring on focus (works for both variants; `borderColor` is a no-op
    // for `plain` since it has no border).
    const focusStyle = focused
      ? { boxShadow: `0 0 0 1px ${color}`, borderColor: color }
      : undefined;

    const clear = () => (onClear ? onClear() : onChange(""));

    return (
      <div
        className={`relative flex items-center rounded-xl transition-colors ${surfaceClass} ${heightClassName}`}
        style={focusStyle}
      >
        <span className="pointer-events-none absolute left-3 flex items-center text-app-muted">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
        </span>

        <input
          ref={ref}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`h-full w-full rounded-xl border-0 bg-transparent pl-10 text-sm text-app-text outline-none placeholder:text-app-muted ${
            hasValue ? "pr-10" : "pr-3"
          } ${className}`}
          {...props}
        />

        {hasValue && (
          <button
            type="button"
            // Prevent the input from blurring before the click clears it.
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="absolute right-0 flex h-full items-center pr-3 text-app-muted transition-colors hover:text-app-text"
            aria-label="Clear search"
            title="Clear search"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
