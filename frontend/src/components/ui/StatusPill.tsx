import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type Status = "ok" | "warn" | "danger";

const STATUS_TEXT_CLASS: Record<Status, string> = {
  ok: "text-app-income",
  warn: "text-app-warn",
  danger: "text-app-danger",
};

// Warn tints from its brighter fill colour; its text colour is darker for contrast (D11).
const STATUS_BG_CLASS: Record<Status, string> = {
  ok: "bg-[color-mix(in_srgb,currentColor_16%,transparent)]",
  warn: "bg-[color-mix(in_srgb,var(--color-app-warn-fill)_18%,transparent)]",
  danger: "bg-[color-mix(in_srgb,currentColor_16%,transparent)]",
};

const DEFAULT_ICON: Record<Status, IconDefinition> = {
  ok: faCircleCheck,
  warn: faTriangleExclamation,
  danger: faCircleExclamation,
};

interface StatusPillProps {
  status: Status;
  children: React.ReactNode;
  icon?: IconDefinition; // Overrides the default icon for the status
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  children,
  icon,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-1.5 justify-self-start rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${STATUS_BG_CLASS[status]} ${STATUS_TEXT_CLASS[status]} ${className}`}
  >
    <FontAwesomeIcon icon={icon ?? DEFAULT_ICON[status]} aria-hidden="true" />
    {children}
  </span>
);
