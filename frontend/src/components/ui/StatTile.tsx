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
      "min-w-0 overflow-hidden rounded-[16px] bg-app-card px-[18px] py-4 shadow-[var(--box-ring)] " +
      className
    }
  >
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2.5 text-[13px] text-app-muted">
        {icon && (
          <div className="shrink-0 [&>*]:h-8 [&>*]:w-8 max-sm:[&>*]:h-7 max-sm:[&>*]:w-7">
            {icon}
          </div>
        )}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div
        data-stat-value
        className={
          "font-display whitespace-nowrap text-[length:var(--stat-value-size,22px)] max-sm:text-[length:min(var(--stat-value-size,20px),20px)] leading-[1.1] font-[650] tracking-[-0.02em] " +
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
      {sub && (
        <div className="text-[13px] leading-tight text-app-faint">{sub}</div>
      )}
      {footer}
    </div>
  </div>
);
