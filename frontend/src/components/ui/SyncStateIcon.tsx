import React from "react";
import { CloudAlert, CloudOff } from "lucide-react";
import type { SyncState } from "../../utils/types";

interface SyncStateIconProps {
  state?: SyncState;
  className?: string;
}

/**
 * Small inline glyph flagging an entity's offline-sync state next to its name.
 * Amber cloud-off = still queued (`pending`); red cloud-alert = `failed`/`conflict`.
 * Renders nothing when the entity is fully synced. No glow, no animation
 * (per the sync-UI spec). Shared by transaction / subscription / category rows.
 */
export const SyncStateIcon: React.FC<SyncStateIconProps> = ({
  state,
  className = "",
}) => {
  if (!state) return null;

  if (state === "pending") {
    return (
      <CloudOff
        size={14}
        className={`shrink-0 text-amber-400 ${className}`}
        aria-label="Not synced yet"
      />
    );
  }

  return (
    <CloudAlert
      size={14}
      className={`shrink-0 text-red-400 ${className}`}
      aria-label="Sync problem"
    />
  );
};

export default SyncStateIcon;
