import React from "react";
import SearchInput from "../ui/SearchInput";
import { useUiVersion } from "../../hooks/useUiVersion";

interface CurrencyDropdownPanelProps {
  popoverRef: React.RefObject<HTMLDivElement | null>;
  searchRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  dropdownStyle: React.CSSProperties;
  onClose: () => void;
  query: string;
  onQueryChange: (next: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  accentColor: string;
  mainCodes: readonly string[];
  otherCodes: string[];
  /** Flat filtered list while searching; null when the query is blank. */
  results: string[] | null;
  renderRow: (code: string, idx: number) => React.ReactNode;
}

const sectionLabel = (text: string, v2: boolean) => (
  <div
    aria-hidden="true"
    className={
      v2
        ? "px-4 pb-1 pt-2 text-xs font-medium text-app-faint"
        : "px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-app-muted"
    }
  >
    {text}
  </div>
);

/** Top-layer popover of CurrencySelector: search field + sectioned list. */
export const CurrencyDropdownPanel: React.FC<CurrencyDropdownPanelProps> = ({
  popoverRef,
  searchRef,
  listRef,
  dropdownStyle,
  onClose,
  query,
  onQueryChange,
  onSearchKeyDown,
  accentColor,
  mainCodes,
  otherCodes,
  results,
  renderRow,
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  return (
    <div
      ref={popoverRef}
      popover="manual"
      className="fixed inset-0 m-0 h-screen w-screen border-none bg-transparent p-0 z-[99999]"
    >
      {/* Invisible backdrop: click outside to close. */}
      <div
        className="absolute inset-0"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        style={dropdownStyle}
        className={`absolute z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out] ${
          v2
            ? "rounded-[var(--r-card)] bg-app-card shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]"
            : "rounded-xl border border-app-border bg-app-card shadow-2xl"
        }`}
      >
        <div className={v2 ? "p-2" : "border-b border-app-border p-2"}>
          <SearchInput
            ref={searchRef}
            value={query}
            onChange={onQueryChange}
            onKeyDown={onSearchKeyDown}
            color={v2 ? undefined : accentColor} // ui-v2-switch: wallet ring via class
            placeholder="Search currency…"
            aria-label="Search currency"
            heightClassName="h-10"
          />
        </div>

        {/* 'currency-scroll-container' keeps in-list scrolling from closing. */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Currencies"
          className="currency-scroll-container pointer-events-auto max-h-[240px] overflow-y-auto py-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        >
          {results ? (
            results.length > 0 ? (
              results.map((code, i) => renderRow(code, i))
            ) : (
              <div className="px-4 py-6 text-center text-sm text-app-muted">
                No currencies match “{query.trim()}”.
              </div>
            )
          ) : (
            <>
              {mainCodes.length > 0 && sectionLabel("Main currencies", v2)}
              {mainCodes.map((code, i) => renderRow(code, i))}
              {otherCodes.length > 0 && sectionLabel("Others", v2)}
              {otherCodes.map((code, i) =>
                renderRow(code, mainCodes.length + i),
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
