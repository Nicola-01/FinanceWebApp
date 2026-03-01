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
    onSuccess: () => void;
    tags: Tag[]
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({wallet, onSuccess, tags}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        const [tx, setTx] = useState<Transaction | null>(null);
        const [isEditing, setIsEditing] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: (transaction: Transaction) => {
                setTx(transaction);
                // setIsEditing(false);
                dialogRef.current?.showModal();
            }
        }));

        const handleClose = () => {
            if (dialogRef.current?.open) dialogRef.current.close();
        };

        const handleSuccessAndClose = () => {
            onSuccess();
            handleClose();
        };

        if (!tx) return null;

        console.log(tx)

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                {!isEditing ? (
                    <TransactionView
                        tx={tx}
                        wallet={wallet}
                        onClose={handleClose}
                        onDeleteSuccess={handleSuccessAndClose}

                        // onEdit={() => setIsEditing(true)}
                        onEdit={function (): void {
                            throw new Error("Function not implemented.");
                        }}/>
                ) : (
                    <TransactionEdit
                        tx={tx}
                        wallet={wallet}
                        tags={tags}
                        onCancel={() => setIsEditing(false)}
                        onUpdateSuccess={handleSuccessAndClose}
                    />
                )}
            </ModalDialog>
        );
    }
);