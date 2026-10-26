import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types.ts";
import { Icon } from "../icon/Icon.tsx";
import { Checkbox, type CheckboxState } from "../ui/Checkbox.tsx";

/** Trailing affordance on the right edge of a row. */
export type TagRowTrailing =
  | { kind: "expand"; expanded: boolean; onToggle: () => void }
  | { kind: "drill"; ancestor?: boolean }
  | { kind: "check" };

export interface TagRowProps {
  tag: Tag;
  /** Accent colour for the leading checkbox (filter). Defaults to the app green. */
  color?: string;
  /** Muted hint after the name, e.g. "All" / "General". */
  hint?: string;
  /** Active palette for the icon bubble + name (selected / checked / ancestor). */
  highlighted?: boolean;
  /**
   * Row background treatment. `active` = neutral surface (filter checked rows,
   * whose checkbox already carries the accent); `selected` / `tint` = accent-
   * tinted from {@link color} (picker selected / ancestor rows).
   */
  background?: "active" | "selected" | "tint" | "none";
  /** Whole-row click: drill in the picker, expand/toggle in the filter. */
  onClick?: () => void;
  /** Leading checkbox (filter / multi-select only). */
  checkbox?: { state: CheckboxState; onChange: () => void };
  /** Trailing control (expand caret / drill chevron / selected check). */
  trailing?: TagRowTrailing;
}

/**
 * The single row shared by TagFilter and TagPicker. It renders an identical
 * shell — icon bubble, name, hover and active highlight — and exposes the
 * per-mode affordances as props: a leading {@link Checkbox} for the filter, and
 * a trailing caret / chevron / check for expand, drill or selection.
 */
export const TagRow: React.FC<TagRowProps> = ({
  tag,
  color = "var(--color-app-green)",
  hint,
  highlighted = false,
  background = "none",
  onClick,
  checkbox,
  trailing,
}) => {
  let bgClass = "border border-transparent hover:bg-app-input";
  let bgStyle: React.CSSProperties | undefined;
  if (background === "active") {
    bgClass = "border border-transparent bg-app-surface";
  } else if (background === "selected") {
    bgClass = "border";
    bgStyle = {
      backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
    };
  } else if (background === "tint") {
    bgClass = "border";
    bgStyle = {
      backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
    };
  }

  return (
    <div
      onClick={onClick}
      style={bgStyle}
      className={`group flex w-full items-center justify-between rounded-lg p-3 transition-colors ${bgClass} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {checkbox && (
          <Checkbox
            state={checkbox.state}
            onChange={checkbox.onChange}
            color={color}
            aria-label={`Toggle ${tag.name}`}
            className="shrink-0"
          />
        )}

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-110 ${
            highlighted ? "bg-app-hover" : "bg-app-input"
          }`}
          style={{ color: tag.colorHex || "var(--color-app-text)" }}
        >
          <Icon
            icon={tag.icon}
            color={tag.colorHex || "var(--color-app-text)"}
          />
        </div>

        <span
          className={`truncate text-sm font-medium ${
            highlighted ? "text-app-text" : "text-app-muted"
          }`}
        >
          {tag.name}
          {hint && (
            <span className="ml-1 text-xs italic opacity-50">({hint})</span>
          )}
        </span>
      </div>

      {trailing && (
        <RowTrailing trailing={trailing} tagName={tag.name} color={color} />
      )}
    </div>
  );
};

/** Renders the right-edge control described by {@link TagRowTrailing}. */
const RowTrailing: React.FC<{
  trailing: TagRowTrailing;
  tagName: string;
  color: string;
}> = ({ trailing, tagName, color }) => {
  if (trailing.kind === "check") {
    return (
      <FontAwesomeIcon icon={faCheck} className="text-sm" style={{ color }} />
    );
  }

  if (trailing.kind === "drill") {
    return (
      <FontAwesomeIcon
        icon={faChevronRight}
        className={
          trailing.ancestor
            ? "text-sm"
            : "text-xs text-app-muted opacity-50 group-hover:opacity-100"
        }
        style={trailing.ancestor ? { color } : undefined}
      />
    );
  }

  // Expandable parent (accordion): a clickable caret that rotates when open.
  return (
    <button
      type="button"
      aria-label={`${trailing.expanded ? "Collapse" : "Expand"} ${tagName}`}
      onClick={(e) => {
        e.stopPropagation();
        trailing.onToggle();
      }}
      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors hover:bg-app-surface"
    >
      <FontAwesomeIcon
        icon={faChevronDown}
        className={`text-xs text-app-muted opacity-50 transition-transform group-hover:opacity-100 ${
          trailing.expanded ? "rotate-180" : ""
        }`}
      />
    </button>
  );
};
