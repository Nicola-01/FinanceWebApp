import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "./ModalDialog";
import Button from "../../components/ui/Button";
import { useHoldToConfirm } from "../../hooks/useHoldToConfirm";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  /** `simple` = a normal confirm click; `hold` = press-and-hold for `holdMs`. */
  mode?: "simple" | "hold";
  /** Hold duration in ms (hold mode only). */
  holdMs?: number;
  /** Accent tone for the icon + confirm affordance. */
  tone?: "danger" | "warning";
  /** Disables the confirm affordance and shows a working state. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONES = {
  danger: { text: "text-app-red", fill: "bg-app-red", badge: "bg-app-red/15" },
  warning: {
    text: "text-app-yellow",
    fill: "bg-app-yellow",
    badge: "bg-app-yellow/15",
  },
} as const;

// ui-v2-switch: v2 status tokens (income/warn/danger), same tone keys.
const TONES_V2 = {
  danger: {
    text: "text-app-danger",
    fill: "bg-app-danger",
    badge: "bg-app-danger/15",
  },
  warning: {
    text: "text-app-warn",
    fill: "bg-app-warn",
    badge: "bg-app-warn/15",
  },
} as const;

/**
 * Reusable confirmation modal on the shared ModalDialog shell. Two modes:
 * `simple` (a single danger button) and `hold` (a press-and-hold button that
 * fills over `holdMs` before firing) — deliberate friction for destructive,
 * hard-to-undo actions like a database restore.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel,
  mode = "simple",
  holdMs = 2500,
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync the native <dialog> with the controlled `open` prop.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const { progress, startHold, endHold } = useHoldToConfirm(
    holdMs,
    onConfirm,
    !busy,
  );

  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const t = (isV2 ? TONES_V2 : TONES)[tone];

  return (
    <ModalDialog
      ref={dialogRef}
      showClose
      onCloseClick={onCancel}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="text-center text-app-text">
        <div className="mb-5 flex flex-col items-center gap-3">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full ${t.badge}`}
          >
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className={`text-2xl ${t.text}`}
            />
          </span>
          <h3
            className={`m-0 ${
              isV2
                ? "font-display text-xl font-semibold tracking-[-0.02em] text-app-text"
                : "text-xl font-bold text-app-text"
            }`}
          >
            {title}
          </h3>
        </div>

        <div className="mb-6 text-sm text-app-muted">{message}</div>

        {mode === "hold" ? (
          <button
            type="button"
            disabled={busy}
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            className={`relative w-full select-none overflow-hidden rounded-[var(--r-cta)] border border-app-border bg-app-input py-3 text-app-text disabled:opacity-60 ${
              isV2 ? "font-semibold" : "font-bold"
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 ${t.fill} opacity-25`}
              style={{ width: `${progress * 100}%` }}
            />
            <span className="relative z-10">
              {busy
                ? "Working…"
                : progress > 0
                  ? "Keep holding…"
                  : confirmLabel}
            </span>
          </button>
        ) : (
          <Button
            variant="danger"
            fullWidth
            ripple
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-3 text-sm font-semibold text-app-muted transition-colors hover:text-app-text"
        >
          Cancel
        </button>
      </div>
    </ModalDialog>
  );
};

export default ConfirmModal;
