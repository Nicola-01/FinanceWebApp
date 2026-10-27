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

export const BackupRow: React.FC<Props> = ({
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
