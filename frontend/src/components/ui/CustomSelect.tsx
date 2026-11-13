import React, { useState, useRef } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { ChevronDown, Check } from "lucide-react";
import { useUiVersion } from "../../hooks/useUiVersion";

// Shared visible focus ring — same treatment as `Button`/`Toggle`.
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

// v2: 2px outline in the text colour (same as v2 `Button`/`Selector`).
const FOCUS_V2 =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-text";

export interface CustomSelectOption {
  value: string;
  /** Display content — a plain string or rich node (e.g. an icon + label). */
  label: React.ReactNode;
}

export interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  className?: string;
  dropdownAlign?: "left" | "right";
  activeColor?: string;
  /** Extra content under the options (e.g. a "Manage …" action); `close` closes the list. */
  footer?: (close: () => void) => React.ReactNode;
  /** While open, the trigger becomes a search input filtering the options (like the tag picker). */
  searchable?: boolean;
  /** Shown in the trigger when nothing is selected. */
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  className = "",
  dropdownAlign = "left",
  activeColor,
  footer,
  searchable = false,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [ui] = useUiVersion();
  // ui-v2-switch
  const isV2 = ui === "v2";
  const focus = isV2 ? FOCUS_V2 : FOCUS;

  const selectedOption = options.find((opt) => opt.value === value);

  useOutsideClick(containerRef, () => setIsOpen(false));

  const toggle = () => {
    if (!isOpen) setQuery("");
    setIsOpen(!isOpen);
  };

  const q = query.trim().toLowerCase();
  const visibleOptions =
    searchable && q
      ? options.filter((opt) =>
          (typeof opt.label === "string" ? opt.label : opt.value)
            .toLowerCase()
            .includes(q),
        )
      : options;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center ${className}`}
    >
      {searchable && isOpen ? (
        <div className="w-full h-full flex items-center justify-between gap-1">
          {/* Not auto-focused: on mobile the keyboard stays down until tapped. */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tap to search..."
            className={`w-full bg-transparent outline-none ${isV2 ? "text-app-text placeholder:text-app-faint" : "placeholder:text-app-muted"}`}
          />
          <button
            type="button"
            onClick={toggle}
            aria-label="Close"
            className={`rounded-[var(--r-sm)] ${focus}`}
          >
            <ChevronDown
              size={14}
              className="flex-shrink-0 text-app-muted rotate-180"
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className={`w-full h-full flex items-center justify-between gap-1 rounded-[var(--r-sm)] ${focus}`}
        >
          {selectedOption?.label || value ? (
            <span className="truncate">{selectedOption?.label || value}</span>
          ) : (
            <span className="truncate text-app-muted">{placeholder}</span>
          )}
          <ChevronDown
            size={14}
            className={`flex-shrink-0 text-app-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute top-full ${dropdownAlign === "left" ? "left-0" : "right-0"} mt-2 z-[100] w-full max-h-64 overflow-y-auto min-w-[140px] py-1 animate-[fadeIn_0.15s_ease-out] ${
            // ui-v2-switch
            isV2
              ? "bg-app-card rounded-[var(--r-card)] shadow-[0_8px_24px_rgb(0_0_0/0.25)]"
              : "bg-app-card border border-app-border rounded-[var(--r-input)] shadow-xl"
          }`}
        >
          {visibleOptions.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${focus} ${
                  // ui-v2-switch: selected row = raised fill + check; no accent colour.
                  isV2
                    ? `flex items-center justify-between gap-3 text-app-text hover:bg-app-raised ${selected ? "bg-app-raised font-semibold" : "font-medium"}`
                    : selected
                      ? `bg-app-hover font-bold ${!activeColor ? "text-app-text" : ""}`
                      : "text-app-text hover:bg-app-hover/50 font-medium"
                }`}
                style={
                  !isV2 && selected && activeColor ? { color: activeColor } : {}
                }
              >
                {isV2 ? (
                  <>
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {selected && (
                      <Check
                        size={14}
                        className="flex-shrink-0 text-app-text"
                      />
                    )}
                  </>
                ) : (
                  opt.label
                )}
              </button>
            );
          })}
          {footer && (
            <div className="px-1 pb-1">{footer(() => setIsOpen(false))}</div>
          )}
        </div>
      )}
    </div>
  );
};
