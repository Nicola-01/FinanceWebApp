import React, { useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faUpload,
  faFileCsv,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { CsvFormatModal } from "./CsvFormatModal.tsx";
import type { Tag } from "../../utils/types";

/**
 * Export order: alphabetical, grouped by parent — each parent immediately
 * followed by its own children (children alphabetical within the parent).
 */
const sortTagsForExport = (tags: Tag[]): Tag[] =>
  [...tags].sort((a, b) => {
    const groupA = a.parentName || a.name;
    const groupB = b.parentName || b.name;
    const byGroup = groupA.localeCompare(groupB, undefined, {
      sensitivity: "base",
    });
    if (byGroup !== 0) return byGroup;
    // Same group: the parent (no parentName) comes before its children.
    const childA = a.parentName ? 1 : 0;
    const childB = b.parentName ? 1 : 0;
    if (childA !== childB) return childA - childB;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

const downloadCsv = (rows: (string | number)[][], filename: string) => {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const DataTab: React.FC = () => {
  const { wallet, tags, transactions } = useWalletContext();
  const [formatOpen, setFormatOpen] = useState(false);

  const handleExportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      triggerToast("No transactions to export", false);
      return;
    }

    const headers = [
      "Date",
      "Name",
      "Tag",
      "Amount",
      "Type",
      "Notes",
      "OriginalAmount",
      "OriginalCurrency",
      "ExchangeValue",
    ];
    // Chronological order (oldest first).
    const ordered = [...transactions].sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );
    const rows = ordered.map((tx) => [
      tx.transactionDate,
      tx.name,
      tx.tag.name,
      tx.amount,
      tx.type,
      tx.notes || "",
      tx.originalAmount || "",
      tx.originalCurrency || "",
      tx.exchangeValue || "",
    ]);

    downloadCsv([headers, ...rows], `${wallet.name}_transactions.csv`);
    triggerToast("Transactions exported successfully", true);
  };

  const handleExportTags = () => {
    if (!tags || tags.length === 0) {
      triggerToast("No tags to export", false);
      return;
    }

    const headers = ["Name", "Icon", "ColorHex", "ParentName"];
    const rows = sortTagsForExport(tags).map((tag) => [
      tag.name,
      tag.icon,
      tag.colorHex,
      tag.parentName || "",
    ]);

    downloadCsv([headers, ...rows], `${wallet.name}_tags.csv`);
    triggerToast("Tags exported successfully", true);
  };

  return (
    <Card
      title="Data Management"
      subtitle="Export your data to CSV, or import from a file"
      icon={faFileCsv}
      iconColor={wallet.color}
    >
      {/* Help affordance: opens the CSV format reference. */}
      <button
        type="button"
        onClick={() => setFormatOpen(true)}
        aria-label="CSV format help"
        title="CSV format"
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-text sm:right-6 sm:top-6"
      >
        <FontAwesomeIcon icon={faCircleInfo} />
      </button>

      <CsvFormatModal
        open={formatOpen}
        onClose={() => setFormatOpen(false)}
        accentColor={wallet.color}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* EXPORT */}
        <div className="flex flex-col gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faDownload} className="text-app-green" />
            <span className="text-sm font-bold uppercase tracking-wider text-app-text">
              Export
            </span>
          </div>
          <p className="text-xs text-app-muted">
            Download your data as CSV for backups or external analysis.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleExportTransactions}
            >
              <FontAwesomeIcon icon={faDownload} />
              Transactions (.csv)
            </Button>
            <Button variant="secondary" fullWidth onClick={handleExportTags}>
              <FontAwesomeIcon icon={faDownload} />
              Tags (.csv)
            </Button>
          </div>
        </div>

        {/* IMPORT — TODO: disabled on purpose.
            The client-side implementation fired one HTTP request per row
            (a 400-row CSV = 400+ POST/PUT requests), which floods the backend
            like a self-inflicted DoS. Re-enable only once there is a single
            bulk-import endpoint that ingests the whole file/array in one
            request (server-side parse + batched upsert + the overwrite /
            auto-create-main-tag merge rules). The preview/recap modal + merge
            semantics are specced in .claude/TODO/settings-redesign.md. */}
        <div className="flex flex-col gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUpload} className="text-app-blue" />
            <span className="text-sm font-bold uppercase tracking-wider text-app-text">
              Import
            </span>
          </div>
          <p className="text-xs text-app-muted">
            Bulk CSV import is coming soon.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <Button variant="secondary" fullWidth disabled title="Coming soon">
              <FontAwesomeIcon icon={faUpload} />
              Transactions (.csv)
            </Button>
            <Button variant="secondary" fullWidth disabled title="Coming soon">
              <FontAwesomeIcon icon={faUpload} />
              Tags (.csv)
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
