import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// Shared visible focus ring — same treatment as `Button`/`Toggle`.
const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  className = "",
  dropdownAlign = "left",
  activeColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full flex items-center justify-between gap-1 rounded-[var(--r-sm)] ${FOCUS}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-app-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full ${dropdownAlign === "left" ? "left-0" : "right-0"} mt-2 z-[100] w-full bg-app-card border border-app-border rounded-[var(--r-input)] shadow-xl overflow-hidden min-w-[140px] py-1 animate-[fadeIn_0.15s_ease-out]`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${FOCUS} ${
                value === opt.value
                  ? `bg-app-hover font-bold ${!activeColor ? "text-app-text" : ""}`
                  : "text-app-text hover:bg-app-hover/50 font-medium"
              }`}
              style={
                value === opt.value && activeColor ? { color: activeColor } : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
