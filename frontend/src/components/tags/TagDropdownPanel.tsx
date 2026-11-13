import React from "react";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

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
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch: borderless card with the soft floating shadow
  return (
    <div
      className={`absolute z-50 flex max-h-[350px] flex-col p-2 animate-[fadeIn_0.1s_ease-out] ${
        v2
          ? "rounded-[var(--r-card)] bg-app-card shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]"
          : "rounded-xl border border-app-border bg-app-card shadow-2xl"
      } ${className}`}
    >
      {searchSlot && <div className="mb-2 shrink-0">{searchSlot}</div>}
      {headerSlot && (
        <div
          className={`mb-1 shrink-0 pb-1 ${v2 ? "" : "border-b border-app-border"}`}
        >
          {headerSlot}
        </div>
      )}
      <div className="custom-scrollbar min-h-[50px] flex-1 space-y-1 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
};
