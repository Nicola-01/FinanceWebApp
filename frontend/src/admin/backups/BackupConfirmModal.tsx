import React from "react";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
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
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 status tokens and tabular figures in the message.
  const v2 = ui === "v2";
  const mono = v2 ? "tabular-nums" : "font-app-mono";
  const yellow = v2 ? "text-app-warn" : "text-app-yellow";
  const red = v2 ? "text-app-danger" : "text-app-red";
  return (
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
            <strong className={yellow}>overwrites the entire database</strong>{" "}
            with{" "}
            <span className={`${mono} text-app-text`}>
              {formatLabel(confirm.key)}
            </span>
            . Press and hold to confirm.
          </>
        ) : confirm.kind === "bulk-delete" ? (
          <>
            Permanently delete{" "}
            <strong className={red}>
              {selectedCount} snapshot{selectedCount === 1 ? "" : "s"}
            </strong>{" "}
            from the server / R2? This cannot be undone.
          </>
        ) : (
          <>
            Permanently delete the snapshot{" "}
            <span className={`${mono} text-app-text`}>
              {formatLabel(confirm.key)}
            </span>
            ? This cannot be undone.
          </>
        )
      }
    />
  );
};
