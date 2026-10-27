export interface BackupEntry {
  key: string;
  lastModified: string | null; // ISO-8601 from Instant
  sizeBytes: number;
}

export interface ConfirmState {
  open: boolean;
  kind: "restore" | "delete" | "bulk-delete";
  key: string; // single-op key ("" for bulk-delete)
}
