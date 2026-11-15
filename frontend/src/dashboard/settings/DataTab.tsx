import React, { useState } from "react";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faUpload,
  faFileCsv,
  faCircleInfo,
  faFileZipper,
} from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { SettingsBox } from "./SettingsBox.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { BankAccountsSection } from "./BankAccountsSection.tsx";
import { BankRulesSection } from "./BankRulesSection.tsx";
import { BankEntryCard } from "./bank/BankEntryCard.tsx";
import Button from "../../components/ui/Button.tsx";
import { CsvFormatModal } from "./CsvFormatModal.tsx";
import { ImportReviewModal } from "../../modals/common/ImportReviewModal.tsx";
import {
  downloadBlob,
  downloadCsv,
  subscriptionsCsvRows,
  tagsCsvRows,
  transactionsCsvRows,
  walletZipBlob,
} from "./csvExport.ts";
import { useCsvImport } from "./useCsvImport.ts";

export const DataTab: React.FC = () => {
  const { wallet, tags, transactions, subscriptions } = useWalletContext();
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const [formatOpen, setFormatOpen] = useState(false);
  const {
    review,
    closeReview,
    submitJob,
    fileInputRef,
    requestImport,
    handleFileSelected,
  } = useCsvImport();

  const handleExportAll = async () => {
    try {
      const blob = await walletZipBlob(wallet.name, {
        transactions,
        subscriptions,
        tags,
      });
      if (!blob) {
        triggerToast("Nothing to export", false);
        return;
      }
      downloadBlob(blob, `${wallet.name}_export.zip`);
      triggerToast("Wallet exported", true);
    } catch {
      triggerToast("Export failed", false);
    }
  };

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

  // ui-v2-switch: bordered tiles like v1 (no fill), sentence-case headers.
  const tileClass = isV2
    ? "flex flex-col gap-3 rounded-[var(--r-input)] border border-app-border p-4"
    : "flex flex-col gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4";
  // ui-v2-switch: v2 secondary is transparent in dark mode; force a raised fill.
  const dataBtnClass = isV2
    ? "!bg-app-raised !text-app-text hover:brightness-110"
    : "";
  const headerClass = isV2
    ? "text-sm font-semibold text-app-text"
    : "text-sm font-bold uppercase tracking-wider text-app-text";
  const hintClass = isV2
    ? "text-[13px] text-app-muted"
    : "text-xs text-app-muted";

  return (
    <>
      {isV2 ? ( // ui-v2-switch
        <BankEntryCard />
      ) : (
        <>
          <BankAccountsSection />
          <BankRulesSection />
        </>
      )}
      <SettingsBox
        title={isV2 ? "Data" : "Data Management"}
        description="Export your data to CSV, or import from a file"
        icon={faFileCsv}
        iconColor={wallet.color}
      >
        {/* Help affordance: opens the CSV format reference. */}
        {isV2 ? ( // ui-v2-switch
          <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFormatOpen(true)}
              aria-label="CSV format help"
              title="CSV format"
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFormatOpen(true)}
            aria-label="CSV format help"
            title="CSV format"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-text sm:right-6 sm:top-6"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>
        )}

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
          <div className={tileClass}>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faDownload}
                className={isV2 ? "text-app-muted" : "text-app-green"}
              />
              <span className={headerClass}>Export</span>
            </div>
            <p className={hintClass}>
              Download everything as one .zip, or a single CSV for backups or
              external analysis.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <Button
                variant="primary"
                accentColor={isV2 ? undefined : wallet.color}
                fullWidth
                onClick={handleExportAll}
              >
                <FontAwesomeIcon icon={faFileZipper} />
                Download all (.zip)
              </Button>
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={handleExportTransactions}
              >
                <FontAwesomeIcon icon={faDownload} />
                Transactions (.csv)
              </Button>
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={handleExportSubscriptions}
              >
                <FontAwesomeIcon icon={faDownload} />
                Subscriptions (.csv)
              </Button>
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={handleExportTags}
              >
                <FontAwesomeIcon icon={faDownload} />
                Tags (.csv)
              </Button>
            </div>
          </div>

          {/* IMPORT — each button ships the whole CSV to a single bulk endpoint
            (POST /<resource>/{walletId}/bulk), an atomic all-or-nothing request
            rather than one call per row. */}
          <div className={tileClass}>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={faUpload}
                className={isV2 ? "text-app-muted" : "text-app-blue"}
              />
              <span className={headerClass}>Import</span>
            </div>
            <p className={hintClass}>
              Upload a CSV to add records in bulk. Match the export format —
              open the format guide (?) if unsure.
            </p>
            <div className="mt-auto flex flex-col gap-2">
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={() => requestImport("transactions")}
              >
                <FontAwesomeIcon icon={faUpload} />
                Transactions (.csv)
              </Button>
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={() => requestImport("subscriptions")}
              >
                <FontAwesomeIcon icon={faUpload} />
                Subscriptions (.csv)
              </Button>
              <Button
                variant="secondary"
                className={dataBtnClass}
                fullWidth
                onClick={() => requestImport("tags")}
              >
                <FontAwesomeIcon icon={faUpload} />
                Tags (.csv)
              </Button>
            </div>
          </div>
        </div>
      </SettingsBox>
    </>
  );
};
