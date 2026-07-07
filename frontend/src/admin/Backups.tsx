import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faClock,
  faCloud,
  faDatabase,
  faDownload,
  faExclamationTriangle,
  faHardDrive,
  faPlay,
  faRotateLeft,
  faSpinner,
  faTrash,
  faUpload,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { Badge } from "../components/ui/Badge";
import { getApiErrorTitle } from "../utils/apiError.ts";
import { AdminPageHeader } from "./AdminPageHeader.tsx";
import Button from "../components/ui/Button";
import { Checkbox, type CheckboxState } from "../components/ui/Checkbox.tsx";
import { ConfirmModal } from "../modals/common/ConfirmModal.tsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackupEntry {
  key: string;
  lastModified: string | null; // ISO-8601 from Instant
  sizeBytes: number;
}

interface ConfirmState {
  open: boolean;
  kind: "restore" | "delete" | "bulk-delete";
  key: string; // single-op key ("" for bulk-delete)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Parse the timestamp embedded in a backup key into a Date. */
function parseKeyDate(key: string): Date | null {
  const m = key.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** Human label for a backup, e.g. "15 Apr 2025 · 02:00". */
function formatLabel(key: string): string {
  const d = parseKeyDate(key);
  if (!d) return key;
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** Colour class for the age cell — fresh backups read green, older ones fade. */
function ageColorClass(iso: string | null, fallback: Date | null): string {
  const d = iso ? new Date(iso) : fallback;
  if (!d || Number.isNaN(d.getTime())) return "text-app-muted";
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return "text-app-green";
  if (days < 30) return "text-app-muted";
  return "text-app-muted/60";
}

/** Relative age string ("2h ago", "3d ago") from an ISO date or fallback Date. */
function relativeAge(iso: string | null, fallback: Date | null): string {
  const d = iso ? new Date(iso) : fallback;
  if (!d || Number.isNaN(d.getTime())) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

// ─── Row action icon button ─────────────────────────────────────────────────────

const RowAction: React.FC<{
  icon: typeof faDownload;
  title: string;
  hover: string; // tailwind text/bg colour tokens on hover
  onClick: () => void;
  spinning?: boolean;
}> = ({ icon, title, hover, onClick, spinning }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={spinning}
    className={`flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors ${hover} disabled:opacity-50`}
  >
    <FontAwesomeIcon icon={spinning ? faSpinner : icon} spin={spinning} />
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Backups: React.FC = () => {
  const [entries, setEntries] = useState<BackupEntry[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    kind: "restore",
    key: "",
  });
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Bulk selection (keys). Consumers always intersect with `entries`, so stale
  // keys left after a reload are harmless.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load available backups ──────────────────────────────────────────────────

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

  // ── Toolbar actions ─────────────────────────────────────────────────────────

  const handleRunBackup = async () => {
    setBackupBusy(true);
    try {
      await api.post("/admin/backup");
      triggerToast("Backup completed successfully!", true);
      await loadEntries();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error during backup"), false);
    } finally {
      setBackupBusy(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploadBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/admin/backup/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      triggerToast("File uploaded successfully!", true);
      await loadEntries();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error during upload"), false);
    } finally {
      setUploadBusy(false);
    }
  };

  // ── Download (shared by single + bulk) ────────────────────────────────────────

  const downloadOne = async (key: string) => {
    const resp = await api.get(
      `/admin/backup/download/${encodeURIComponent(key)}`,
      { responseType: "blob" },
    );
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = key.replace(".sql.gz.enc", ".sql");
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (key: string) => {
    setDownloadingKey(key);
    try {
      await downloadOne(key);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Backup not found"), false);
    } finally {
      setDownloadingKey(null);
    }
  };

  // ── Selection ─────────────────────────────────────────────────────────────────

  const toggleOne = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const selectedHere = entries.filter((e) => prev.has(e.key)).length;
      if (selectedHere === entries.length) return new Set();
      return new Set(entries.map((e) => e.key));
    });

  const clearSelection = () => setSelected(new Set());

  const selectedKeys = () =>
    entries.filter((e) => selected.has(e.key)).map((e) => e.key);

  const handleBulkDownload = async () => {
    const keys = selectedKeys();
    if (keys.length === 0) return;
    setBulkBusy(true);
    let ok = 0;
    let fail = 0;
    for (const key of keys) {
      try {
        await downloadOne(key);
        ok++;
      } catch {
        fail++;
      }
    }
    triggerToast(
      fail
        ? `Downloaded ${ok}, ${fail} failed`
        : `Downloaded ${ok} snapshot${ok === 1 ? "" : "s"}`,
      fail === 0,
    );
    setBulkBusy(false);
  };

  // ── Confirm (restore / delete / bulk-delete) ──────────────────────────────────

  const openConfirm = (kind: ConfirmState["kind"], key: string) =>
    setConfirm({ open: true, kind, key });

  const closeConfirm = () => setConfirm((c) => ({ ...c, open: false }));

  const runConfirm = async () => {
    setConfirmBusy(true);
    try {
      if (confirm.kind === "restore") {
        await api.post(`/admin/restore/${encodeURIComponent(confirm.key)}`);
        triggerToast("Restore completed!", true);
      } else if (confirm.kind === "delete") {
        await api.delete(`/admin/backup/${encodeURIComponent(confirm.key)}`);
        triggerToast("Backup deleted", true);
      } else {
        // bulk-delete: loop the (tested) single-delete endpoint per key.
        const keys = selectedKeys();
        let ok = 0;
        let fail = 0;
        for (const key of keys) {
          try {
            await api.delete(`/admin/backup/${encodeURIComponent(key)}`);
            ok++;
          } catch {
            fail++;
          }
        }
        triggerToast(
          fail
            ? `Deleted ${ok}, ${fail} failed`
            : `Deleted ${ok} snapshot${ok === 1 ? "" : "s"}`,
          fail === 0,
        );
        clearSelection();
      }
      closeConfirm();
      await loadEntries();
    } catch (err: unknown) {
      triggerToast(
        getApiErrorTitle(
          err,
          confirm.kind === "restore"
            ? "Error during restore"
            : "Error deleting backup",
        ),
        false,
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const newest = entries[0];
  const selectedCount = entries.filter((e) => selected.has(e.key)).length;
  const headerState: CheckboxState =
    selectedCount === 0
      ? "unchecked"
      : selectedCount === entries.length
        ? "checked"
        : "indeterminate";

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col gap-6 xl:min-h-0 xl:flex-1">
      <AdminPageHeader
        title="Backups"
        description="Snapshot, restore and transfer the database via Cloudflare R2."
      />

      {/* Integrated toolbar: bucket summary on the left, actions on the right */}
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
                  {newest.sizeBytes > 0 && (
                    <> · {formatSize(newest.sizeBytes)}</>
                  )}
                </>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePickFile}
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
            onClick={handleRunBackup}
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
            onChange={handleFileChange}
          />
        </div>
      </div>

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
            <span className="font-app-mono">{selectedCount}</span> selected
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
            onClick={handleBulkDownload}
            disabled={bulkBusy || !hasSelection}
          >
            <FontAwesomeIcon
              icon={bulkBusy ? faSpinner : faDownload}
              spin={bulkBusy}
            />
            Download
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => openConfirm("bulk-delete", "")}
            disabled={bulkBusy || !hasSelection}
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </Button>
          {hasSelection && (
            <button
              type="button"
              onClick={clearSelection}
              title="Clear selection"
              aria-label="Clear selection"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      </div>

      {/* Snapshot table — fills remaining height on xl, scrolls internally */}
      <div className="overflow-hidden rounded-[var(--r-card)] border border-app-border bg-app-card/50 backdrop-blur-sm xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        <div className="max-h-[65vh] overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-app-surface text-xs uppercase tracking-wider text-app-muted">
              <tr>
                <th className="w-px px-6 py-4">
                  {entries.length > 0 && (
                    <Checkbox
                      state={headerState}
                      onChange={toggleAll}
                      size="sm"
                      aria-label="Select all backups"
                    />
                  )}
                </th>
                <th className="px-6 py-4 font-semibold">
                  <FontAwesomeIcon
                    icon={faDatabase}
                    className="mr-2 text-[var(--brand-1)]"
                  />
                  Snapshot
                </th>
                <th className="px-6 py-4 font-semibold">
                  <FontAwesomeIcon
                    icon={faHardDrive}
                    className="mr-2 text-app-sky"
                  />
                  Size
                </th>
                <th className="px-6 py-4 font-semibold">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="mr-2 text-app-yellow"
                  />
                  Age
                </th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {listLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-app-muted"
                  >
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Loading backups…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-app-muted"
                  >
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="mr-2 text-app-yellow"
                    />
                    No backups in the bucket. Run one from the toolbar.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr
                    key={e.key}
                    className={`transition-colors ${
                      selected.has(e.key)
                        ? "bg-[var(--brand-1)]/5"
                        : "hover:bg-app-hover/40"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <Checkbox
                        state={selected.has(e.key)}
                        onChange={() => toggleOne(e.key)}
                        size="sm"
                        aria-label={`Select ${formatLabel(e.key)}`}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]">
                          <FontAwesomeIcon
                            icon={faDatabase}
                            className="text-xs"
                          />
                        </span>
                        <span className="font-app-mono text-app-text">
                          {formatLabel(e.key)}
                        </span>
                        {e.key === newest?.key && (
                          <Badge variant="subtle" tone="green" uppercase>
                            Latest
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-app-mono text-app-muted">
                      {e.sizeBytes > 0 ? formatSize(e.sizeBytes) : "—"}
                    </td>
                    <td
                      className={`px-6 py-3.5 font-app-mono ${ageColorClass(
                        e.lastModified,
                        parseKeyDate(e.key),
                      )}`}
                    >
                      {relativeAge(e.lastModified, parseKeyDate(e.key))}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <RowAction
                          icon={faDownload}
                          title="Download"
                          hover="hover:bg-app-sky/10 hover:text-app-sky"
                          spinning={downloadingKey === e.key}
                          onClick={() => handleDownload(e.key)}
                        />
                        <RowAction
                          icon={faRotateLeft}
                          title="Restore"
                          hover="hover:bg-app-yellow/10 hover:text-app-yellow"
                          onClick={() => openConfirm("restore", e.key)}
                        />
                        <RowAction
                          icon={faTrash}
                          title="Delete"
                          hover="hover:bg-app-red/10 hover:text-app-red"
                          onClick={() => openConfirm("delete", e.key)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={confirm.open}
        busy={confirmBusy}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
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
    </div>
  );
};

export default Backups;
