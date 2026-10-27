import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faDownload,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AdminPageHeader } from "./AdminPageHeader.tsx";
import Button from "../components/ui/Button";
import { useBackups } from "./backups/useBackups.ts";
import { BackupsToolbar } from "./backups/BackupsToolbar.tsx";
import { BackupsTable } from "./backups/BackupsTable.tsx";
import { BackupConfirmModal } from "./backups/BackupConfirmModal.tsx";

const Backups: React.FC = () => {
  const b = useBackups();
  const hasSelection = b.selectedCount > 0;

  return (
    <div className="flex flex-col gap-6 xl:min-h-0 xl:flex-1">
      <AdminPageHeader
        title="Backups"
        description="Snapshot, restore and transfer the database via Cloudflare R2."
      />

      <BackupsToolbar
        entries={b.entries}
        listLoading={b.listLoading}
        uploadBusy={b.uploadBusy}
        backupBusy={b.backupBusy}
        fileInputRef={b.fileInputRef}
        onPickFile={b.handlePickFile}
        onFileChange={b.handleFileChange}
        onRunBackup={b.handleRunBackup}
      />

      {/* Bulk-action bar — always visible; acts as an info hint when nothing is
          selected, so the layout never jumps. */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-card)] border px-4 py-3 transition-colors ${
          hasSelection
            ? "border-[var(--brand-1)]/40 bg-[var(--brand-1)]/10"
            : "border-app-border bg-app-card/40"
        }`}
      >
        {hasSelection ? (
          <div className="text-sm font-semibold text-app-text">
            <span className="font-app-mono">{b.selectedCount}</span> selected
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-app-muted">
            <FontAwesomeIcon icon={faCircleInfo} className="text-app-muted" />
            Select snapshots to download or delete them in bulk.
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={b.handleBulkDownload}
            disabled={b.bulkBusy || !hasSelection}
          >
            <FontAwesomeIcon
              icon={b.bulkBusy ? faSpinner : faDownload}
              spin={b.bulkBusy}
            />
            Download
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => b.openConfirm("bulk-delete", "")}
            disabled={b.bulkBusy || !hasSelection}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </Button>
          {hasSelection && (
            <button
              type="button"
              onClick={b.clearSelection}
              title="Clear selection"
              aria-label="Clear selection"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>

      <BackupsTable
        entries={b.entries}
        listLoading={b.listLoading}
        selected={b.selected}
        selectedCount={b.selectedCount}
        downloadingKey={b.downloadingKey}
        onToggleOne={b.toggleOne}
        onToggleAll={b.toggleAll}
        onDownload={b.handleDownload}
        onConfirm={b.openConfirm}
      />

      <BackupConfirmModal
        confirm={b.confirm}
        busy={b.confirmBusy}
        selectedCount={b.selectedCount}
        onCancel={b.closeConfirm}
        onConfirm={b.runConfirm}
      />
    </div>
  );
};

export default Backups;
