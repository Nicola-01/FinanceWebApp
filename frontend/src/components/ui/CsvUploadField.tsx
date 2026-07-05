import { useRef, useState, type DragEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileCsv,
  faUpload,
  faCircleInfo,
  faTriangleExclamation,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import { CsvFormatModal } from "../../dashboard/settings/CsvFormatModal";
import {
  parseAndValidateCsv,
  type CsvResource,
  type RowError,
} from "../../dashboard/settings/csvValidation";

export interface CsvUploadFieldProps<T> {
  /** Which resource's parser/validator to run, and which format tab to show. */
  resource: CsvResource;
  title: string;
  subtitle?: string;
  /** Short "Columns: …" hint under the CTA (the ℹ️ opens the full reference). */
  columnsHint?: string;
  /** Singular noun for the success line ("{n} {noun}s added."). */
  noun?: string;
  accentColor?: string;
  /** Compact variant: a small "Upload CSV" button in a corner (no big dropzone). */
  compact?: boolean;
  /** Called with the parsed rows when a file validates cleanly. */
  onDtos: (dtos: T[]) => void;
}

/**
 * Reusable CSV drop zone: click-to-browse OR drag & drop a `.csv` from the
 * desktop, run through the shared parse+validate pass, list any row errors
 * inline (blocking the import), and hand clean rows to `onDtos`. An ℹ️ opens the
 * same `CsvFormatModal` reference drawer used in Settings → Data.
 */
export function CsvUploadField<T>({
  resource,
  title,
  subtitle,
  columnsHint,
  noun = "row",
  accentColor,
  compact = false,
  onDtos,
}: CsvUploadFieldProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [addedCount, setAddedCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);

  const ingest = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors([{ row: 0, message: "Please choose a .csv file" }]);
      setAddedCount(null);
      return;
    }
    const { dtos, rowErrors } = parseAndValidateCsv(
      resource,
      await file.text(),
    );
    if (rowErrors.length > 0) {
      setErrors(rowErrors);
      setAddedCount(null);
      return;
    }
    setErrors([]);
    setAddedCount(dtos.length);
    onDtos(dtos as T[]);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let re-selecting the same file fire `change` again
    if (file) void ingest(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void ingest(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {compact ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setFormatOpen(true)}
            aria-label="CSV format help"
            title="CSV format"
            className="flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>
          {/* Neutral (no accent) once tags are already imported — this is a
              secondary "add more" action, not the primary CTA. */}
          <Button
            type="button"
            variant="secondary"
            ripple
            onClick={() => inputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faUpload} />
            Upload CSV
          </Button>
        </div>
      ) : (
        <div
          data-testid="csv-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center gap-3 rounded-[var(--r-card)] border border-dashed px-6 py-8 text-center transition-colors ${
            dragging
              ? "border-app-blue bg-app-hover"
              : "border-app-border bg-app-surface"
          }`}
        >
          <button
            type="button"
            onClick={() => setFormatOpen(true)}
            aria-label="CSV format help"
            title="CSV format"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
          </button>

          <FontAwesomeIcon
            icon={faFileCsv}
            className="text-2xl text-app-muted"
          />
          <div>
            <p className="text-sm font-semibold text-app-text">{title}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-app-muted">{subtitle}</p>
            )}
            <p className="mt-1 text-xs text-app-muted">
              Drag &amp; drop a <span className="font-app-mono">.csv</span>{" "}
              here, or
            </p>
          </div>
          <Button
            type="button"
            accentColor={accentColor}
            ripple
            onClick={() => inputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faUpload} />
            Choose file
          </Button>
          {columnsHint && (
            <p className="text-[11px] text-app-muted">
              Columns: <span className="font-app-mono">{columnsHint}</span> —
              tap <FontAwesomeIcon icon={faCircleInfo} /> for the full format.
            </p>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        aria-label={`${resource} CSV file`}
        onChange={onInput}
      />

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
                {err.row > 0 ? `Row ${err.row}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {addedCount !== null && errors.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-app-green">
          <FontAwesomeIcon icon={faCircleCheck} />
          {addedCount} {noun}
          {addedCount === 1 ? "" : "s"} added.
        </p>
      )}

      <CsvFormatModal
        open={formatOpen}
        onClose={() => setFormatOpen(false)}
        accentColor={accentColor ?? "#8b5cf6"}
        defaultMode={resource}
      />
    </div>
  );
}

export default CsvUploadField;
