import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faChevronDown,
  faCheckSquare,
  faSquare,
  faMinusSquare,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types.ts";
import { Icon } from "../icon/Icon.tsx";

export interface TagFilterRowProps {
  tag: Tag;
  childrenTags?: Tag[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectionState: "checked" | "unchecked" | "indeterminate";
  onToggleSelection: () => void;
  color?: string;
}

export const TagFilterRow: React.FC<TagFilterRowProps> = ({
  tag,
  childrenTags = [],
  isExpanded,
  onToggleExpand,
  selectionState,
  onToggleSelection,
  color = "var(--color-app-green)",
}) => {
  const hasChildren = childrenTags.length > 0;

  let checkboxIcon = faSquare;
  let iconClass = "text-app-muted";
  if (selectionState === "checked") {
    checkboxIcon = faCheckSquare;
    iconClass = "";
  } else if (selectionState === "indeterminate") {
    checkboxIcon = faMinusSquare;
    iconClass = "";
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-app-input rounded-lg cursor-pointer transition-colors group">
      <div
        className="flex items-center gap-3 flex-1"
        onClick={onToggleSelection}
      >
        <FontAwesomeIcon
          icon={checkboxIcon}
          className={`text-lg transition-colors ${iconClass}`}
          style={selectionState !== "unchecked" ? { color } : {}}
        />
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-xs"
          style={{ color: tag.colorHex || "var(--color-app-text)" }}
        >
          <Icon
            icon={tag.icon}
            color={tag.colorHex || "var(--color-app-text)"}
          />
        </div>
        <span className="text-app-text text-sm font-medium truncate">
          {tag.name}
        </span>
      </div>

      {hasChildren && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-app-surface transition-colors ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          <FontAwesomeIcon
            icon={isExpanded ? faChevronDown : faChevronRight}
            className="text-app-muted text-xs transition-transform duration-300"
          />
        </div>
      )}
    </div>
  );
};
