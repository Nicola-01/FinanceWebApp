import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// shortcut: local icon button until the planned ui/IconButton primitive (4.5) exists; swap then.
export const IconAction: React.FC<{
  icon: IconDefinition;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  spin?: boolean;
  danger?: boolean;
}> = ({ icon, onClick, label, disabled, spin, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-sm transition-colors disabled:opacity-40 ${
      danger
        ? "text-app-muted hover:bg-app-hover hover:text-app-red"
        : "text-app-muted hover:bg-app-hover hover:text-app-text"
    }`}
  >
    <FontAwesomeIcon icon={icon} spin={spin} />
  </button>
);
