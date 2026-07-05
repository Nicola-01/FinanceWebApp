import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";

/** Small pill marking a feature whose backend isn't wired up yet. */
export const ComingSoonBadge: React.FC<{ label?: string }> = ({
  label = "Coming soon",
}) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-input px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
    <FontAwesomeIcon icon={faClock} className="text-[9px]" />
    {label}
  </span>
);

/**
 * Wraps a not-yet-available control block: dims it and blocks interaction, so
 * we can lay out the final UI now while the backend is still pending.
 */
export const LockedBlock: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    aria-disabled="true"
    className="pointer-events-none select-none opacity-55 [&_input]:cursor-not-allowed"
  >
    {children}
  </div>
);
