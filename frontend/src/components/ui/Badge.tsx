import React, { type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type BadgeTone =
  "neutral" | "green" | "red" | "yellow" | "blue" | "purple" | "pink" | "brand";
export type BadgeVariant = "soft" | "subtle" | "outline";
export type BadgeShape = "pill" | "rounded" | "square";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic colour. Ignored when `color` (arbitrary hex) is passed. */
  tone?: BadgeTone;
  /** `soft` = tinted fill + border · `subtle` = flat neutral, no border ·
   *  `outline` = transparent fill + border. */
  variant?: BadgeVariant;
  /** `pill` (rounded-full) · `rounded` (rounded-md) · `square` (`--r-sm`). */
  shape?: BadgeShape;
  size?: BadgeSize;
  /** UPPERCASE + wider tracking (status chips). */
  uppercase?: boolean;
  /** `font-app-mono` + `tabular-nums` — for count badges. */
  mono?: boolean;
  /** Leading FontAwesome icon. */
  icon?: IconDefinition;
  /** Arbitrary accent (e.g. `wallet.color`); tints bg/text/border inline and
   *  overrides `tone`. */
  color?: string;
  children: ReactNode;
}

// Soft tinted look (bg + text + border). Full class strings so Tailwind keeps them.
const SOFT: Record<BadgeTone, string> = {
  neutral: "bg-app-input text-app-muted border-app-border",
  green: "bg-app-green/15 text-app-green border-app-green/40",
  red: "bg-app-red/15 text-app-red border-app-red/40",
  yellow: "bg-app-yellow/15 text-app-yellow border-app-yellow/40",
  blue: "bg-app-blue/15 text-app-blue border-app-blue/40",
  purple: "bg-app-purple/15 text-app-purple border-app-purple/40",
  pink: "bg-app-pink/15 text-app-pink border-app-pink/40",
  brand:
    "bg-[var(--brand-1)]/15 text-[var(--brand-1)] border-[var(--brand-1)]/40",
};

// Transparent fill, coloured (or neutral) text + border.
const OUTLINE: Record<BadgeTone, string> = {
  neutral: "text-app-muted border-app-border",
  green: "text-app-green border-app-green/40",
  red: "text-app-red border-app-red/40",
  yellow: "text-app-yellow border-app-yellow/40",
  blue: "text-app-blue border-app-blue/40",
  purple: "text-app-purple border-app-purple/40",
  pink: "text-app-pink border-app-pink/40",
  brand: "text-[var(--brand-1)] border-[var(--brand-1)]/40",
};

// Flat neutral chip (count badges); tone only tints the text.
const SUBTLE: Record<BadgeTone, string> = {
  neutral: "bg-app-input text-app-muted",
  green: "bg-app-green/15 text-app-green",
  red: "bg-app-red/15 text-app-red",
  yellow: "bg-app-yellow/15 text-app-yellow",
  blue: "bg-app-blue/15 text-app-blue",
  purple: "bg-app-purple/15 text-app-purple",
  pink: "bg-app-pink/15 text-app-pink",
  brand: "bg-[var(--brand-1)]/15 text-[var(--brand-1)]",
};

const SHAPE: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-md",
  square: "rounded-[var(--r-sm)]",
};

const SIZE: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
};

/**
 * Generic status / count chip. Replaces the ~30 hand-rolled
 * `rounded-full bg-app-<tone>/15 ...` spans scattered across the app. For a
 * colour-driven *tag* chip (icon + parent chain) use `TagBadge` instead.
 */
export const Badge: React.FC<BadgeProps> = ({
  tone = "neutral",
  variant = "soft",
  shape = "pill",
  size = "sm",
  uppercase = false,
  mono = false,
  icon,
  color,
  className = "",
  style,
  children,
  ...rest
}) => {
  const useColor = Boolean(color);
  // A border is drawn for soft/outline (and any arbitrary-colour badge).
  const hasBorder = useColor || variant !== "subtle";

  const toneClass = useColor
    ? ""
    : variant === "subtle"
      ? SUBTLE[tone]
      : variant === "outline"
        ? OUTLINE[tone]
        : SOFT[tone];

  const colorStyle: React.CSSProperties | undefined = useColor
    ? {
        color,
        backgroundColor: variant === "outline" ? undefined : `${color}26`,
        borderColor: `${color}66`,
        ...style,
      }
    : style;

  return (
    <span
      {...rest}
      style={colorStyle}
      className={`inline-flex items-center gap-1.5 font-bold whitespace-nowrap ${SHAPE[shape]} ${SIZE[size]} ${hasBorder ? "border" : ""} ${toneClass} ${uppercase ? "uppercase tracking-wider" : ""} ${mono ? "font-app-mono tabular-nums" : ""} ${className}`}
    >
      {icon && (
        <FontAwesomeIcon icon={icon} className="shrink-0 text-[0.85em]" />
      )}
      {children}
    </span>
  );
};

export default Badge;
