import React, { type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type CardTone = "default" | "danger";

export interface CardProps {
  /** Visual tone. `danger` = restrained red border + faint tint (no glow halo). */
  tone?: CardTone;
  /** Header icon. Omit `title` to render a plain, header-less card. */
  icon?: IconDefinition;
  /** Icon-chip accent (e.g. `wallet.color`). Ignored for `danger` (forced red). */
  iconColor?: string;
  title?: string;
  subtitle?: string;
  /** Optional lead paragraph under the header (e.g. the danger blurb). */
  description?: ReactNode;
  /** Center the header row + description (used by the danger card). */
  headerCentered?: boolean;
  /** Footer slot — pass a `<Button>`. Renders above a hairline divider. */
  footer?: ReactNode;
  /** Footer horizontal alignment. Default `end`. */
  footerAlign?: "start" | "center" | "end";
  children?: ReactNode;
  className?: string;
}

/**
 * Shared surface primitive: soft glass card (app-card + blur), `--r-card` radius,
 * a neutral depth shadow (no coloured glow), an optional header (icon chip +
 * title + subtitle), an optional lead `description`, and an optional `footer`
 * slot for a `<Button>`. `tone="danger"` swaps to a sober red border + faint tint.
 * Nested wells inside `children` should use `bg-app-surface` for contrast in light.
 */
export const Card: React.FC<CardProps> = ({
  tone = "default",
  icon,
  iconColor,
  title,
  subtitle,
  description,
  headerCentered,
  footer,
  footerAlign = "end",
  children,
  className = "",
}) => {
  const isDanger = tone === "danger";
  const hasHeader = Boolean(icon || title);
  const hasBody = Boolean(children);

  const surface = isDanger
    ? "border-app-red/30 bg-app-red/5"
    : "border-app-border bg-app-card/80";
  const divider = isDanger ? "border-app-red/20" : "border-app-border";

  const footerJustify =
    footerAlign === "start"
      ? "justify-start"
      : footerAlign === "center"
        ? "justify-center"
        : "justify-end";

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-[var(--r-card)] border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-20px_rgba(0,0,0,0.22)] backdrop-blur-md sm:gap-5 sm:p-6 ${surface} ${className}`}
    >
      {hasHeader && (
        <div
          className={`flex flex-col gap-1 ${
            hasBody || description ? `border-b pb-4 ${divider}` : ""
          }`}
        >
          <div
            className={`flex items-center gap-3 ${headerCentered ? "justify-center" : ""}`}
          >
            {icon && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] ${
                  isDanger ? "bg-app-red/10 text-app-red" : "bg-app-surface"
                }`}
                style={!isDanger ? { color: iconColor } : undefined}
              >
                <FontAwesomeIcon icon={icon} />
              </span>
            )}
            {title && (
              <h2
                className={`text-lg font-bold ${isDanger ? "text-app-red" : "text-app-text"}`}
              >
                {title}
              </h2>
            )}
          </div>
          {subtitle && (
            <p
              className={`text-sm text-app-muted ${headerCentered ? "text-center" : ""}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {description && (
        <div
          className={`text-sm text-app-muted ${headerCentered ? "text-center" : ""}`}
        >
          {description}
        </div>
      )}

      {hasBody && <div>{children}</div>}

      {footer && (
        <div
          className={`flex border-t pt-4 sm:pt-5 ${divider} ${footerJustify}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
