import { forwardRef, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { useDeleteModal } from "../common/DeleteModalContext";
import type { Transaction, Wallet } from "../../utils/types.ts";

import { TransactionView } from "./TransactionView";

export interface TransactionDetailsModalHandle {
  openModal: (transaction: Transaction) => void;
}

interface Props {
  wallet: Wallet;
  handleDeleteSuccess: (transactionId: string) => void;
  onEditRequest: (tx: Transaction) => void;
}

export const TransactionDetailsModal = forwardRef<
  TransactionDetailsModalHandle,
  Props
>(({ wallet, handleDeleteSuccess, onEditRequest }, ref) => {
  const deleteModalRef = useDeleteModal();

  const [open, setOpen] = useState(false);
  const [tx, setTx] = useState<Transaction | null>(null);

  useImperativeHandle(ref, () => ({
    openModal: (transaction: Transaction) => {
      setTx(transaction);
      setOpen(true);
    },
  }));

  const handleClose = () => setOpen(false);

  const handleDeleteAndClose = () => {
    handleClose();
    handleDeleteSuccess(tx!.id);
  };

  const handleEditAndClose = (transaction: Transaction) => {
    handleClose(); // close this view surface
    onEditRequest(transaction); // let the parent open the edit form
  };

  const handleDelete = () => {
    if (tx) {
      deleteModalRef.current?.deleteObject(
        tx,
        "transaction",
        async () => handleDeleteAndClose(),
        false,
        0,
      );
    }
  };

  const canEdit = !!tx && wallet.userRole !== "VIEWER";
  const headerActions = canEdit ? (
    <>
      <button
        type="button"
        aria-label="Edit"
        onClick={() => handleEditAndClose(tx!)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
      <button
        type="button"
        aria-label="Delete"
        onClick={handleDelete}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </>
  ) : undefined;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      title="Transaction"
      accentColor={wallet.color}
      headerActions={headerActions}
    >
      {tx && <TransactionView tx={tx} wallet={wallet} />}
    </ResponsiveOverlay>
  );
});
