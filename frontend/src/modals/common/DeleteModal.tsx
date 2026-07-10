import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  Transaction,
  User,
  Wallet,
  Subscription,
  Tag,
  PatToken,
  Budget,
} from "../../utils/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "./ModalDialog";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

/**
 * Delete confirmation friction, escalating with blast radius:
 *  - 0: delete on a single click.
 *  - 1: press-and-hold the Delete button for `HOLD_MS`.
 *  - 2: type the exact name AND press-and-hold.
 */
export type DeleteLevel = 0 | 1 | 2;

export interface DeleteModalHandle {
  deleteObject: (
    object:
      User | Wallet | Transaction | Subscription | Tag | PatToken | Budget,
    typeName: string,
    handleConfirmClick: () => void | Promise<void>,
    level?: DeleteLevel,
  ) => void;
}

const HOLD_MS = 1750;

export const DeleteModal = forwardRef<DeleteModalHandle>((_props, ref) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Internal modal state
  const [objToDelete, setObjToDelete] = useState<
    User | Wallet | Transaction | Subscription | Tag | PatToken | Budget | null
  >(null);
  const [onConfirmCb, setOnConfirmCb] = useState<
    (() => void | Promise<void>) | null
  >(null);

  const [itemType, setItemType] = useState<string>("");
  const [level, setLevel] = useState<DeleteLevel>(1);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Press-and-hold progress (0 → 1) for levels 1 and 2.
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useImperativeHandle(ref, () => ({
    deleteObject: (object, typeName, handleConfirmClick, lvl = 1) => {
      setObjToDelete(object);
      setItemType(typeName);
      setOnConfirmCb(() => handleConfirmClick);

      setLevel(lvl);
      setConfirmationText("");
      setProgress(0);
      setIsDeleting(false);

      dialogRef.current?.showModal();
    },
  }));

  // Clean up any pending animation frame on unmount.
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const typingRequired = level === 2;
  const holdRequired = level >= 1;
  const nameOk = !typingRequired || confirmationText === objToDelete?.name;
  const canConfirm = !!objToDelete && !isDeleting && nameOk;

  const handleConfirm = async () => {
    if (!onConfirmCb) return;
    setIsDeleting(true);
    await onConfirmCb();
    if (dialogRef.current?.open) dialogRef.current?.close();
  };

  const cancelHold = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const startHold = () => {
    if (!canConfirm) return;
    startRef.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - startRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        cancelHold();
        setProgress(0);
        handleConfirm();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    cancelHold();
    setProgress(0);
  };

  const handleCancel = () => dialogRef.current?.close();

  const holdLabel = isDeleting
    ? "Deleting…"
    : progress > 0
      ? "Keep holding…"
      : "Hold to delete";

  return (
    <ModalDialog
      ref={dialogRef}
      title={
        <>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-app-red"
          />
          Delete {itemType}
        </>
      }
      subtitle="This action can't be undone."
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          {holdRequired ? (
            <button
              type="button"
              disabled={!canConfirm}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              className="relative flex-1 select-none overflow-hidden rounded-[var(--r-cta)] bg-app-red py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)] transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-black/30"
                style={{ width: `${progress * 100}%` }}
              />
              <span className="relative z-10">{holdLabel}</span>
            </button>
          ) : (
            <Button
              variant="danger"
              className="flex-1"
              ripple
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
      }
    >
      <div className="text-app-text">
        <p className="text-sm text-app-muted">
          You're about to permanently delete this {itemType}:
        </p>

        <div className="my-4 break-words rounded-[var(--r-input)] border border-dashed border-app-border bg-app-input px-4 py-3 text-center font-['JetBrains_Mono',_monospace] text-lg text-app-text">
          {objToDelete?.name}
        </div>

        {typingRequired && (
          <>
            <p className="mb-2 text-sm text-app-muted">
              To confirm, type the name above:
            </p>
            <Input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={objToDelete?.name}
              invalid={confirmationText.length > 0 && !nameOk}
              className="text-center"
              autoFocus
            />
          </>
        )}
      </div>
    </ModalDialog>
  );
});
