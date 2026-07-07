import React from "react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../components/ui/Badge";

/** Small pill marking a feature whose backend isn't wired up yet. */
export const ComingSoonBadge: React.FC<{ label?: string }> = ({
  label = "Coming soon",
}) => (
  <Badge tone="neutral" uppercase icon={faClock}>
    {label}
  </Badge>
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
