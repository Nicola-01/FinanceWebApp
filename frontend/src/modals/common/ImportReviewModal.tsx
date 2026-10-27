import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faFileArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "./ModalDialog";
import {
  ImportReviewConfirmBody,
  ImportReviewRecapBody,
} from "./ImportReviewBodies";
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
        <ImportReviewConfirmBody newCount={newCount} overwrites={overwrites} />
      ) : (
        <ImportReviewRecapBody recap={recap} showsTags={showsTags} />
      )}
    </ModalDialog>
  );
};

export default ImportReviewModal;
