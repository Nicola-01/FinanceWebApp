import { forwardRef, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
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
        0,
      );
    }
  };

  const canEdit = !!tx && wallet.userRole !== "VIEWER";
  const footer = canEdit ? (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        onClick={() => handleEditAndClose(tx!)}
        accentColor={wallet.color}
        ripple
        className="flex-1"
        aria-label="Edit"
      >
        <FontAwesomeIcon icon={faEdit} />
        Edit
      </Button>
      <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        ripple
        aria-label="Delete"
      >
        <FontAwesomeIcon icon={faTrash} />
        Delete
      </Button>
    </div>
  ) : undefined;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      title="Transaction"
      accentColor={wallet.color}
      footer={footer}
    >
      {tx && <TransactionView tx={tx} wallet={wallet} />}
    </ResponsiveOverlay>
  );
});
