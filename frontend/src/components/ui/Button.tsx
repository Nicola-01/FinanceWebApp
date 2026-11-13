import React from "react";
import { useRipple } from "./useRipple";
import { useUiVersion } from "../../hooks/useUiVersion";
import { walletVars } from "../../utils/color";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Material-style ripple on press (reused from WalletCard). */
  ripple?: boolean;
  rippleColor?: string;
  /** Solid fill colour (e.g. `wallet.color` or a semantic token). Overrides the
   *  variant background with a flat fill + neutral shadow (no coloured glow). */
  accentColor?: string;
}

const BASE =
  "relative overflow-hidden inline-flex items-center justify-center gap-2 " +
  "font-semibold tracking-wide whitespace-nowrap select-none cursor-pointer " +
  "transition-[transform,filter,background-color,color,border-color] duration-200 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const SIZES: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-[var(--r-sm)]",
  md: "text-sm px-4 py-2.5 rounded-[var(--r-cta)]",
  lg: "text-[0.95rem] px-5 py-3 rounded-[var(--r-cta)]",
  // Square icon-only button: no label padding, icon centred by the base flex.
  icon: "h-9 w-9 p-0 rounded-[var(--r-input)]",
};

// No coloured glow — neutral depth shadow only.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] " +
    "shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 hover:brightness-[1.07] " +
    "hover:shadow-[0_18px_38px_-16px_rgba(0,0,0,0.85)] active:translate-y-0",
  secondary:
    "text-app-text bg-app-input border border-app-border hover:bg-app-hover " +
    "hover:shadow-[0_12px_26px_-16px_rgba(0,0,0,0.6)]",
  ghost: "text-app-muted hover:text-app-text hover:bg-app-hover",
  danger:
    "text-white bg-app-red shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)] hover:brightness-95 " +
    "hover:shadow-[0_18px_38px_-16px_rgba(0,0,0,0.85)]",
};

// Flat accent fill (colour supplied inline via `accentColor`) — same neutral
// depth/lift as `primary`, just no gradient. No coloured glow.
const ACCENT =
  "text-white shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 " +
  "hover:brightness-[1.07] hover:shadow-[0_18px_38px_-16px_rgba(0,0,0,0.85)] active:translate-y-0";

// v2: same as BASE without the tracked caps and with a 2px text-coloured outline focus.
const BASE_V2 =
  "relative overflow-hidden inline-flex items-center justify-center gap-2 " +
  "font-semibold whitespace-nowrap select-none cursor-pointer " +
  "transition-[transform,filter,background-color,color,border-color] duration-200 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-text";

// v2: flat fills, no glow/gradient/lift. Primary is the wallet colour (or the
// neutral inverse outside a wallet) via `bg-wallet text-on-wallet`.
const VARIANTS_V2: Record<ButtonVariant, string> = {
  primary: "bg-wallet text-on-wallet hover:brightness-[1.06]",
  secondary:
    "bg-app-card text-app-muted shadow-[var(--box-ring)] hover:text-app-text",
  ghost: "text-app-muted hover:bg-app-raised hover:text-app-text",
  danger: "bg-app-danger text-app-bg hover:brightness-95",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  ripple = false,
  rippleColor,
  accentColor,
  className = "",
  style,
  children,
  onPointerDown,
  ...props
}) => {
  const { ripples, spawnRipple } = useRipple();
  const [ui] = useUiVersion();
  const useAccent = Boolean(accentColor);
  const color =
    rippleColor ??
    (useAccent || variant === "primary" || variant === "danger"
      ? "rgba(255,255,255,0.45)"
      : "rgba(139,92,246,0.35)");

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (ripple && !props.disabled) spawnRipple(e);
    onPointerDown?.(e);
  };

  // ui-v2-switch
  const isV2 = ui === "v2";
  // ui-v2-switch
  const baseClass = isV2 ? BASE_V2 : BASE;
  // ui-v2-switch
  const variantClass = isV2
    ? useAccent
      ? VARIANTS_V2.primary
      : VARIANTS_V2[variant]
    : useAccent
      ? ACCENT
      : VARIANTS[variant];
  // ui-v2-switch
  const accentStyle: React.CSSProperties | undefined =
    isV2 && accentColor
      ? walletVars(accentColor)
      : useAccent
        ? { backgroundColor: accentColor }
        : undefined;

  return (
    <button
      {...props}
      onPointerDown={handlePointerDown}
      style={accentStyle ? { ...accentStyle, ...style } : style}
      className={`${baseClass} ${SIZES[size]} ${variantClass} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {ripple &&
        ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{
              top: r.y,
              left: r.x,
              width: 100,
              height: 100,
              marginTop: -50,
              marginLeft: -50,
              backgroundColor: color,
              animation: "custom-ripple 0.6s ease-out forwards",
            }}
          />
        ))}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default Button;
