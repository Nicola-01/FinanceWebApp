import React, { useRef, useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faUpload,
  faFileCsv,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorDetail } from "../../utils/apiError.ts";
import { Card } from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { CsvFormatModal } from "./CsvFormatModal.tsx";
import {
  ImportReviewModal,
  type ImportRecap,
} from "../../modals/common/ImportReviewModal.tsx";
import api from "../../api/axiosConfig";
import {
  TRANSACTION_COLUMNS,
  TAG_COLUMNS,
  SUBSCRIPTION_COLUMNS,
  parseTransactionsCsv,
  parseTagsCsv,
  parseSubscriptionsCsv,
  type TransactionRequest,
  type TagRequest,
  type SubscriptionRequest,
} from "./csvImport.ts";
import {
  detectTransactionOverwrites,
  detectTagOverwrites,
  detectSubscriptionOverwrites,
  type DedupOverwrite,
} from "./csvDedup.ts";
import type { Tag } from "../../utils/types";

/** Which resource an export/import action targets. */
type Resource = "transactions" | "tags" | "subscriptions";

/** Request DTOs the bulk endpoints accept, keyed by resource. */
type ImportDtos = TransactionRequest[] | TagRequest[] | SubscriptionRequest[];

/** A prepared import: everything needed to POST and to render the review modal. */
interface ImportJob {
  resource: Resource;
  endpoint: string;
  dtos: ImportDtos;
  newCount: number;
  overwrites: DedupOverwrite[];
}

/** Live state of the review modal (null = closed). */
interface ImportModalState extends ImportJob {
  phase: "confirm" | "recap";
  recap?: ImportRecap;
  submitting: boolean;
}

/** Shape of the structured bulk-import response bodies. */
interface BulkResponse {
  created?: unknown[];
  updated?: unknown[];
  autoCreatedTags?: { name: string }[];
}

/** Reduces a bulk response to the recap counts the modal displays. */
const toRecap = (data: BulkResponse): ImportRecap => ({
  created: data.created?.length ?? 0,
  updated: data.updated?.length ?? 0,
  autoCreatedTags: (data.autoCreatedTags ?? []).map((t) => t.name),
});

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
  const { wallet, tags, transactions, subscriptions, fetchData } =
    useWalletContext();
  const [formatOpen, setFormatOpen] = useState(false);
  // Review modal state (null = closed). Confirm phase gates overwrites; recap
  // phase reports the backend's structured result after a successful import.
  const [review, setReview] = useState<ImportModalState | null>(null);

  // One hidden <input> shared by all three import buttons; the button that was
  // clicked stores its resource here so the change handler knows the target.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTargetRef = useRef<Resource | null>(null);

  const handleExportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      triggerToast("No transactions to export", false);
      return;
    }

    const headers = TRANSACTION_COLUMNS.map((c) => c.key);
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

    const headers = TAG_COLUMNS.map((c) => c.key);
    const rows = sortTagsForExport(tags).map((tag) => [
      tag.name,
      tag.icon,
      tag.colorHex,
      tag.parentName || "",
    ]);

    downloadCsv([headers, ...rows], `${wallet.name}_tags.csv`);
    triggerToast("Tags exported successfully", true);
  };

  const handleExportSubscriptions = () => {
    if (!subscriptions || subscriptions.length === 0) {
      triggerToast("No subscriptions to export", false);
      return;
    }

    const headers = SUBSCRIPTION_COLUMNS.map((c) => c.key);
    const rows = subscriptions.map((sub) => [
      sub.name,
      sub.tag?.name ?? "",
      sub.amount,
      sub.type,
      sub.status,
      sub.startDate,
      sub.frequencyType,
      sub.frequencyInterval,
      sub.monthlySpecificDay ?? "",
      String(sub.lastWorkingDayOfMonth),
      sub.duration,
      sub.durationTimes ?? "",
      sub.durationUntil ?? "",
      sub.originalAmount ?? "",
      sub.originalCurrency ?? "",
      sub.exchangeValue ?? "",
      String(sub.autoExchangeRate),
      sub.notes ?? "",
    ]);

    downloadCsv([headers, ...rows], `${wallet.name}_subscriptions.csv`);
    triggerToast("Subscriptions exported successfully", true);
  };

  // Open the file picker for a given resource.
  const requestImport = (resource: Resource) => {
    importTargetRef.current = resource;
    fileInputRef.current?.click();
  };

  // Parse the CSV into request DTOs and run dedup detection against the wallet
  // data, so the caller knows both the payload and whether overwrites loom.
  const buildJob = (target: Resource, text: string): ImportJob => {
    if (target === "transactions") {
      const dtos = parseTransactionsCsv(text);
      const { overwrites, newCount } = detectTransactionOverwrites(
        dtos,
        transactions,
      );
      return {
        resource: target,
        endpoint: `/transactions/${wallet.id}/bulk`,
        dtos,
        overwrites,
        newCount,
      };
    }
    if (target === "tags") {
      const dtos = parseTagsCsv(text);
      const { overwrites, newCount } = detectTagOverwrites(dtos, tags);
      return {
        resource: target,
        endpoint: `/tags/${wallet.id}/bulk`,
        dtos,
        overwrites,
        newCount,
      };
    }
    const dtos = parseSubscriptionsCsv(text);
    const { overwrites, newCount } = detectSubscriptionOverwrites(
      dtos,
      subscriptions,
    );
    return {
      resource: target,
      endpoint: `/subscription/${wallet.id}/bulk`,
      dtos,
      overwrites,
      newCount,
    };
  };

  // POST the whole file to the matching bulk endpoint in a single atomic
  // request, then swap the modal to the recap phase and refresh wallet data.
  const submitJob = async (job: ImportJob) => {
    setReview((prev) => (prev ? { ...prev, submitting: true } : prev));
    try {
      const { data } = await api.post(job.endpoint, job.dtos);
      setReview({
        ...job,
        phase: "recap",
        recap: toRecap(data as BulkResponse),
        submitting: false,
      });
      await fetchData();
    } catch (err: unknown) {
      // The bulk endpoints report the offending line as `Row N: <reason>`.
      triggerToast(getApiErrorDetail(err, "Import failed"), false);
      setReview(null);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    const target = importTargetRef.current;
    // Reset immediately so re-selecting the same file fires `change` again.
    input.value = "";
    importTargetRef.current = null;

    if (!file || !target) return;

    let job: ImportJob;
    try {
      job = buildJob(target, await file.text());
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Import failed"), false);
      return;
    }

    // Overwrites → gate behind the confirm phase; the user commits explicitly.
    if (job.overwrites.length > 0) {
      setReview({ ...job, phase: "confirm", submitting: false });
      return;
    }

    // Nothing to overwrite → import straight away and show the recap.
    await submitJob(job);
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

      {/* Review overwrites (confirm) then report the result (recap). */}
      <ImportReviewModal
        open={review !== null}
        phase={review?.phase ?? "confirm"}
        resource={review?.resource ?? "transactions"}
        newCount={review?.newCount ?? 0}
        overwrites={review?.overwrites ?? []}
        recap={review?.recap}
        submitting={review?.submitting ?? false}
        accentColor={wallet.color}
        onConfirm={() => review && submitJob(review)}
        onClose={() => setReview(null)}
      />

      {/* Shared hidden picker for all import buttons. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileSelected}
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
            <Button
              variant="secondary"
              fullWidth
              onClick={handleExportSubscriptions}
            >
              <FontAwesomeIcon icon={faDownload} />
              Subscriptions (.csv)
            </Button>
            <Button variant="secondary" fullWidth onClick={handleExportTags}>
              <FontAwesomeIcon icon={faDownload} />
              Tags (.csv)
            </Button>
          </div>
        </div>

        {/* IMPORT — each button ships the whole CSV to a single bulk endpoint
            (POST /<resource>/{walletId}/bulk), an atomic all-or-nothing request
            rather than one call per row. */}
        <div className="flex flex-col gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUpload} className="text-app-blue" />
            <span className="text-sm font-bold uppercase tracking-wider text-app-text">
              Import
            </span>
          </div>
          <p className="text-xs text-app-muted">
            Upload a CSV to add records in bulk. Match the export format — open
            the format guide (?) if unsure.
          </p>
          <div className="mt-auto flex flex-col gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => requestImport("transactions")}
            >
              <FontAwesomeIcon icon={faUpload} />
              Transactions (.csv)
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => requestImport("subscriptions")}
            >
              <FontAwesomeIcon icon={faUpload} />
              Subscriptions (.csv)
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => requestImport("tags")}
            >
              <FontAwesomeIcon icon={faUpload} />
              Tags (.csv)
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
