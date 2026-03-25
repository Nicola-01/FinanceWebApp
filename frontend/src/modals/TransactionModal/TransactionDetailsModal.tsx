import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ModalDialog } from '../ModalDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useDeleteModal } from "../DeleteModalContext.tsx";
import type { Transaction, Wallet } from "../../utils/types.ts";

import { TransactionView } from './TransactionView';

export interface TransactionDetailsModalHandle {
    openModal: (transaction: Transaction) => void;
}

interface Props {
    wallet: Wallet;
    handleDeleteSuccess: (transactionId: string) => void;
    onEditRequest: (tx: Transaction) => void;
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({ wallet, handleDeleteSuccess, onEditRequest }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const deleteModalRef = useDeleteModal();

        const [tx, setTx] = useState<Transaction | null>(null);

        useImperativeHandle(ref, () => ({
            openModal: (transaction: Transaction) => {
                setTx(transaction);
                dialogRef.current?.showModal();
            }
        }));

        const handleClose = () => {
            if (dialogRef.current?.open) dialogRef.current.close();
        };

        const handleDeleteAndClose = () => {
            handleClose();
            handleDeleteSuccess(tx!.id);
        };

        const handleEditAndClose = (transaction: Transaction) => {
            handleClose(); // Chiudiamo questo modal di View
            onEditRequest(transaction); // Lanciamo l'evento verso il componente padre
        };

        const handleDelete = async () => {
            if (tx) {
                deleteModalRef.current?.deleteObject(
                    tx,
                    'transaction',
                    async () => handleDeleteAndClose(),
                    false,
                    0
                );
            }
        };

        const rightActions = tx ? [
            {
                icon: <FontAwesomeIcon icon={faEdit} className="w-4" />,
                label: 'Edit',
                onClick: () => handleEditAndClose(tx),
                color: 'text-white/80',
                hoverColor: 'hover:text-white',
                hoverBg: 'hover:bg-white/10'
            },
            {
                icon: <FontAwesomeIcon icon={faTrash} className="w-4" />,
                label: 'Delete',
                onClick: handleDelete,
                color: 'text-red-500',
                hoverColor: 'hover:text-red-400',
                hoverBg: 'hover:bg-red-500/10'
            }
        ] : undefined;

        return (
            <ModalDialog
                ref={dialogRef}
                className="max-w-[550px]"
                rightActions={rightActions}
            >
                {tx && (
                    <TransactionView
                        tx={tx}
                        wallet={wallet}
                    />
                )}
            </ModalDialog>
        );
    }
);