import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faDatabase,
  faDownload,
  faUpload,
  faRotateLeft,
  faCircleCheck,
  faSpinner,
  faRefresh,
  faCloud,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

interface BackupEntry {
  key: string;
  lastModified: string | null; // ISO-8601 from Instant
  sizeBytes: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatKey(key: string): string {
  // db_backup_2025-04-15_02-00.sql.gz.enc → 2025-04-15  02:00
  const m = key.match(/db_backup_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})/);
  if (!m) return key;
  return `${m[1]}  ${m[2]}:${m[3]}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ActionButton: React.FC<{
  status: Status;
  label: string;
  loadingLabel?: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({
  status,
  label,
  loadingLabel = "Processing…",
  color,
  onClick,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={status === "loading" || disabled}
    className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
    style={{
      background: status === "loading" ? `${color}33` : `${color}18`,
      border: `1px solid ${color}44`,
      color,
    }}
  >
    {status === "loading" ? (
      <>
        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        {loadingLabel}
      </>
    ) : status === "success" ? (
      <>
        <FontAwesomeIcon icon={faCircleCheck} />
        Completed!
      </>
    ) : (
      label
    )}
  </button>
);

interface BackupSelectorProps {
  entries: BackupEntry[];
  value: string;
  onChange: (key: string) => void;
  loading: boolean;
  accentColor: string;
}

const BackupSelector: React.FC<BackupSelectorProps> = ({
  entries,
  value,
  onChange,
  loading,
  accentColor,
}) => (
  <div className="relative">
    {loading ? (
      <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-muted">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
        Loading versions…
      </div>
    ) : entries.length === 0 ? (
      <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-muted">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="theme-text-warning text-xs"
        />
        No backups available
      </div>
    ) : (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-app-border bg-app-input px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 transition-all"
        style={{ "--tw-ring-color": accentColor } as React.CSSProperties}
      >
        <option value="">-- Select version --</option>
        {entries.map((e) => (
          <option key={e.key} value={e.key}>
            {formatKey(e.key)}
            {e.sizeBytes > 0 ? `  (${formatSize(e.sizeBytes)})` : ""}
          </option>
        ))}
      </select>
    )}
  </div>
);

interface ActionCardProps {
  icon: IconDefinition;
  title: string;
  description: string;
  accentColor: string;
  children: React.ReactNode;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  description,
  accentColor,
  children,
}) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-app-border bg-app-card/60 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-sm">
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `${accentColor}22`,
          border: `1px solid ${accentColor}44`,
        }}
      >
        <FontAwesomeIcon
          icon={icon}
          style={{ color: accentColor }}
          className="text-lg"
        />
      </div>
      <div>
        <h3 className="m-0 text-base font-bold text-app-text">{title}</h3>
        <p className="m-0 text-xs text-app-muted">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Backups: React.FC = () => {
  // Available backup list
  const [entries, setEntries] = useState<BackupEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Per-action states
  const [backupStatus, setBackupStatus] = useState<Status>("idle");
  const [downloadKey, setDownloadKey] = useState("");
  const [downloadStatus, setDownloadStatus] = useState<Status>("idle");
  const [restoreKey, setRestoreKey] = useState("");
  const [restoreStatus, setRestoreStatus] = useState<Status>("idle");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<Status>("idle");

  // ── Load available backups ────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    setListLoading(true);
    try {
      const resp = await api.get<BackupEntry[]>("/admin/backup/list");
      setEntries(resp.data);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not load backup list"), false);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ── Finalize helper ───────────────────────────────────────────────────────

  const finalize = (
    setter: (s: Status) => void,
    ok: boolean,
    reload = false,
  ) => {
    setter(ok ? "success" : "error");
    setTimeout(() => {
      setter("idle");
      if (reload) loadEntries();
    }, 3000);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleManualBackup = async () => {
    setBackupStatus("loading");
    try {
      await api.post("/admin/backup");
      triggerToast("Backup completed successfully!", true);
      finalize(setBackupStatus, true, true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error during backup"), false);
      finalize(setBackupStatus, false);
    }
  };

  const handleDownload = async () => {
    if (!downloadKey) {
      triggerToast("Please select a version", false);
      return;
    }
    setDownloadStatus("loading");
    try {
      const resp = await api.get(
        `/admin/backup/download/${encodeURIComponent(downloadKey)}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadKey.replace(".sql.gz.enc", ".sql");
      a.click();
      window.URL.revokeObjectURL(url);
      finalize(setDownloadStatus, true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Backup not found"), false);
      finalize(setDownloadStatus, false);
    }
  };

  const handleRestore = async () => {
    if (!restoreKey) {
      triggerToast("Please select a version", false);
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to restore "${formatKey(restoreKey)}"?\nThis operation will overwrite current data.`,
      )
    )
      return;
    setRestoreStatus("loading");
    try {
      await api.post(`/admin/restore/${encodeURIComponent(restoreKey)}`);
      triggerToast(`Restore completed!`, true);
      finalize(setRestoreStatus, true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error during restore"), false);
      finalize(setRestoreStatus, false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      triggerToast("Please select a file", false);
      return;
    }
    setUploadStatus("loading");
    const formData = new FormData();
    formData.append("file", uploadFile);
    try {
      await api.post("/admin/backup/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      triggerToast("File uploaded successfully!", true);
      setUploadFile(null);
      finalize(setUploadStatus, true, true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error during upload"), false);
      finalize(setUploadStatus, false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold text-app-text">
            Backup Management
          </h2>
          <p className="m-0 text-sm text-app-muted mt-1">
            Backup, restore, and transfer the database via Cloudflare R2.
          </p>
        </div>
        <button
          onClick={loadEntries}
          disabled={listLoading}
          className="flex items-center gap-2 rounded-lg border border-app-border bg-app-input/40 px-3 py-1.5 text-xs font-semibold text-app-muted transition-all hover:text-app-text hover:bg-app-input"
        >
          <FontAwesomeIcon
            icon={faRefresh}
            className={listLoading ? "animate-spin" : ""}
          />
          Refresh list
        </button>
      </div>

      {/* Version count badge */}
      {!listLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-app-border/50 bg-app-card/40 px-4 py-2.5 text-sm">
          <FontAwesomeIcon icon={faCloud} className="theme-text-primary" />
          <span className="text-app-muted">
            {entries.length === 0 ? (
              "No versions available in the bucket"
            ) : (
              <>
                <span className="font-bold text-app-text">
                  {entries.length}
                </span>{" "}
                versions available in the bucket
              </>
            )}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1 – Backup manuale */}
        <ActionCard
          icon={faDatabase}
          title="Manual Backup"
          description="Create a new database snapshot now"
          accentColor="var(--color-app-green)"
        >
          <ActionButton
            status={backupStatus}
            label="▶ Run Backup"
            loadingLabel="Backup in progress…"
            color="var(--color-app-green)"
            onClick={handleManualBackup}
          />
        </ActionCard>

        {/* 2 – Download */}
        <ActionCard
          icon={faDownload}
          title="Download Backup"
          description="Download and decrypt a specific version"
          accentColor="var(--color-app-sky)"
        >
          <BackupSelector
            entries={entries}
            value={downloadKey}
            onChange={setDownloadKey}
            loading={listLoading}
            accentColor="var(--color-app-sky)"
          />
          <ActionButton
            status={downloadStatus}
            label="⬇ Download"
            loadingLabel="Download in progress…"
            color="var(--color-app-sky)"
            onClick={handleDownload}
            disabled={!downloadKey}
          />
        </ActionCard>

        {/* 3 – Restore */}
        <ActionCard
          icon={faRotateLeft}
          title="Restore Backup"
          description="Restore the database from a previous version"
          accentColor="#f59e0b"
        >
          <div className="rounded-lg border theme-border-warning theme-bg-warning-transparent p-2.5 text-xs theme-text-warning">
            ⚠ Restoring will overwrite current data. Make sure you have a recent
            backup.
          </div>
          <BackupSelector
            entries={entries}
            value={restoreKey}
            onChange={setRestoreKey}
            loading={listLoading}
            accentColor="#f59e0b"
          />
          <ActionButton
            status={restoreStatus}
            label="↩ Restore"
            loadingLabel="Restore in progress…"
            color="#f59e0b"
            onClick={handleRestore}
            disabled={!restoreKey}
          />
        </ActionCard>

        {/* 4 – Upload */}
        <ActionCard
          icon={faUpload}
          title="Upload Backup"
          description="Import an external backup file to the server / R2"
          accentColor="var(--color-app-purple)"
        >
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-app-border/60 bg-app-input/30 p-4 text-sm text-app-muted cursor-pointer transition-all hover:theme-border-brand hover:theme-bg-brand-transparent hover:text-app-text">
            <FontAwesomeIcon icon={faUpload} className="text-xl" />
            {uploadFile ? (
              <span className="font-semibold text-app-text truncate max-w-full px-2">
                {uploadFile.name}
              </span>
            ) : (
              <span>
                Click to select a <code>.sql</code> or <code>.sql.gz.enc</code>{" "}
                file
              </span>
            )}
            <input
              type="file"
              accept=".sql,.gz,.dump,.enc"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <ActionButton
            status={uploadStatus}
            label="⬆ Upload File"
            loadingLabel="Upload in progress…"
            color="var(--color-app-purple)"
            onClick={handleUpload}
            disabled={!uploadFile}
          />
        </ActionCard>
      </div>
    </div>
  );
};

export default Backups;
