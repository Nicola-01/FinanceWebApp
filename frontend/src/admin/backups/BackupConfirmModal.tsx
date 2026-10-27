import React from "react";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";
import { formatLabel } from "./backupFormat.ts";
import type { ConfirmState } from "./types.ts";

interface Props {
  confirm: ConfirmState;
  busy: boolean;
  selectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** ConfirmModal with the restore / delete / bulk-delete copy. */
export const BackupConfirmModal: React.FC<Props> = ({
  confirm,
  busy,
  selectedCount,
  onCancel,
  onConfirm,
}) => (
  <ConfirmModal
    open={confirm.open}
    busy={busy}
    onCancel={onCancel}
    onConfirm={onConfirm}
    tone={confirm.kind === "restore" ? "warning" : "danger"}
    mode={confirm.kind === "restore" ? "hold" : "simple"}
    holdMs={2500}
    title={
      confirm.kind === "restore"
        ? "Restore snapshot?"
        : confirm.kind === "bulk-delete"
          ? "Delete selected snapshots?"
          : "Delete snapshot?"
    }
    confirmLabel={
      confirm.kind === "restore"
        ? "Hold to restore"
        : confirm.kind === "bulk-delete"
          ? `Delete ${selectedCount} backups`
          : "Delete backup"
    }
    message={
      confirm.kind === "restore" ? (
        <>
          This{" "}
          <strong className="text-app-yellow">
            overwrites the entire database
          </strong>{" "}
          with{" "}
          <span className="font-app-mono text-app-text">
            {formatLabel(confirm.key)}
          </span>
          . Press and hold to confirm.
        </>
      ) : confirm.kind === "bulk-delete" ? (
        <>
          Permanently delete{" "}
          <strong className="text-app-red">
            {selectedCount} snapshot{selectedCount === 1 ? "" : "s"}
          </strong>{" "}
          from the server / R2? This cannot be undone.
        </>
      ) : (
        <>
          Permanently delete the snapshot{" "}
          <span className="font-app-mono text-app-text">
            {formatLabel(confirm.key)}
          </span>
          ? This cannot be undone.
        </>
      )
    }
  />
);
