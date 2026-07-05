import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileCsv,
  faTrashCan,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import {
  parseAndValidateCsv,
  type RowError,
} from "../../../dashboard/settings/csvValidation";
import type { TransactionRequest } from "../../../dashboard/settings/csvImport";

export interface TransactionsStepProps {
  /** Transactions staged so far (owned by the wizard). */
  value: TransactionRequest[];
  /** Emit the next staged list (append on a good upload, or `[]` on clear). */
  onChange: (next: TransactionRequest[]) => void;
  /** Wallet currency code (e.g. "EUR") used to annotate staged amounts. */
  currency: string;
  /** Wallet colour (hex) applied to the upload CTA. */
  accentColor?: string;
}

/** How many staged rows to preview before collapsing into a "+N more" note. */
const PREVIEW_LIMIT = 5;

/**
 * Wizard step (body only — no stepper, no Back/Continue) that stages
 * transactions for a new wallet from a single CSV upload. It reuses the shared
 * client-side parse+validate pass (`parseAndValidateCsv`), so a file that would
 * be rejected by the all-or-nothing bulk endpoint is caught here first: any row
 * error blocks the whole file and is listed inline; a clean file appends its
 * rows to the staged list. Controlled — the wizard owns `value`.
 */
export function TransactionsStep({
  value,
  onChange,
  currency,
  accentColor,
}: TransactionsStepProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  // Row-level problems from the last upload; a non-empty list blocks the append.
  const [errors, setErrors] = useState<RowError[]>([]);
  // Count from the last successful upload (null = no upload yet / after clear).
  const [addedCount, setAddedCount] = useState<number | null>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset immediately so re-selecting the same file fires `change` again.
    input.value = "";
    if (!file) return;

    const { dtos, rowErrors } = parseAndValidateCsv(
      "transactions",
      await file.text(),
    );

    if (rowErrors.length > 0) {
      // Surface every problem inline; nothing is staged.
      setErrors(rowErrors);
      setAddedCount(null);
      return;
    }

    setErrors([]);
    setAddedCount(dtos.length);
    onChange([...value, ...dtos]);
  };

  const clearAll = () => {
    setErrors([]);
    setAddedCount(null);
    onChange([]);
  };

  const preview = value.slice(0, PREVIEW_LIMIT);
  const overflow = value.length - preview.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Upload well — the only entry point (no manual entry). */}
      <div className="flex flex-col items-center gap-3 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-8 text-center">
        <FontAwesomeIcon icon={faFileCsv} className="text-2xl text-app-muted" />
        <div>
          <p className="text-sm font-semibold text-app-text">
            Import transactions from a CSV
          </p>
          <p className="mt-1 text-xs text-app-muted">
            The file must match the transactions export format.
          </p>
        </div>
        <Button
          type="button"
          accentColor={accentColor}
          ripple
          onClick={openPicker}
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload CSV
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          aria-label="Transactions CSV file"
          onChange={handleFile}
        />
        {/* Format hint — link-styled text only, no modal. */}
        <p className="text-[11px] text-app-muted">
          Columns:{" "}
          <span className="font-app-mono">
            Date, Name, Tag, Amount, Type, …
          </span>{" "}
          —{" "}
          <span className="font-semibold text-app-text underline decoration-app-border underline-offset-2">
            match the export format
          </span>
          .
        </p>
      </div>

      {/* Validation errors from the last upload (blocks the append). */}
      {errors.length > 0 && (
        <div className="rounded-[var(--r-input)] border border-app-red/40 bg-app-red/10 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-app-red">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            This file has {errors.length} problem
            {errors.length === 1 ? "" : "s"} — nothing was imported.
          </p>
          <ul className="custom-scrollbar max-h-40 space-y-1 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={`${err.row}-${i}`} className="text-xs text-app-text">
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success summary from the last upload. */}
      {addedCount !== null && errors.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-app-green">
          <FontAwesomeIcon icon={faCircleCheck} />
          {addedCount} transaction{addedCount === 1 ? "" : "s"} ready to import.
        </p>
      )}

      {/* Staged list: count + a few rows + Clear. */}
      {value.length > 0 && (
        <div className="rounded-[var(--r-input)] border border-app-border bg-app-input">
          <div className="flex items-center justify-between border-b border-app-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
              {value.length} staged
            </span>
            <Button variant="ghost" size="sm" type="button" onClick={clearAll}>
              <FontAwesomeIcon icon={faTrashCan} />
              Clear
            </Button>
          </div>
          <ul className="custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto">
            {preview.map((tx, i) => (
              <li
                key={`${tx.name}-${tx.transactionDate}-${i}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-app-text">
                  {tx.name || <span className="text-app-muted">(unnamed)</span>}
                </span>
                <span className="shrink-0 font-app-mono text-xs tabular-nums text-app-muted">
                  <span
                    className={
                      tx.type === "INCOME" ? "text-app-green" : "text-app-red"
                    }
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {tx.amount} {currency}
                  </span>
                  {" · "}
                  {tx.transactionDate}
                </span>
              </li>
            ))}
          </ul>
          {overflow > 0 && (
            <p className="border-t border-app-border px-3 py-2 text-xs text-app-muted">
              +{overflow} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionsStep;
