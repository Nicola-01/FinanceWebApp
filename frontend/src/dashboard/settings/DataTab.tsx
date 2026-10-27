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
import { BankAccountsSection } from "./BankAccountsSection.tsx";
import Button from "../../components/ui/Button.tsx";
import { CsvFormatModal } from "./CsvFormatModal.tsx";
import { ImportReviewModal } from "../../modals/common/ImportReviewModal.tsx";
import {
  downloadCsv,
  subscriptionsCsvRows,
  tagsCsvRows,
  transactionsCsvRows,
} from "./csvExport.ts";
import { useCsvImport } from "./useCsvImport.ts";

export const DataTab: React.FC = () => {
  const { wallet, tags, transactions, subscriptions } = useWalletContext();
  const [formatOpen, setFormatOpen] = useState(false);
  const {
    review,
    closeReview,
    submitJob,
    fileInputRef,
    requestImport,
    handleFileSelected,
  } = useCsvImport();

  const handleExportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      triggerToast("No transactions to export", false);
      return;
    }

    downloadCsv(
      transactionsCsvRows(transactions),
      `${wallet.name}_transactions.csv`,
    );
    triggerToast("Transactions exported successfully", true);
  };

  const handleExportTags = () => {
    if (!tags || tags.length === 0) {
      triggerToast("No tags to export", false);
      return;
    }

    downloadCsv(tagsCsvRows(tags), `${wallet.name}_tags.csv`);
    triggerToast("Tags exported successfully", true);
  };

  const handleExportSubscriptions = () => {
    if (!subscriptions || subscriptions.length === 0) {
      triggerToast("No subscriptions to export", false);
      return;
    }

    downloadCsv(
      subscriptionsCsvRows(subscriptions),
      `${wallet.name}_subscriptions.csv`,
    );
    triggerToast("Subscriptions exported successfully", true);
  };

  return (
    <>
      <BankAccountsSection />
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
          onClose={closeReview}
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
              Upload a CSV to add records in bulk. Match the export format —
              open the format guide (?) if unsure.
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
    </>
  );
};
