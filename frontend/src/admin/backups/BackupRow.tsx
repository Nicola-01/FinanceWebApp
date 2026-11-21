import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faDownload,
  faRotateLeft,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../../components/ui/Badge";
import { Checkbox } from "../../components/ui/Checkbox.tsx";
import {
  ageColorClass,
  formatLabel,
  formatSize,
  parseKeyDate,
  relativeAge,
} from "./backupFormat.ts";
import type { BackupEntry, ConfirmState } from "./types.ts";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../../components/ui/Button";

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

interface Props {
  entry: BackupEntry;
  isNewest: boolean;
  isSelected: boolean;
  downloading: boolean;
  onToggle: (key: string) => void;
  onDownload: (key: string) => void;
  onConfirm: (kind: ConfirmState["kind"], key: string) => void;
}

export const BackupRow: React.FC<Props> = (props) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: list row with ghost icon actions; delete is the danger action.
  if (ui === "v2") return <BackupRowV2 {...props} />;
  return <BackupRowV1 {...props} />;
};

const BackupRowV1: React.FC<Props> = ({
  entry: e,
  isNewest,
  isSelected,
  downloading,
  onToggle,
  onDownload,
  onConfirm,
}) => (
  <tr
    className={`transition-colors ${
      isSelected ? "bg-[var(--brand-1)]/5" : "hover:bg-app-hover/40"
    }`}
  >
    <td className="px-6 py-3.5">
      <Checkbox
        state={isSelected}
        onChange={() => onToggle(e.key)}
        size="sm"
        aria-label={`Select ${formatLabel(e.key)}`}
      />
    </td>
    <td className="px-6 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--brand-1)]/10 text-[var(--brand-1)]">
          <FontAwesomeIcon icon={faDatabase} className="text-xs" />
        </span>
        <span className="font-app-mono text-app-text">
          {formatLabel(e.key)}
        </span>
        {isNewest && (
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
          spinning={downloading}
          onClick={() => onDownload(e.key)}
        />
        <RowAction
          icon={faRotateLeft}
          title="Restore"
          hover="hover:bg-app-yellow/10 hover:text-app-yellow"
          onClick={() => onConfirm("restore", e.key)}
        />
        <RowAction
          icon={faTrash}
          title="Delete"
          hover="hover:bg-app-red/10 hover:text-app-red"
          onClick={() => onConfirm("delete", e.key)}
        />
      </div>
    </td>
  </tr>
);

const BackupRowV2: React.FC<Props> = ({
  entry: e,
  isNewest,
  isSelected,
  downloading,
  onToggle,
  onDownload,
  onConfirm,
}) => (
  <div
    className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors ${
      isSelected ? "bg-app-raised/60" : ""
    }`}
  >
    <Checkbox
      state={isSelected}
      onChange={() => onToggle(e.key)}
      size="sm"
      aria-label={`Select ${formatLabel(e.key)}`}
    />
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-app-raised text-app-muted">
      <FontAwesomeIcon icon={faDatabase} />
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[15px] text-app-text">
          {formatLabel(e.key)}
        </span>
        {isNewest && (
          <Badge variant="subtle" tone="green">
            Latest
          </Badge>
        )}
      </div>
      <div className="text-[13px] tabular-nums text-app-muted">
        {e.sizeBytes > 0 ? formatSize(e.sizeBytes) : "—"} ·{" "}
        {relativeAge(e.lastModified, parseKeyDate(e.key))}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        title="Download"
        aria-label="Download"
        disabled={downloading}
        onClick={() => onDownload(e.key)}
      >
        <FontAwesomeIcon
          icon={downloading ? faSpinner : faDownload}
          spin={downloading}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Restore"
        aria-label="Restore"
        onClick={() => onConfirm("restore", e.key)}
      >
        <FontAwesomeIcon icon={faRotateLeft} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hover:text-app-danger"
        title="Delete"
        aria-label="Delete"
        onClick={() => onConfirm("delete", e.key)}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    </div>
  </div>
);
