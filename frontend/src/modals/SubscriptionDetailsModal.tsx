import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ModalDialog } from './ModalDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useDeleteModal } from "./DeleteModalContext.tsx";
import type { Subscription, Wallet } from "../utils/types.ts";

import { SubscriptionView } from './SubscriptionView.tsx';
import { triggerToast } from '../components/ToastNotification.tsx';
import api from '../api/axiosConfig.ts';

export interface SubscriptionDetailsModalHandle {
    openModal: (subscription: Subscription) => void;
}

interface Props {
    wallet: Wallet;
    onEditRequest: (sub: Subscription) => void;
    onDeleteSuccess: () => void;
}

export const SubscriptionDetailsModal = forwardRef<SubscriptionDetailsModalHandle, Props>(
    ({ wallet, onEditRequest, onDeleteSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const deleteModalRef = useDeleteModal();

        const [sub, setSub] = useState<Subscription | null>(null);

        useImperativeHandle(ref, () => ({
            openModal: (subscription: Subscription) => {
                setSub(subscription);
                dialogRef.current?.showModal();
            }
        }));

        const handleClose = () => {
            if (dialogRef.current?.open) dialogRef.current.close();
        };

        const handleConfirmDelete = async (idToDelete: string) => {
            try {
                await api.delete(`/subscription/${wallet.id}/${idToDelete}`);
                triggerToast("Subscription deleted successfully", true);
                onDeleteSuccess();
                handleClose();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error deleting.", false);
            }
        };

        const handleEditAndClose = (subscription: Subscription) => {
            handleClose();
            onEditRequest(subscription);
        };

        const rightActions = sub && wallet.myRole !== 'VIEWER' ? [
            {
                icon: <FontAwesomeIcon icon={faEdit} className="w-4" />,
                label: 'Edit',
                onClick: () => handleEditAndClose(sub),
                color: 'text-white/80',
                hoverColor: 'hover:text-white',
                hoverBg: 'hover:bg-app-surface'
            },
            {
                icon: <FontAwesomeIcon icon={faTrash} className="w-4" />,
                label: 'Delete',
                onClick: () => {
                    deleteModalRef.current?.deleteObject(
                        sub, 'subscription',
                        async () => await handleConfirmDelete(sub.id)
                    );
                },
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
                {sub && (
                    <SubscriptionView
                        sub={sub}
                        wallet={wallet}
                    />
                )}
            </ModalDialog>
        );
    }
);
