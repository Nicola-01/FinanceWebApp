import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckSquare,
  faSquare,
  faMinusSquare,
} from "@fortawesome/free-solid-svg-icons";

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export interface CheckboxProps {
  /** Tri-state selection. Pass a boolean for a plain two-state box. */
  state: CheckboxState | boolean;
  /** Toggles the box. Called on click (which is stopped from bubbling). */
  onChange: () => void;
  /**
   * Optional label beside the box. When present the whole control is clickable
   * and the label dims while unchecked; omit it to render just the box as the
   * leading element of a larger clickable row.
   */
  label?: React.ReactNode;
  /** Accent colour when checked / indeterminate (e.g. `wallet.color`). Defaults to brand. */
  color?: string;
  /** Icon size (default `md`). */
  size?: "sm" | "md";
  disabled?: boolean;
  /** Extra classes for the button wrapper (e.g. width / padding / hover). */
  className?: string;
  "aria-label"?: string;
}

const ICONS: Record<CheckboxState, typeof faSquare> = {
  checked: faCheckSquare,
  unchecked: faSquare,
  indeterminate: faMinusSquare,
};

/**
 * Square tri-state checkbox primitive. Renders the shared square / check /
 * minus icon set with an accent colour when active, and an optional label that
 * dims when unchecked. Use standalone (with a label) or as the leading box in a
 * larger clickable row (label omitted). The click is stopped from bubbling so
 * it can sit inside another clickable element without double-firing.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  state,
  onChange,
  label,
  color = "var(--brand-1)",
  size = "md",
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}) => {
  const resolved: CheckboxState =
    typeof state === "boolean" ? (state ? "checked" : "unchecked") : state;
  const isActive = resolved !== "unchecked";
  const iconSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={
        resolved === "indeterminate" ? "mixed" : resolved === "checked"
      }
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`group flex items-center gap-3 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <FontAwesomeIcon
        icon={ICONS[resolved]}
        className={`${iconSize} shrink-0 transition-colors ${
          isActive ? "" : "text-app-muted"
        }`}
        style={isActive ? { color } : {}}
      />
      {label != null && (
        <span
          className={`text-sm font-medium ${
            isActive ? "text-app-text" : "text-app-muted"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
};

export default Checkbox;
