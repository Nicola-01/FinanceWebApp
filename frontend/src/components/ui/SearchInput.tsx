import React, { forwardRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useUiVersion } from "../../hooks/useUiVersion";

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
      color,
      variant = "boxed",
      heightClassName = "h-11",
      type = "text",
      placeholder = "Search...",
      className = "",
      ...props
    },
    ref,
  ) => {
    const [ui] = useUiVersion();
    const isV2 = ui === "v2"; // ui-v2-switch
    const [focused, setFocused] = useState(false);
    const hasValue = value.length > 0;

    const surfaceClass = isV2 // ui-v2-switch
      ? "bg-app-raised"
      : variant === "plain"
        ? "bg-app-input"
        : "border border-app-border bg-app-input/70";

    const accent = color ?? "var(--brand-1)";
    // Accent ring on focus (works for both variants; `borderColor` is a no-op
    // for `plain` since it has no border). v2 has no border: the wallet ring
    // comes from a class, and an explicit `color` becomes a 2px ring at ~40%.
    const focusStyle = focused
      ? isV2 // ui-v2-switch
        ? color
          ? { boxShadow: `0 0 0 2px ${color}66` }
          : undefined
        : { boxShadow: `0 0 0 1px ${accent}`, borderColor: accent }
      : undefined;

    const clear = () => (onClear ? onClear() : onChange(""));

    return (
      <div
        className={`relative flex items-center transition-colors ${
          isV2 // ui-v2-switch
            ? "rounded-[var(--r-input)] focus-within:ring-2 focus-within:ring-wallet/40"
            : "rounded-xl"
        } ${surfaceClass} ${heightClassName}`}
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
          className={`h-full w-full rounded-xl border-0 bg-transparent pl-10 text-sm text-app-text outline-none ${
            isV2 // ui-v2-switch
              ? "placeholder:text-app-faint tabular-nums"
              : "placeholder:text-app-muted"
          } ${hasValue ? "pr-10" : "pr-3"} ${className}`}
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
