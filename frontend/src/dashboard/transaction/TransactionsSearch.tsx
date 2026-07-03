import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { SearchInput } from "../../components/ui/SearchInput.tsx";

interface TransactionsSearchProps {
  /** Current search text (controlled). */
  value: string;
  /** Called with the new query on every keystroke. */
  onChange: (query: string) => void;
  /** Accent colour applied to the focus ring / active state. */
  color?: string;
}

const TransactionsSearch: React.FC<TransactionsSearchProps> = ({
  value,
  onChange,
  color = "var(--color-app-green)",
}) => {
  // Tolerate an undefined controlled value (e.g. before the context supplies it).
  const safeValue = value ?? "";
  // Popover open state (only used on small screens, where the field collapses
  // into an icon button that mirrors the TagFilter on the other side).
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const popoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus the field as soon as the popover opens.
  useEffect(() => {
    if (isOpen) popoverInputRef.current?.focus();
  }, [isOpen]);

  const hasQuery = safeValue.trim().length > 0;

  return (
    <>
      {/* Desktop (lg+): inline borderless search field */}
      <div className="hidden lg:block w-full max-w-[16rem]">
        <SearchInput
          value={safeValue}
          onChange={onChange}
          color={color}
          variant="plain"
          heightClassName="h-12"
          placeholder="Search transactions..."
          aria-label="Search transactions"
        />
      </div>

      {/* Small screens: icon button that opens a search popover */}
      <div className="relative lg:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`flex items-center justify-center w-[48px] h-[48px] rounded-xl border transition-all ${
            hasQuery || isOpen
              ? "shadow-lg"
              : "bg-app-input border-app-border text-app-muted hover:bg-app-surface hover:text-app-text"
          }`}
          style={
            hasQuery || isOpen
              ? {
                  backgroundColor: color + "26",
                  color: color,
                  borderColor: color + "40",
                }
              : {}
          }
          title="Search transactions"
          aria-label="Open search"
        >
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="text-lg transition-transform hover:scale-110"
            />
            {hasQuery && (
              <div
                className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}`,
                }}
              ></div>
            )}
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 z-50 mt-4 w-72 max-w-[80vw] rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out]">
            <SearchInput
              ref={popoverInputRef}
              value={safeValue}
              onChange={onChange}
              color={color}
              variant="plain"
              heightClassName="h-12"
              placeholder="Search transactions..."
              aria-label="Search transactions"
              onKeyDown={(e) => e.key === "Enter" && setIsOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionsSearch;
