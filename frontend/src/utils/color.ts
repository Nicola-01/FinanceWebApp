import type React from "react";

/** `#rrggbb` → `rgba(r, g, b, alpha)`; empty input falls back to spring green. */
export const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex) return `rgba(0, 255, 127, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const FALLBACK_HEX = "#8b5cf6";

/** Resolve any CSS colour string (hex, rgb(), var(--x), named) to `#rrggbb`. */
export function toHex(input: string): string {
  const value = (input || "").trim();
  const short = /^#([0-9a-f]{3})$/i.exec(value);
  if (short) {
    return (
      "#" +
      short[1]
        .split("")
        .map((c) => c + c)
        .join("")
        .toLowerCase()
    );
  }
  if (/^#([0-9a-f]{6})$/i.test(value)) return value.toLowerCase();

  if (typeof document === "undefined") return FALLBACK_HEX;
  try {
    const el = document.createElement("span");
    el.style.color = value;
    el.style.display = "none";
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color; // "rgb(r, g, b)"
    document.body.removeChild(el);
    const parts = computed.match(/\d+(\.\d+)?/g);
    if (!parts || parts.length < 3) return FALLBACK_HEX;
    const [r, g, b] = parts.map((n) => Math.round(parseFloat(n)));
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  } catch {
    return FALLBACK_HEX;
  }
}

/** Text colour that stays readable on a solid `hex` fill (wallet card, CTA): dark ink on light colours, white otherwise. */
export function onColor(hex: string): "#1d1a10" | "#ffffff" {
  const h = toHex(hex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  // Rec. 709 luma on the gamma-encoded channels — the threshold the v2 mockup validated.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? "#1d1a10" : "#ffffff";
}

/** Inline CSS vars that make a subtree use `color` as its wallet accent (`bg-wallet`, `text-on-wallet`, …). */
export const walletVars = (color: string): React.CSSProperties =>
  ({ "--wallet": color, "--on-wallet": onColor(color) }) as React.CSSProperties;
