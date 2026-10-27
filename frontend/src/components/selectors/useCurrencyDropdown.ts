import React, { useState, useRef, useEffect } from "react";

/**
 * Floating-dropdown mechanics of CurrencySelector: trigger-anchored
 * positioning, top-layer popover, close on outer scroll/resize, search focus,
 * and keyboard navigation over the visible codes.
 */
export function useCurrencyDropdown(onSelect: (code: string) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectCode = (code: string) => {
    onSelect(code);
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

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    visibleCodes: string[],
  ) => {
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

  return {
    isOpen,
    close: () => setIsOpen(false),
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
  };
}
