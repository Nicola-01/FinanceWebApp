import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faStar } from "@fortawesome/free-solid-svg-icons";
import type { CurrencyMeta } from "../../utils/currencies";

interface CurrencyOptionRowProps {
  code: string;
  data: CurrencyMeta;
  idx: number;
  isSelected: boolean;
  isActive: boolean;
  isStarred: boolean;
  accentColor: string;
  onHover: (idx: number) => void;
  onSelect: (code: string) => void;
  /** Providing it turns on the per-row star button. */
  onToggleStar?: (code: string) => void;
}

/** One `role="option"` row of the CurrencySelector list. */
export const CurrencyOptionRow: React.FC<CurrencyOptionRowProps> = ({
  code,
  data,
  idx,
  isSelected,
  isActive,
  isStarred,
  accentColor,
  onHover,
  onSelect,
  onToggleStar,
}) => (
  <div
    role="option"
    aria-selected={isSelected}
    data-idx={idx}
    className={`group flex cursor-pointer items-center border-l-2 px-4 py-2.5 text-sm transition-colors ${
      isSelected
        ? ""
        : `border-transparent text-app-text ${
            isActive ? "bg-app-hover" : "hover:bg-app-surface"
          }`
    }`}
    style={
      isSelected
        ? {
            borderLeftColor: accentColor,
            backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            color: accentColor,
          }
        : undefined
    }
    onMouseEnter={() => onHover(idx)}
    // onMouseDown fires before the input blurs, so the pick lands instantly.
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(code);
    }}
  >
    <span className="inline-block w-[30px] shrink-0 font-bold">
      {data.symbol}
    </span>
    <span className="min-w-0 flex-1 truncate">
      {data.name} <span className="text-app-muted">({code})</span>
    </span>
    {onToggleStar ? (
      <button
        type="button"
        tabIndex={-1}
        aria-pressed={isStarred}
        aria-label={
          isStarred
            ? `Remove ${code} as default currency`
            : `Set ${code} as default currency`
        }
        title={
          isStarred
            ? "Default foreign currency"
            : "Set as default foreign currency"
        }
        className={`ml-2 shrink-0 rounded p-1 text-xs transition-opacity ${
          isStarred
            ? "opacity-100"
            : "text-app-muted opacity-30 group-hover:opacity-70"
        }`}
        // Explicit accent only when starred; otherwise the muted class above
        // keeps it grey (never inherits the selected row's accent colour).
        style={isStarred ? { color: accentColor } : undefined}
        // The star also picks the currency (one action: set default + select).
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleStar(code);
          onSelect(code);
        }}
      >
        <FontAwesomeIcon icon={faStar} />
      </button>
    ) : (
      isSelected && (
        <FontAwesomeIcon icon={faCheck} className="ml-2 shrink-0 text-xs" />
      )
    )}
  </div>
);
