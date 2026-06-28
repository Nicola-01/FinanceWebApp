import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ModalDialog } from '../common/ModalDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faStopCircle } from '@fortawesome/free-solid-svg-icons';
import { useDeleteModal } from "../common/DeleteModalContext";
import type { Subscription, Wallet } from "../../utils/types";

import { SubscriptionView } from './SubscriptionView';
import { triggerToast } from '../../components/ui/ToastNotification.tsx';
import api from '../../api/axiosConfig';
import { format } from 'date-fns';

export interface SubscriptionDetailsModalHandle {
    openModal: (subscription: Subscription, date?: Date) => void;
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
        const [selectedDate, setSelectedDate] = useState<Date | null>(null);

        useImperativeHandle(ref, () => ({
            openModal: (subscription: Subscription, date) => {
                setSub(subscription);
                setSelectedDate(date || null);
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

        const handleStopSubscriptionAtDate = async () => {
            if (!sub || !selectedDate) return;
            try {
                const formattedDate = format(selectedDate, 'yyyy-MM-dd');

                const updateRequest = {
                    name: sub.name,
                    tag: sub.tag?.name,
                    amount: sub.amount,
                    originalAmount: sub.originalAmount,
                    originalCurrency: sub.originalCurrency,
                    exchangeValue: sub.exchangeValue,
                    autoExchangeRate: sub.autoExchangeRate,
                    type: sub.type,
                    notes: sub.notes,
                    status: sub.status,
                    startDate: sub.startDate,
                    frequencyType: sub.frequencyType,
                    frequencyInterval: sub.frequencyInterval,
                    monthlySpecificDay: sub.monthlySpecificDay,
                    lastWorkingDayOfMonth: sub.lastWorkingDayOfMonth,
                    duration: 'UNTIL',
                    durationUntil: formattedDate
                };

                await api.put(`/subscription/${wallet.id}/${sub.id}`, updateRequest);
                triggerToast(`Subscription stopped at ${formattedDate}`, true);
                onDeleteSuccess();
                handleClose();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error stopping subscription.", false);
            }
        };

        const rightActions = () => {
            let actions: any[] = [];
            if (sub && wallet.userRole !== 'VIEWER') {
                actions = [
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
                ];

                if (selectedDate) {
                    actions.push({
                        icon: <FontAwesomeIcon icon={faStopCircle} className="w-4" />,
                        label: 'Stop Here',
                        onClick: handleStopSubscriptionAtDate,
                        color: 'text-white/80',
                        hoverColor: 'hover:text-[#ff0055]',
                        hoverBg: 'hover:bg-[#ff0055]/10'
                    });
                }
            }
            return actions;
        };


        return (
            <ModalDialog
                ref={dialogRef}
                className="max-w-[550px]"
                rightActions={rightActions()}
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
