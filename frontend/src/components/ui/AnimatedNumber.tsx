import NumberFlow, { type Format } from "@number-flow/react";
import { useEffect, useState } from "react";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

export interface AnimatedNumberProps {
  value: number;
  /** "amount": 2 decimals (or `decimals`); "percent": whole number + "%"; "plain": no unit. */
  kind?: "amount" | "percent" | "plain";
  /** Currency symbol, appended after a space (amounts only). */
  currency?: string;
  /** "+" / U+2212 minus prefix, as `formatAmount(value, { signed: true })`. */
  signed?: boolean;
  /** Fraction digits for amounts and plain numbers (default 2). */
  decimals?: number;
  /** Start from 0 on mount and roll up to `value` (hero cards and summary tiles). */
  intro?: boolean;
  className?: string;
}

const LOCALE = "it-IT";

/**
 * A number that tweens between values (NumberFlow) in v2; plain static text in v1, identical
 * to `formatAmount` output. NumberFlow respects prefers-reduced-motion by default.
 */
export const AnimatedNumber = ({
  value,
  kind = "amount",
  currency,
  signed = false,
  decimals = 2,
  intro = false,
  className,
}: AnimatedNumberProps) => {
  const [ui] = useUiVersion();
  const [introDone, setIntroDone] = useState(!intro);
  useEffect(() => {
    if (!intro) return;
    // One frame after mount, so NumberFlow has rendered 0 and tweens to the value.
    const frame = requestAnimationFrame(() => {
      setIntroDone(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [intro]);

  const percent = kind === "percent";
  const abs = signed ? Math.abs(value) : value;
  const sign = signed && value !== 0 ? (value > 0 ? "+" : "−") : "";
  const format: Format = percent
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  const prefix = sign;
  const suffix = percent
    ? "%"
    : kind === "amount" && currency
      ? ` ${currency}`
      : "";
  const text = `${prefix}${new Intl.NumberFormat(LOCALE, format).format(abs)}${suffix}`;

  // ui-v2-switch
  if (ui === "v1") return <>{text}</>;

  return (
    <NumberFlow
      aria-label={text}
      className={className}
      format={format}
      locales={LOCALE}
      prefix={prefix}
      suffix={suffix}
      value={introDone ? abs : 0}
      willChange
    />
  );
};
