import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faDatabase,
  faExclamationTriangle,
  faHardDrive,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Checkbox, type CheckboxState } from "../../components/ui/Checkbox.tsx";
import { BackupRow } from "./BackupRow.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import type { BackupEntry, ConfirmState } from "./types.ts";

interface Props {
  entries: BackupEntry[];
  listLoading: boolean;
  selected: Set<string>;
  selectedCount: number;
  downloadingKey: string | null;
  onToggleOne: (key: string) => void;
  onToggleAll: (keys: string[]) => void;
  onDownload: (key: string) => void;
  onConfirm: (kind: ConfirmState["kind"], key: string) => void;
}

/** Snapshot table — fills remaining height on xl, scrolls internally. */
export const BackupsTable: React.FC<Props> = ({
  entries,
  listLoading,
  selected,
  selectedCount,
  downloadingKey,
  onToggleOne,
  onToggleAll,
  onDownload,
  onConfirm,
}) => {
  const newest = entries[0];
  const [ui] = useUiVersion();
  const headerState: CheckboxState =
    selectedCount === 0
      ? "unchecked"
      : selectedCount === entries.length
        ? "checked"
        : "indeterminate";

  // ui-v2-switch: divide-y list card (rows are BackupRow's v2 layout).
  if (ui === "v2") {
    const empty = listLoading || entries.length === 0;
    return (
      <div className="overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)] xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
        {!empty && (
          <div className="flex items-center gap-3 border-b border-app-border px-4 py-2.5 text-[13px] text-app-muted">
            <Checkbox
              state={headerState}
              onChange={() => onToggleAll(entries.map((e) => e.key))}
              size="sm"
              aria-label="Select all backups"
            />
            <span>All snapshots</span>
          </div>
        )}
        <div className="max-h-[65vh] divide-y divide-app-border overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
          {listLoading ? (
            <p className="m-0 px-4 py-10 text-center text-[15px] text-app-muted">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Loading backups…
            </p>
          ) : entries.length === 0 ? (
            <p className="m-0 px-4 py-10 text-center text-[15px] text-app-muted">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="mr-2 text-app-warn"
              />
              No backups in the bucket. Run one from the toolbar.
            </p>
          ) : (
            entries.map((e) => (
              <BackupRow
                key={e.key}
                entry={e}
                isNewest={e.key === newest?.key}
                isSelected={selected.has(e.key)}
                downloading={downloadingKey === e.key}
                onToggle={onToggleOne}
                onDownload={onDownload}
                onConfirm={onConfirm}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--r-card)] border border-app-border bg-app-card/50 backdrop-blur-sm xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
      <div className="max-h-[65vh] overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-app-surface text-xs uppercase tracking-wider text-app-muted">
            <tr>
              <th className="w-px px-6 py-4">
                {entries.length > 0 && (
                  <Checkbox
                    state={headerState}
                    onChange={() => onToggleAll(entries.map((e) => e.key))}
                    size="sm"
                    aria-label="Select all backups"
                  />
                )}
              </th>
              <th className="px-6 py-4 font-semibold">
                <FontAwesomeIcon
                  icon={faDatabase}
                  className="mr-2 text-[var(--brand-1)]"
                />
                Snapshot
              </th>
              <th className="px-6 py-4 font-semibold">
                <FontAwesomeIcon
                  icon={faHardDrive}
                  className="mr-2 text-app-sky"
                />
                Size
              </th>
              <th className="px-6 py-4 font-semibold">
                <FontAwesomeIcon
                  icon={faClock}
                  className="mr-2 text-app-yellow"
                />
                Age
              </th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {listLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-app-muted"
                >
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Loading backups…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-app-muted"
                >
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="mr-2 text-app-yellow"
                  />
                  No backups in the bucket. Run one from the toolbar.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <BackupRow
                  key={e.key}
                  entry={e}
                  isNewest={e.key === newest?.key}
                  isSelected={selected.has(e.key)}
                  downloading={downloadingKey === e.key}
                  onToggle={onToggleOne}
                  onDownload={onDownload}
                  onConfirm={onConfirm}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
