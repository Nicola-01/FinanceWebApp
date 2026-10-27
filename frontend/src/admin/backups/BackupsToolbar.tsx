import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faPlay,
  faSpinner,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button";
import { formatLabel, formatSize } from "./backupFormat.ts";
import type { BackupEntry } from "./types.ts";

interface Props {
  entries: BackupEntry[];
  listLoading: boolean;
  uploadBusy: boolean;
  backupBusy: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPickFile: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunBackup: () => void;
}

/** Integrated toolbar: bucket summary on the left, actions on the right. */
export const BackupsToolbar: React.FC<Props> = ({
  entries,
  listLoading,
  uploadBusy,
  backupBusy,
  fileInputRef,
  onPickFile,
  onFileChange,
  onRunBackup,
}) => {
  const newest = entries[0];
  return (
    <div className="flex flex-col gap-4 rounded-[var(--r-card)] border border-app-border bg-app-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-app-muted">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-gradient-to-br from-[var(--brand-1)]/20 to-[var(--brand-2)]/20 text-[var(--brand-1)]">
          <FontAwesomeIcon icon={faCloud} />
        </span>
        {listLoading ? (
          <span>Loading backups…</span>
        ) : entries.length === 0 ? (
          <span>No snapshots available yet</span>
        ) : (
          <span>
            <span className="font-app-mono font-bold text-app-text">
              {entries.length}
            </span>{" "}
            snapshots
            {newest && (
              <>
                {" · newest "}
                <span className="font-app-mono text-app-text">
                  {formatLabel(newest.key)}
                </span>
                {newest.sizeBytes > 0 && <> · {formatSize(newest.sizeBytes)}</>}
              </>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="md"
          onClick={onPickFile}
          disabled={uploadBusy}
        >
          <FontAwesomeIcon
            icon={uploadBusy ? faSpinner : faUpload}
            spin={uploadBusy}
          />
          Upload
        </Button>
        <Button
          variant="primary"
          size="md"
          ripple
          onClick={onRunBackup}
          disabled={backupBusy}
        >
          <FontAwesomeIcon
            icon={backupBusy ? faSpinner : faPlay}
            spin={backupBusy}
          />
          Run backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".sql,.gz,.dump,.enc"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};
