import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faReceipt,
  faTag,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Selector } from "../../components/ui/Selector.tsx";
import Button from "../../components/ui/Button.tsx";
import { ICONS, type IconKey } from "../../utils/icons.ts";
import {
  TRANSACTION_COLUMNS,
  TAG_COLUMNS,
  SUBSCRIPTION_COLUMNS,
  type CsvColumn,
} from "./csvImport.ts";

type Mode = "transactions" | "tags" | "subscriptions";

interface SampleSpec {
  filename: string;
  columns: CsvColumn[];
  rows: string[][];
}

/**
 * Example rows for each exportable CSV. The column definitions are imported
 * from `csvImport` — the single source of truth shared with the export/import
 * code — so a downloaded sample round-trips with a real export.
 */
const SAMPLES: Record<Mode, SampleSpec> = {
  transactions: {
    filename: "transactions_sample.csv",
    columns: TRANSACTION_COLUMNS,
    rows: [
      [
        "2026-06-01",
        "Monthly Salary",
        "Salary",
        "2500",
        "INCOME",
        "June paycheck",
        "",
        "",
        "",
      ],
      [
        "2026-06-03",
        "Supermarket",
        "Groceries",
        "54.20",
        "EXPENSE",
        "Weekly shop",
        "",
        "",
        "",
      ],
      [
        "2026-06-10",
        "Hotel Tokyo",
        "Travel",
        "120.25",
        "EXPENSE",
        "Business trip",
        "18500",
        "JPY",
        "0.0065",
      ],
    ],
  },
  tags: {
    filename: "tags_sample.csv",
    columns: TAG_COLUMNS,
    rows: [
      ["Salary", "sack", "#34d399", ""],
      ["Food", "dining", "#f87171", ""],
      ["Groceries", "cart", "#fb923c", "Food"],
      ["Travel", "plane", "#60a5fa", ""],
    ],
  },
  subscriptions: {
    filename: "subscriptions_sample.csv",
    columns: SUBSCRIPTION_COLUMNS,
    rows: [
      [
        "Netflix",
        "Entertainment",
        "12.99",
        "EXPENSE",
        "ACTIVE",
        "2026-01-01",
        "MONTHLY",
        "1",
        "1",
        "false",
        "FOREVER",
        "",
        "",
        "",
        "",
        "",
        "false",
        "Streaming plan",
      ],
      [
        "Salary",
        "Salary",
        "2500",
        "INCOME",
        "ACTIVE",
        "2026-01-31",
        "MONTHLY",
        "1",
        "",
        "true",
        "FOREVER",
        "",
        "",
        "",
        "",
        "",
        "false",
        "Payday",
      ],
      [
        "Gym",
        "Health",
        "30",
        "EXPENSE",
        "PAUSED",
        "2026-02-01",
        "MONTHLY",
        "1",
        "5",
        "false",
        "UNTIL",
        "",
        "2026-12-31",
        "35",
        "USD",
        "0.92",
        "true",
        "",
      ],
    ],
  },
};

/** Same cell-quoting as DataTab's `downloadCsv` — every field double-quoted, comma-joined. */
const buildCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

const downloadSample = (spec: SampleSpec) => {
  const csv = buildCsv(
    spec.columns.map((c) => c.key),
    spec.rows,
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", spec.filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface CsvFormatModalProps {
  open: boolean;
  onClose: () => void;
  /** Per-wallet accent used for the header bar + table accents. */
  accentColor: string;
  /**
   * Which format tab to show first (and re-select whenever the modal reopens).
   * Defaults to Transactions; set it so the ℹ️ on a resource's upload field
   * lands on that resource's format.
   */
  defaultMode?: Mode;
}

/**
 * Reference sheet for the CSV export/import format. A {@link Selector} toggles
 * between the Transactions and Tags layouts; each shows the required header, a
 * representative example table accented with the wallet colour, a per-field
 * legend, and a "Download sample" action. Purely informational.
 */
export const CsvFormatModal: React.FC<CsvFormatModalProps> = ({
  open,
  onClose,
  accentColor,
  defaultMode = "transactions",
}) => {
  // Seed the tab from the caller so a resource's ℹ️ reveals that resource's
  // format first; the user can still switch tabs from there.
  const [mode, setMode] = useState<Mode>(defaultMode);

  const spec = SAMPLES[mode];
  const headerLine = spec.columns.map((c) => c.key).join(",");

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title="CSV format"
      subtitle="How your import / export files must be structured"
      accentColor={accentColor}
      width={620}
      footer={
        <Button
          variant="secondary"
          fullWidth
          onClick={() => downloadSample(spec)}
        >
          <FontAwesomeIcon icon={faDownload} />
          Download {mode} sample
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Toggle: transactions vs subscriptions vs tags */}
        <Selector<Mode>
          value={mode}
          onChange={setMode}
          options={[
            {
              value: "transactions",
              label: "Transactions",
              icon: <FontAwesomeIcon icon={faReceipt} />,
              activeColorClass: "text-app-text",
            },
            {
              value: "subscriptions",
              label: "Subscriptions",
              icon: <FontAwesomeIcon icon={faRepeat} />,
              activeColorClass: "text-app-text",
            },
            {
              value: "tags",
              label: "Tags",
              icon: <FontAwesomeIcon icon={faTag} />,
              activeColorClass: "text-app-text",
            },
          ]}
        />

        {/* Format rules */}
        <div className="flex flex-col gap-2 rounded-[var(--r-input)] border border-app-border bg-app-surface p-4">
          <p className="text-xs leading-relaxed text-app-muted">
            UTF-8 CSV. The first line must be the header below, columns in this
            exact order. Fields are separated by a comma (
            <code className="rounded bg-app-input px-1 font-mono text-app-text">
              ,
            </code>
            ) — i.e. <span className="font-mono">field,field,…</span> — and each
            value is wrapped in double quotes on export. Wrap a value in{" "}
            <code className="rounded bg-app-input px-1 font-mono text-app-text">
              "…"
            </code>{" "}
            if it contains a comma or a line break.
          </p>
          <pre className="custom-scrollbar overflow-x-auto rounded-[var(--r-sm)] bg-app-input px-3 py-2 text-[11px] leading-relaxed text-app-text">
            <code className="font-mono">{headerLine}</code>
          </pre>
        </div>

        {/* Representative example table */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-app-muted">
            Example
          </p>
          <div className="custom-scrollbar overflow-x-auto rounded-[var(--r-input)] border border-app-border">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  {spec.columns.map((col) => (
                    <th
                      key={col.key}
                      className="whitespace-nowrap px-3 py-2 text-left font-bold text-app-text"
                      style={{
                        backgroundColor: `${accentColor}1a`,
                        borderBottom: `2px solid ${accentColor}`,
                      }}
                    >
                      {col.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {spec.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={ri % 2 ? "bg-app-surface" : "bg-app-card/40"}
                  >
                    {row.map((cell, ci) => {
                      const colKey = spec.columns[ci].key;
                      return (
                        <td
                          key={ci}
                          className="whitespace-nowrap px-3 py-2 font-mono text-app-text"
                        >
                          {renderCell(mode, colKey, cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mode === "tags" && (
            <p className="mt-2 text-[11px] leading-relaxed text-app-muted">
              <span className="font-mono">ParentName</span> is empty (
              <span className="font-mono">""</span>) for a top-level tag —{" "}
              <span className="font-semibold text-app-text">Groceries</span>{" "}
              above nests under{" "}
              <span className="font-semibold text-app-text">Food</span>.
            </p>
          )}
        </div>

        {/* Per-field legend */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-app-muted">
            Fields
          </p>
          <dl className="flex flex-col gap-1.5">
            {spec.columns.map((col) => (
              <div key={col.key} className="flex items-baseline gap-2 text-xs">
                <dt className="shrink-0 font-mono font-semibold text-app-text">
                  {col.key}
                </dt>
                <span
                  aria-hidden
                  className="h-px flex-1 self-center bg-app-border"
                />
                <dd className="shrink-0 text-right text-app-muted">
                  {col.hint}
                  {col.optional && (
                    <span className="ml-1 rounded bg-app-input px-1 text-[10px] uppercase tracking-wide">
                      optional
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ResponsiveOverlay>
  );
};

/** Rich rendering for the Tags table: a real icon for the key, a swatch for the hex. */
const renderCell = (
  mode: Mode,
  colKey: string,
  value: string,
): React.ReactNode => {
  if (value === "") {
    return <span className="text-app-muted">""</span>;
  }

  if (mode === "tags" && colKey === "Icon") {
    const def = ICONS[value as IconKey];
    return (
      <span className="inline-flex items-center gap-1.5">
        {def && (
          <FontAwesomeIcon icon={def} className="text-app-muted" aria-hidden />
        )}
        {value}
      </span>
    );
  }

  if (mode === "tags" && colKey === "ColorHex") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full border border-app-border"
          style={{ backgroundColor: value }}
        />
        {value}
      </span>
    );
  }

  return value;
};

export default CsvFormatModal;
