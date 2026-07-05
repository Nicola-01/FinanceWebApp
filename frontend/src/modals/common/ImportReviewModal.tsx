import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faFileArrowUp,
  faPenToSquare,
  faPlus,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "./ModalDialog";
import Button from "../../components/ui/Button";
import type { DedupOverwrite } from "../../dashboard/settings/csvDedup";

/** Which resource an import targets — drives the copy in both phases. */
export type ImportResource = "transactions" | "tags" | "subscriptions";

/** Two phases in one component: confirm the overwrites, then recap the result. */
export type ImportReviewPhase = "confirm" | "recap";

/** Accurate post-import counts read from the backend bulk response. */
export interface ImportRecap {
  created: number;
  updated: number;
  /** Names of tags the backend auto-created (transactions/subscriptions only). */
  autoCreatedTags: string[];
}

export interface ImportReviewModalProps {
  open: boolean;
  phase: ImportReviewPhase;
  resource: ImportResource;
  /** Confirm phase: incoming rows with no existing match (will be created). */
  newCount: number;
  /** Confirm phase: incoming rows that collide with an existing record. */
  overwrites: DedupOverwrite[];
  /** Recap phase: counts from the backend response. */
  recap?: ImportRecap;
  /** Confirm submit in-flight — disables the confirm button. */
  submitting?: boolean;
  /** Wallet accent used for the confirm CTA. */
  accentColor?: string;
  /** Fires when the user confirms the overwrite in the confirm phase. */
  onConfirm: () => void;
  /** Cancel (confirm phase) or Done (recap phase) — resets and closes. */
  onClose: () => void;
}

const RESOURCE_LABEL: Record<ImportResource, string> = {
  transactions: "transactions",
  tags: "tags",
  subscriptions: "subscriptions",
};

const plural = (n: number, word: string): string =>
  `${n} ${word}${n === 1 ? "" : "s"}`;

/** A labelled count chip used in both phases' summary rows. */
const StatChip: React.FC<{
  icon: typeof faPlus;
  label: string;
  value: number;
  tone: "neutral" | "accent" | "green";
}> = ({ icon, label, value, tone }) => {
  const toneClass =
    tone === "green"
      ? "text-app-green"
      : tone === "accent"
        ? "text-app-yellow"
        : "text-app-muted";
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-3 text-center">
      <FontAwesomeIcon icon={icon} className={toneClass} />
      <span className="text-lg font-bold text-app-text">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
        {label}
      </span>
    </div>
  );
};

/**
 * Import review dialog with two phases sharing one shell:
 *  - `confirm` (only shown when overwrites were detected): summarizes how many
 *    rows are new vs will be overwritten and lists the colliding items so the
 *    user sees exactly what changes before committing.
 *  - `recap` (always shown after the import completes): mirrors the backend
 *    response — created, updated (overwritten), and any auto-created tags.
 *
 * Controlled via the `open`/`phase` props (parent owns the flow state).
 */
export const ImportReviewModal: React.FC<ImportReviewModalProps> = ({
  open,
  phase,
  resource,
  newCount,
  overwrites,
  recap,
  submitting = false,
  accentColor,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const label = RESOURCE_LABEL[resource];
  const showsTags = resource !== "tags";

  // Sync the native <dialog> with the controlled `open` prop.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const isConfirm = phase === "confirm";

  return (
    <ModalDialog
      ref={dialogRef}
      showClose
      onCloseClick={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      title={
        isConfirm ? (
          <>
            <FontAwesomeIcon icon={faFileArrowUp} className="text-app-yellow" />
            Review import
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faCircleCheck} className="text-app-green" />
            Import complete
          </>
        )
      }
      subtitle={
        isConfirm
          ? `Some rows match existing ${label} and will be overwritten.`
          : `Your ${label} were imported.`
      }
      footer={
        isConfirm ? (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              ripple
              accentColor={accentColor}
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? "Importing…" : "Overwrite & import"}
            </Button>
          </div>
        ) : (
          <Button variant="primary" fullWidth ripple onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      {isConfirm ? (
        <div className="text-app-text">
          <div className="mb-4 flex gap-3">
            <StatChip icon={faPlus} label="New" value={newCount} tone="green" />
            <StatChip
              icon={faPenToSquare}
              label="Overwritten"
              value={overwrites.length}
              tone="accent"
            />
          </div>

          <p className="mb-2 text-sm text-app-muted">
            These {plural(overwrites.length, "existing record")} will be
            replaced:
          </p>
          <ul className="custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto rounded-[var(--r-input)] border border-app-border bg-app-input">
            {overwrites.map((o, i) => (
              <li
                key={`${o.label}-${o.detail ?? ""}-${i}`}
                className="flex items-baseline justify-between gap-3 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium text-app-text">
                  {o.label || <span className="text-app-muted">(unnamed)</span>}
                </span>
                {o.detail && (
                  <span className="shrink-0 font-mono text-[11px] text-app-muted">
                    {o.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-app-text">
          <div className="flex gap-3">
            <StatChip
              icon={faPlus}
              label="Created"
              value={recap?.created ?? 0}
              tone="green"
            />
            <StatChip
              icon={faPenToSquare}
              label="Overwritten"
              value={recap?.updated ?? 0}
              tone="accent"
            />
          </div>

          {showsTags && (recap?.autoCreatedTags.length ?? 0) > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-app-muted">
                <FontAwesomeIcon
                  icon={faTag}
                  className="mr-1.5 text-app-blue"
                />
                {plural(recap?.autoCreatedTags.length ?? 0, "tag")}{" "}
                auto-created:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recap?.autoCreatedTags.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="rounded-[var(--r-sm)] border border-app-border bg-app-input px-2 py-1 text-xs font-medium text-app-text"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalDialog>
  );
};

export default ImportReviewModal;
