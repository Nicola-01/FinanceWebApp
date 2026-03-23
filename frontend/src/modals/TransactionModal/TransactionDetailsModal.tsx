import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ModalDialog } from '../ModalDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
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
        const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            setIsMenuOpen(false);
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

        const headerRight = tx ? (
            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isMenuOpen ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                    <FontAwesomeIcon icon={faEllipsisV} className="text-lg" />
                </button>

                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 z-50 flex w-40 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    handleEditAndClose(tx);
                                }}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white text-left"
                            >
                                <FontAwesomeIcon icon={faEdit} className="w-4" /> Edit
                            </button>
                            <div className="h-[1px] w-full bg-white/5" />
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 text-left"
                            >
                                <FontAwesomeIcon icon={faTrash} className="w-4" /> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        ) : null;

        return (
            <ModalDialog
                ref={dialogRef}
                className="max-w-[550px]"
                onCloseClick={handleClose}
                headerRight={headerRight}
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