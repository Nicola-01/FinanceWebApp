import React, { forwardRef, useState } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Red border for validation errors (takes priority over `accentColor`). */
  invalid?: boolean;
  /** Per-wallet accent (hex, e.g. `wallet.color`). When set, the focus border +
   *  ring use it instead of the global brand; falls back to brand-1 when absent. */
  accentColor?: string;
  /** Allow the user to drag-resize vertically. Off by default (the app's fields
   *  are fixed-height; grow via `rows`/`min-h-*` instead). */
  resizable?: boolean;
}

/**
 * Shared boxed textarea primitive — the multi-line sibling of {@link Input}.
 * Theme-aware (app-* tokens) so it works in both light and dark; non-resizable
 * by default. The focus border/ring follow `accentColor` (the wallet colour) when
 * given, else the global brand-1 — mirroring how `Button` takes an inline accent
 * (Tailwind can't resolve a runtime hex, so it's applied via `style` on focus).
 * Extra sizing (e.g. a taller field) goes through `className` (`min-h-*`), merged last.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      invalid,
      accentColor,
      resizable = false,
      rows = 2,
      className = "",
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const useAccent = Boolean(accentColor) && !invalid;
    // Match Input's focus look (full border + a 1px ~50% ring) with the wallet hex.
    const accentStyle: React.CSSProperties =
      useAccent && focused
        ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}80` }
        : {};

    return (
      <textarea
        ref={ref}
        rows={rows}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{ ...accentStyle, ...style }}
        className={`w-full rounded-[var(--r-input)] border bg-app-input/70 px-3.5 py-2.5 text-app-text outline-none transition-colors duration-200 placeholder:text-app-muted ${
          resizable ? "resize-y" : "resize-none"
        } ${
          invalid
            ? "border-app-red"
            : useAccent
              ? "border-app-border"
              : "border-app-border focus:border-[var(--brand-1)] focus:ring-1 focus:ring-[var(--brand-1)]/50"
        } ${className}`}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
