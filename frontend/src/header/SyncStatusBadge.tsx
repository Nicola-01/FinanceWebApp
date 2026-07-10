import React, { useState } from "react";
import { CloudAlert, CloudOff } from "lucide-react";
import Button from "../components/ui/Button";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { SyncCenterOverlay } from "./SyncCenterOverlay";

/**
 * Header pill summarising the offline queue. Hidden when the queue is empty.
 * Shows an amber cloud-off (or red cloud-alert when anything failed / conflicted)
 * with the total op count; pulses while a replay pass runs. Opens the Sync Center.
 */
export const SyncStatusBadge: React.FC = () => {
  const sync = useSyncStatus();
  const [open, setOpen] = useState(false);

  const total = sync.ops.length;
  if (total === 0) return null;

  const hasProblem = sync.counts.failed + sync.counts.conflict > 0;
  const Icon = hasProblem ? CloudAlert : CloudOff;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open sync center"
        className={`gap-1.5 ${hasProblem ? "text-red-400" : "text-amber-400"} ${
          sync.syncing ? "animate-pulse" : ""
        }`}
      >
        <Icon size={16} className="shrink-0" aria-hidden />
        <span className="font-app-mono text-xs tabular-nums">{total}</span>
      </Button>

      <SyncCenterOverlay
        open={open}
        onClose={() => setOpen(false)}
        sync={sync}
      />
    </>
  );
};

export default SyncStatusBadge;
