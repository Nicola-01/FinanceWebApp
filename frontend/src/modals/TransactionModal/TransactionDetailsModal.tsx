import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {ModalDialog} from '../ModalDialog';
import type {Transaction, Wallet} from "../../utils/types.ts";

import {TransactionView} from './TransactionView';

export interface TransactionDetailsModalHandle {
    openModal: (transaction: Transaction) => void;
}

interface Props {
    wallet: Wallet;
    handleDeleteSuccess: (transactionId: string) => void;
    onEditRequest: (tx: Transaction) => void;
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({wallet, handleDeleteSuccess, onEditRequest}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

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

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                {tx && (
                    <TransactionView
                        tx={tx}
                        wallet={wallet}
                        onClose={handleClose}
                        onDeleteSuccess={handleDeleteAndClose}
                        onEditRequest={handleEditAndClose} // <-- PASSATA LA FUNZIONE
                    />
                )}
            </ModalDialog>
        );
    }
);