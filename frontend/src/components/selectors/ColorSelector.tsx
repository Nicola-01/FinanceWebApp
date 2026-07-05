import React, { useEffect, useMemo, useRef, useState } from "react";
import { Wheel, ShadeSlider, hexToHsva, hsvaToHex } from "@uiw/react-color";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { getRecentColors, pushRecentColor } from "../../utils/recentColors";

// 12 presets in chromatic order (rainbow). Concrete hex so the wheel, the hex
// field and the recents all stay hex-consistent. The three that used to be CSS
// vars resolve to their token values: red-500 / green-500 / sky-500.
const COLOR_PRESETS = [
  "#ef4444", // Red        (--color-app-red)
  "#ff8c00", // Orange
  "#ffff00", // Yellow
  "#adff2f", // Yellow-Green
  "#22c55e", // Green      (--color-app-green)
  "#00ffff", // Cyan
  "#0ea5e9", // Sky        (--color-app-sky)
  "#1e90ff", // Blue
  "#8a2be2", // Purple
  "#ff00ff", // Magenta
  "#ff1493", // Hot Pink
  "#ff0055", // Dark Pink/Red
];

// Presets are never remembered as "recent" colours.
const PRESET_SET = new Set(COLOR_PRESETS.map((c) => c.toLowerCase()));

const FALLBACK_HEX = "#8b5cf6";

/** Resolve any CSS colour string (hex, rgb(), var(--x), named) to `#rrggbb`. */
function toHex(input: string): string {
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

interface ColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
}

/** A colour swatch (preset or recent) with a neutral selected ring (no glow). */
const Swatch: React.FC<{
  color: string;
  selected: boolean;
  onClick: () => void;
}> = ({ color, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={color}
    aria-pressed={selected}
    className="h-7 w-7 rounded-full transition-transform duration-150 hover:scale-110"
    style={{
      backgroundColor: color,
      // Neutral offset ring on selection — no coloured glow (style guide).
      boxShadow: selected
        ? "0 0 0 2px var(--color-app-card), 0 0 0 4px var(--color-app-text)"
        : "none",
    }}
  />
);

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  value,
  onChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recents] = useState<string[]>(() => getRecentColors());

  // Concrete hex used by the wheel / shade / hex field. The swatch preview
  // still shows the raw `value` so legacy var/named colours render truthfully.
  const hex = useMemo(() => toHex(value), [value]);
  const hsva = useMemo(() => hexToHsva(hex), [hex]);

  // Local draft for the hex field (the 6 digits, without the leading '#') so
  // typing a partial value doesn't spam onChange. Synced when `value` changes.
  const [hexDraft, setHexDraft] = useState(() => hex.slice(1).toUpperCase());
  useEffect(() => {
    setHexDraft(hex.slice(1).toUpperCase());
  }, [hex]);

  // Persist the final colour to recents when the picker unmounts (popup closed
  // or tab switched away) — but never a preset. A ref keeps the cleanup reading
  // the latest value.
  const latestRef = useRef(hex);
  useEffect(() => {
    latestRef.current = hex;
  }, [hex]);
  useEffect(() => {
    return () => {
      const finalHex = latestRef.current.toLowerCase();
      if (!PRESET_SET.has(finalHex)) pushRecentColor(finalHex);
    };
  }, []);

  const commitHex = () => {
    const digits = hexDraft.trim();
    const normalized =
      digits.length === 3
        ? digits
            .split("")
            .map((c) => c + c)
            .join("")
        : digits;
    if (/^[0-9a-f]{6}$/i.test(normalized)) {
      onChange("#" + normalized.toLowerCase());
    } else {
      setHexDraft(hex.slice(1).toUpperCase()); // revert invalid input
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Presets */}
      <div className="grid grid-cols-6 gap-3">
        {COLOR_PRESETS.map((color) => (
          <Swatch
            key={color}
            color={color}
            selected={hex === toHex(color)}
            onClick={() => onChange(color)}
          />
        ))}
      </div>

      {/* Recent colours — shown only when there are some (presets excluded) */}
      {recents.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted/70">
            Recent
          </span>
          <div className="grid grid-cols-6 gap-3">
            {recents.map((color, i) => (
              <Swatch
                key={`${color}-${i}`}
                color={color}
                selected={hex === toHex(color)}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Advanced toggle (divider style) */}
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        aria-expanded={showAdvanced}
        className="flex w-full items-center gap-3 text-app-muted transition-colors hover:text-app-text"
      >
        <span className="h-px flex-grow bg-app-border" />
        <span className="flex items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-wider">
          Advanced
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-[0.6rem] transition-transform ${showAdvanced ? "rotate-180" : ""}`}
          />
        </span>
        <span className="h-px flex-grow bg-app-border" />
      </button>

      {/* Advanced panel: colour wheel + brightness + editable hex */}
      {showAdvanced && (
        <div className="flex animate-[fadeIn_0.2s_ease-out] flex-col items-center gap-3">
          <Wheel
            color={hex}
            onChange={(c) => onChange(c.hex)}
            width={150}
            height={150}
          />

          <div className="flex w-full flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted/70">
              Brightness
            </span>
            <ShadeSlider
              hsva={hsva}
              height={14}
              radius={7}
              onChange={(newShade) =>
                onChange(hsvaToHex({ ...hsva, ...newShade }))
              }
            />
          </div>

          {/* Current colour + editable hex */}
          <div className="flex w-full items-center gap-2">
            <span
              className="h-8 w-8 shrink-0 rounded-[var(--r-sm)] border border-app-border"
              style={{ backgroundColor: value }}
            />
            <div className="flex flex-1 items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input px-2.5 py-1.5 focus-within:border-app-purple/60">
              <span className="font-app-mono text-sm text-app-muted">#</span>
              <input
                value={hexDraft}
                onChange={(e) =>
                  setHexDraft(
                    e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6),
                  )
                }
                onBlur={commitHex}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitHex();
                  }
                }}
                spellCheck={false}
                aria-label="Hex colour"
                className="w-full min-w-0 bg-transparent font-app-mono text-sm uppercase tracking-wide text-app-text outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
