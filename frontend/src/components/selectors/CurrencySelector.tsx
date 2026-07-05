import React, { useState, useRef, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faCheck,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import {
  CURRENCY_META,
  MAIN_CURRENCY_CODES,
  getCurrencies,
  type CurrencyCode,
  type CurrencyMeta,
} from "../../utils/currencies";
import SearchInput from "../ui/SearchInput";

interface CurrencySelectorProps {
  value: CurrencyCode | string;
  onChange: (currency: CurrencyCode) => void;
  excludeCurrency?: CurrencyCode;
  /** Accent for the open border + selected row (e.g. wallet.color). */
  accentColor?: string;
  /**
   * The starred code (rendered with a filled accent star). Together with
   * `onToggleStar` this enables the per-row "set as default" star. When
   * `onToggleStar` is omitted, no star UI is shown at all.
   */
  starredCurrency?: string;
  /** Star / un-star a currency. Providing it turns on the per-row star button. */
  onToggleStar?: (code: string) => void;
}

const MAIN_SET = new Set(MAIN_CURRENCY_CODES);

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  excludeCurrency,
  accentColor = "var(--color-app-green)",
  starredCurrency,
  onToggleStar,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [query, setQuery] = useState("");
  // Starts with the curated set (instant), then hydrates the long tail on open.
  const [meta, setMeta] = useState<Record<string, CurrencyMeta>>(CURRENCY_META);
  const [hydrated, setHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const safeCode = (
    value ? String(value).toUpperCase() : "EUR"
  ) as CurrencyCode;
  const selectedMeta = meta[safeCode];

  // Build the two sections, or a single flat filtered list while searching.
  const { mainCodes, otherCodes, results } = useMemo(() => {
    const exclude = excludeCurrency?.toUpperCase();
    const main = MAIN_CURRENCY_CODES.filter((c) => meta[c] && c !== exclude);
    const others = Object.keys(meta)
      .filter((c) => !MAIN_SET.has(c) && c !== exclude)
      .sort();

    const q = query.trim().toLowerCase();
    if (!q) return { mainCodes: main, otherCodes: others, results: null };

    const match = (c: string) =>
      c.toLowerCase().includes(q) ||
      (meta[c]?.name.toLowerCase().includes(q) ?? false);
    // Main currencies rank first, then Others — both in their display order.
    const flat = [...main, ...others].filter(match);
    return { mainCodes: main, otherCodes: others, results: flat };
  }, [meta, excludeCurrency, query]);

  // Flat, ordered list of every code currently visible (keyboard nav order).
  const visibleCodes = useMemo(
    () => (results ? results : [...mainCodes, ...otherCodes]),
    [results, mainCodes, otherCodes],
  );

  const selectCode = (code: string) => {
    onChange(code as CurrencyCode);
    setIsOpen(false);
  };

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setActiveIndex(0); // re-highlight the first result as the filter narrows
  };

  const toggleDropdown = () => {
    const next = !isOpen;
    if (next) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
          position: "absolute",
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
      // Fresh search + highlight each time it opens.
      setQuery("");
      setActiveIndex(0);
    }
    setIsOpen(next);
  };

  // Hydrate the long list from Frankfurter (cached daily) on first open — or
  // eagerly on mount if the current value isn't in the curated set, so a
  // foreign-currency wallet shows its name in the closed trigger.
  useEffect(() => {
    if (hydrated) return;
    const selectedIsCurated = Boolean(CURRENCY_META[safeCode]);
    if (!isOpen && selectedIsCurated) return;
    let alive = true;
    getCurrencies().then((full) => {
      if (alive) {
        setMeta(full);
        setHydrated(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [isOpen, hydrated, safeCode]);

  // On open: focus the search field so the user can type immediately.
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  // Keep the highlighted row scrolled into view during keyboard navigation.
  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    (el as HTMLElement | null)?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, isOpen]);

  useEffect(() => {
    // Capture the node now: the cleanup must act on the element captured here,
    // not on popoverRef.current which may have changed by then.
    const popover = popoverRef.current;

    const handleScroll = (e: Event) => {
      // Scrolling inside the list must not close the dropdown.
      const target = e.target as HTMLElement;
      if (target?.classList?.contains("currency-scroll-container")) return;
      // Scrolling the modal behind it closes the floating dropdown.
      if (isOpen) setIsOpen(false);
    };

    const handleResize = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      if (popover) {
        try {
          popover.showPopover();
        } catch {
          /* Popover API unsupported — the dropdown still renders inline. */
        }
      }
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);

      if (popover) {
        try {
          if (popover.matches(":popover-open")) popover.hidePopover();
        } catch {
          /* Popover API unsupported — nothing to clean up. */
        }
      }
    };
  }, [isOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visibleCodes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const code = visibleCodes[activeIndex];
      if (code) selectCode(code);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const renderRow = (code: string, idx: number) => {
    const data = meta[code];
    if (!data) return null;
    const isSelected = safeCode === code;
    const isActive = idx === activeIndex;
    const isStarred = starredCurrency === code;
    return (
      <div
        key={code}
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
        onMouseEnter={() => setActiveIndex(idx)}
        // onMouseDown fires before the input blurs, so the pick lands instantly.
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          selectCode(code);
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
              selectCode(code);
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
  };

  const sectionLabel = (text: string) => (
    <div
      aria-hidden="true"
      className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-app-muted"
    >
      {text}
    </div>
  );

  return (
    <div className="relative w-full text-left">
      <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
        Currency
      </label>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border bg-app-input px-4 outline-none transition-all ${
          isOpen ? "" : "border-app-border hover:border-app-muted/50"
        }`}
        style={
          isOpen
            ? {
                borderColor: accentColor,
                boxShadow: `0 0 0 2px color-mix(in srgb, ${accentColor} 20%, transparent)`,
              }
            : undefined
        }
        onClick={toggleDropdown}
      >
        <div className="flex flex-1 items-center truncate text-sm text-app-text">
          {selectedMeta ? (
            <>
              <span className="inline-block w-[30px] shrink-0 font-bold">
                {selectedMeta.symbol}
              </span>
              <span className="truncate">{selectedMeta.name}</span>
              <span className="ml-1 shrink-0 text-app-muted">({safeCode})</span>
            </>
          ) : (
            <span className="truncate">Unknown ({safeCode})</span>
          )}
        </div>

        <FontAwesomeIcon
          icon={faChevronDown}
          className={`shrink-0 text-app-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={isOpen ? { color: accentColor } : undefined}
        />
      </button>

      {isOpen && (
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
              setIsOpen(false);
            }}
          />

          <div
            style={dropdownStyle}
            className="absolute z-10 overflow-hidden rounded-xl border border-app-border bg-app-card shadow-2xl animate-[fadeIn_0.2s_ease-out]"
          >
            <div className="border-b border-app-border p-2">
              <SearchInput
                ref={searchRef}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleSearchKeyDown}
                color={accentColor}
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
                  {mainCodes.length > 0 && sectionLabel("Main currencies")}
                  {mainCodes.map((code, i) => renderRow(code, i))}
                  {otherCodes.length > 0 && sectionLabel("Others")}
                  {otherCodes.map((code, i) =>
                    renderRow(code, mainCodes.length + i),
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
