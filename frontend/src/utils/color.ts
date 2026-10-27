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
