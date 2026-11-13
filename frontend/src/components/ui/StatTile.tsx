import React from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "./AnimatedNumber.tsx";

export interface StatTileProps {
  label: string;
  /** A number is animated via AnimatedNumber (kind/currency/signed apply); other nodes render as given. */
  value: number | React.ReactNode;
  kind?: AnimatedNumberProps["kind"];
  currency?: string;
  signed?: boolean;
  icon?: React.ReactNode;
  sub?: React.ReactNode;
  /** Rendered under `sub` (e.g. a sparkline). */
  footer?: React.ReactNode;
  tone?: "default" | "income";
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  kind,
  currency,
  signed,
  icon,
  sub,
  footer,
  tone = "default",
  className = "",
}) => (
  <div
    className={
      "rounded-[16px] bg-app-card px-[18px] py-4 shadow-[var(--box-ring)] " +
      (icon
        ? "grid grid-cols-[40px_1fr] items-center gap-3 max-sm:grid-cols-1 "
        : "") +
      className
    }
  >
    {icon && <div className="max-sm:hidden">{icon}</div>}
    <div className="min-w-0">
      <div className="text-[13px] text-app-muted">{label}</div>
      <div
        className={
          "font-display text-[26px] leading-[1.1] font-[650] tracking-[-0.02em] max-sm:text-xl " +
          (tone === "income" ? "text-app-income" : "")
        }
      >
        {typeof value === "number" ? (
          <AnimatedNumber
            value={value}
            kind={kind}
            currency={currency}
            signed={signed}
            intro
          />
        ) : (
          value
        )}
      </div>
      {sub && <div className="text-[13px] text-app-faint">{sub}</div>}
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  </div>
);
