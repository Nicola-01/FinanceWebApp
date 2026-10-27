import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../types/domain";
import { Icon } from "../icon/Icon.tsx";

interface TagPickerTriggerProps {
  isOpen: boolean;
  color: string;
  selectedTag?: Tag;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpen: () => void;
  onToggle: () => void;
}

/** Trigger of TagTreePicker: shows the selected tag, or a search input while open. */
export const TagPickerTrigger: React.FC<TagPickerTriggerProps> = ({
  isOpen,
  color,
  selectedTag,
  searchQuery,
  onSearchChange,
  onOpen,
  onToggle,
}) => (
  <div
    className={`flex h-12 w-full items-center justify-between rounded-xl border bg-app-card px-4 text-left transition-all ${
      isOpen ? "" : "border-app-border"
    }`}
    style={
      isOpen
        ? {
            borderColor: color,
            boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 20%, transparent)`,
          }
        : undefined
    }
    onClick={onOpen}
  >
    <div className="relative flex h-full flex-1 items-center overflow-hidden">
      {isOpen ? (
        // Search input only exists while open, and is NOT auto-focused: on
        // mobile the keyboard stays down until the user taps ("Tap to search").
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tap to search..."
          className="h-full w-full bg-transparent font-medium text-app-text outline-none placeholder:text-app-muted"
        />
      ) : selectedTag ? (
        <div className="pointer-events-none flex w-full cursor-pointer items-center gap-3">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-xs"
            style={{
              color: selectedTag.colorHex || "var(--color-app-text)",
            }}
          >
            <Icon
              icon={selectedTag.icon}
              color={selectedTag.colorHex || "var(--color-app-text)"}
            />
          </div>
          <span className="truncate font-medium text-app-text">
            {selectedTag.name}
          </span>
        </div>
      ) : (
        // Closed + no selection: a plain (non-focusable) placeholder so tapping
        // it just opens the dropdown instead of focusing an input.
        <span className="cursor-pointer truncate font-medium text-app-muted">
          Select a category...
        </span>
      )}
    </div>

    <button
      type="button"
      className="ml-2 flex h-full cursor-pointer items-center justify-center px-2 outline-none"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <FontAwesomeIcon
        icon={isOpen ? faChevronUp : faChevronDown}
        className="text-app-muted transition-transform duration-300 hover:text-app-text"
      />
    </button>
  </div>
);
