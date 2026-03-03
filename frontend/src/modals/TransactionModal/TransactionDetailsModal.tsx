import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {ModalDialog} from '../ModalDialog';
import type {Tag, Transaction, Wallet} from "../../utils/types.ts";

import {TransactionView} from './TransactionView';
import {TransactionEdit} from './TransactionEdit';

export interface TransactionDetailsModalHandle {
    openModal: (transaction: Transaction) => void;
}

interface Props {
    wallet: Wallet;
    tags: Tag[];
    handleDeleteSuccess: (transactionId: string) => void;
    // handleUpdateSuccess: (transaction: Transaction) => void;
    handleUpdateSuccess: () => void;
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({wallet, tags, handleDeleteSuccess, handleUpdateSuccess}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        const [tx, setTx] = useState<Transaction | null>(null);
        const [isEditing, setIsEditing] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: (transaction: Transaction) => {
                setTx(transaction);
                setIsEditing(false);
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

        const handleUpdateAndClose = () => {
            handleClose();
            // handleUpdateSuccess(tx!);
            handleUpdateSuccess();
        };

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                {tx && (
                    !isEditing ? (
                        <TransactionView
                            tx={tx}
                            wallet={wallet}
                            onClose={handleClose}
                            onEdit={() => setIsEditing(true)}
                            onDeleteSuccess={handleDeleteAndClose}
                        />
                    ) : (
                        <TransactionEdit
                            tx={tx}
                            wallet={wallet}
                            tags={tags}
                            onCancel={() => setIsEditing(false)}
                            onUpdateSuccess={handleUpdateAndClose}
                        />
                    )
                )}
            </ModalDialog>
        );
    }
);