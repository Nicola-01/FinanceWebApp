import React from "react";

export interface TagDropdownPanelProps {
  /** Positioning + width utilities, e.g. "right-0 mt-4 w-72" or "mt-1 w-full". */
  className?: string;
  /** Optional search field pinned at the top (filter mode). */
  searchSlot?: React.ReactNode;
  /** Optional back header pinned under the search (picker drill). */
  headerSlot?: React.ReactNode;
  /** Scrollable list body. */
  children: React.ReactNode;
}

/**
 * Shared floating card for both tag dropdowns: the bordered panel, an optional
 * pinned search field, an optional pinned back header, and the scrollable list.
 * Each component owns its own trigger and passes positioning via {@link className}.
 */
export const TagDropdownPanel: React.FC<TagDropdownPanelProps> = ({
  className = "",
  searchSlot,
  headerSlot,
  children,
}) => (
  <div
    className={`absolute z-50 flex max-h-[350px] flex-col rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out] ${className}`}
  >
    {searchSlot && <div className="mb-2 shrink-0">{searchSlot}</div>}
    {headerSlot && (
      <div className="mb-1 shrink-0 border-b border-app-border pb-1">
        {headerSlot}
      </div>
    )}
    <div className="custom-scrollbar min-h-[50px] flex-1 space-y-1 overflow-y-auto pr-1">
      {children}
    </div>
  </div>
);
