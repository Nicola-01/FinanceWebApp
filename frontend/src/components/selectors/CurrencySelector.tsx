import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { CurrencyCode } from "../../utils/currencies";
import { FieldLabel } from "../ui/FieldLabel";
import { useCurrencyList } from "./useCurrencyList";
import { useCurrencyDropdown } from "./useCurrencyDropdown";
import { CurrencyOptionRow } from "./CurrencyOptionRow";
import { CurrencyDropdownPanel } from "./CurrencyDropdownPanel";

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

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  excludeCurrency,
  accentColor = "var(--color-app-green)",
  starredCurrency,
  onToggleStar,
}) => {
  const safeCode = (
    value ? String(value).toUpperCase() : "EUR"
  ) as CurrencyCode;

  const {
    isOpen,
    close,
    dropdownStyle,
    query,
    activeIndex,
    setActiveIndex,
    triggerRef,
    popoverRef,
    searchRef,
    listRef,
    selectCode,
    handleQueryChange,
    toggleDropdown,
    handleSearchKeyDown,
  } = useCurrencyDropdown((code) => onChange(code as CurrencyCode));

  const { meta, mainCodes, otherCodes, results, visibleCodes } =
    useCurrencyList({ isOpen, safeCode, excludeCurrency, query });
  const selectedMeta = meta[safeCode];

  const renderRow = (code: string, idx: number) => {
    const data = meta[code];
    if (!data) return null;
    return (
      <CurrencyOptionRow
        key={code}
        code={code}
        data={data}
        idx={idx}
        isSelected={safeCode === code}
        isActive={idx === activeIndex}
        isStarred={starredCurrency === code}
        accentColor={accentColor}
        onHover={setActiveIndex}
        onSelect={selectCode}
        onToggleStar={onToggleStar}
      />
    );
  };

  return (
    <div className="relative w-full text-left">
      <FieldLabel>Currency</FieldLabel>

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
        <CurrencyDropdownPanel
          popoverRef={popoverRef}
          searchRef={searchRef}
          listRef={listRef}
          dropdownStyle={dropdownStyle}
          onClose={close}
          query={query}
          onQueryChange={handleQueryChange}
          onSearchKeyDown={(e) => handleSearchKeyDown(e, visibleCodes)}
          accentColor={accentColor}
          mainCodes={mainCodes}
          otherCodes={otherCodes}
          results={results}
          renderRow={renderRow}
        />
      )}
    </div>
  );
};
