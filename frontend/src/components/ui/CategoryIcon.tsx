import React from "react";
import { Icon } from "../icon/Icon.tsx";

interface CategoryIconProps {
  icon: string; // Icon key from the backend (e.g. "piggyBank")
  color: string; // Category colour; tints the tile and colours the glyph
  size?: "md" | "sm";
  title?: string; // Accessible name; omit for decorative use
  className?: string;
}

const SIZE_CLASS = {
  md: "h-10 w-10 rounded-[11px] text-base",
  sm: "h-8 w-8 rounded-[9px] text-[13px]",
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color,
  size = "md",
  title,
  className = "",
}) => (
  <span
    role={title ? "img" : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : "true"}
    className={`inline-grid shrink-0 place-items-center ${SIZE_CLASS[size]} ${className}`}
    style={
      {
        "--c": color,
        backgroundColor: "color-mix(in srgb, var(--c) 18%, transparent)",
        color: "color-mix(in srgb, var(--c) var(--glyph-mix, 100%), #000)",
      } as React.CSSProperties
    }
  >
    <Icon icon={icon} />
  </span>
);
