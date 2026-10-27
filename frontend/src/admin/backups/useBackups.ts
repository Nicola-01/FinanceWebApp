import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError.ts";
import { useSelection } from "../../hooks/useSelection.ts";
import type { BackupEntry, ConfirmState } from "./types.ts";

/** Backup list + every admin action on it (run, upload, download, restore, delete, bulk). */
export function useBackups() {
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
  const { selected, toggleOne, toggleAll, clearSelection } = useSelection();
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

  const selectedCount = entries.filter((e) => selected.has(e.key)).length;

  return {
    entries,
    listLoading,
    backupBusy,
    uploadBusy,
    downloadingKey,
    confirm,
    confirmBusy,
    selected,
    selectedCount,
    toggleOne,
    toggleAll,
    clearSelection,
    bulkBusy,
    fileInputRef,
    handleRunBackup,
    handlePickFile,
    handleFileChange,
    handleDownload,
    handleBulkDownload,
    openConfirm,
    closeConfirm,
    runConfirm,
  };
}
