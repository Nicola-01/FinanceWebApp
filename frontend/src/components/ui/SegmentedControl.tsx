import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  MotionHighlight,
  MotionHighlightItem,
} from "@/components/shadcn/motion-highlight";
import { cn } from "@/lib/utils";
import { walletVars } from "../../utils/color";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Tooltip + aria-label when there's no label (icon-only options). */
  title?: string;
  style?: React.CSSProperties;
  /** Inactive text colour override (default "text-app-muted hover:text-app-text"). */
  className?: string;
  /** Text colour class when chosen (default "text-app-text"), e.g. "text-app-income". */
  activeClassName?: string;
}

interface SegmentedControlProps<T extends string | number> {
  /** "" = nothing chosen yet (no highlight). */
  value: T | "";
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  "aria-label": string;
  size?: "sm" | "md" | "lg";
  /** Equal-width columns across the full width of the container. */
  fullWidth?: boolean;
  /** Classes on the outer list. */
  className?: string;
  highlightClassName?: string;
  /** Accent for the highlight (e.g. `wallet.color`); the chosen text turns `text-on-wallet`. */
  accentColor?: string;
}

const sizeClass = {
  sm: "h-8 px-2 text-[11px]",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

const DEFAULT_HIGHLIGHT =
  "rounded-[var(--r-input)] bg-app-card shadow-[var(--box-ring)]";
// ui-v2-switch: v2 pill is lighter than the raised track in dark, and gets a
// hairline shadow in light so a white pill on a white card still reads.
const DEFAULT_HIGHLIGHT_V2 =
  "rounded-[var(--r-input)] bg-app-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] [.dark_&]:bg-[color-mix(in_srgb,var(--color-app-raised),#fff_8%)]";
const ACCENT_HIGHLIGHT = "rounded-[var(--r-input)] bg-wallet";

/**
 * Animated segmented control: one highlight slides behind the chosen option.
 * The v2 animated alternative to `Selector`, built on the shadcn Tabs and
 * Motion Highlight primitives.
 */
export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  size = "md",
  fullWidth = false,
  className,
  highlightClassName,
  accentColor,
}: SegmentedControlProps<T>) {
  const [ui] = useUiVersion();
  const defaultHighlight =
    ui === "v2" ? DEFAULT_HIGHLIGHT_V2 : DEFAULT_HIGHLIGHT;
  const highlight =
    highlightClassName ?? (accentColor ? ACCENT_HIGHLIGHT : defaultHighlight);
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as T)}
      style={accentColor ? walletVars(accentColor) : undefined}
    >
      <TabsList
        aria-label={ariaLabel}
        className={cn(
          "h-auto rounded-[var(--r-card)] bg-app-raised p-1 gap-1",
          fullWidth && "w-full",
          className,
        )}
      >
        {/* Inside the list: the highlight must paint above the list's background. */}
        <MotionHighlight
          value={String(value)}
          highlightClassName={highlight}
          className={cn("grid gap-1", fullWidth && "w-full")}
          style={
            fullWidth
              ? {
                  gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))`,
                }
              : { gridAutoFlow: "column", gridAutoColumns: "max-content" }
          }
        >
          {options.map((opt) => {
            const isActive = value === opt.value;
            // Icon-only options: the title is the accessible name.
            const iconOnlyTitle = opt.label ? undefined : opt.title;
            return (
              <MotionHighlightItem
                key={String(opt.value)}
                value={String(opt.value)}
                disabled={opt.disabled}
                asChild
              >
                <TabsTrigger
                  value={opt.value}
                  disabled={opt.disabled}
                  title={opt.title}
                  aria-label={iconOnlyTitle}
                  style={opt.style}
                  className={cn(
                    "gap-2 font-medium data-active:bg-transparent data-active:shadow-none dark:data-active:bg-transparent dark:data-active:border-transparent",
                    sizeClass[size],
                    isActive
                      ? (opt.activeClassName ??
                          (accentColor ? "text-on-wallet" : "text-app-text"))
                      : (opt.className ?? "text-app-muted hover:text-app-text"),
                    !opt.activeClassName &&
                      (accentColor
                        ? "[&[data-active]_svg]:text-on-wallet"
                        : // Light: darken like category glyphs (70% + #000) so pale wallet colours stay legible; dark keeps the raw wallet colour.
                          "[&[data-active]_svg]:text-[color-mix(in_srgb,var(--wallet),#000_30%)] [.dark_&[data-active]_svg]:text-wallet"),
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </TabsTrigger>
              </MotionHighlightItem>
            );
          })}
        </MotionHighlight>
      </TabsList>
    </Tabs>
  );
}
