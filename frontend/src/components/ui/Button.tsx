import React, { useState } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

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

interface RippleItem {
  x: number;
  y: number;
  id: number;
}

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
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const useAccent = Boolean(accentColor);
  const color =
    rippleColor ??
    (useAccent || variant === "primary" || variant === "danger"
      ? "rgba(255,255,255,0.45)"
      : "rgba(139,92,246,0.35)");

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (ripple && !props.disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const item: RippleItem = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: Date.now(),
      };
      setRipples((prev) => [...prev, item]);
      setTimeout(
        () => setRipples((prev) => prev.filter((r) => r.id !== item.id)),
        600,
      );
    }
    onPointerDown?.(e);
  };

  return (
    <button
      {...props}
      onPointerDown={handlePointerDown}
      style={useAccent ? { backgroundColor: accentColor, ...style } : style}
      className={`${BASE} ${SIZES[size]} ${useAccent ? ACCENT : VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
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
