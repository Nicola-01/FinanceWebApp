import { forwardRef, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faStopCircle,
} from "@fortawesome/free-solid-svg-icons";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { useDeleteModal } from "../common/DeleteModalContext";
import type { Subscription, Wallet } from "../../utils/types";

import { SubscriptionView } from "./SubscriptionView";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import api from "../../api/axiosConfig";
import { format } from "date-fns";
import { getApiErrorTitle } from "../../utils/apiError";

export interface SubscriptionDetailsModalHandle {
  openModal: (subscription: Subscription, date?: Date) => void;
}

interface Props {
  wallet: Wallet;
  onEditRequest: (sub: Subscription) => void;
  onDeleteSuccess: () => void;
}

export const SubscriptionDetailsModal = forwardRef<
  SubscriptionDetailsModalHandle,
  Props
>(({ wallet, onEditRequest, onDeleteSuccess }, ref) => {
  const deleteModalRef = useDeleteModal();

  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useImperativeHandle(ref, () => ({
    openModal: (subscription: Subscription, date) => {
      setSub(subscription);
      setSelectedDate(date || null);
      setOpen(true);
    },
  }));

  const handleClose = () => setOpen(false);

  const handleConfirmDelete = async (idToDelete: string) => {
    try {
      await api.delete(`/subscription/${wallet.id}/${idToDelete}`);
      triggerToast("Subscription deleted successfully", true);
      onDeleteSuccess();
      handleClose();
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting."), false);
    }
  };

  const handleEditAndClose = (subscription: Subscription) => {
    handleClose();
    onEditRequest(subscription);
  };

  const handleStopSubscriptionAtDate = async () => {
    if (!sub || !selectedDate) return;
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

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
        duration: "UNTIL",
        durationUntil: formattedDate,
      };

      await api.put(`/subscription/${wallet.id}/${sub.id}`, updateRequest);
      triggerToast(`Subscription stopped at ${formattedDate}`, true);
      onDeleteSuccess();
      handleClose();
    } catch (err: unknown) {
      triggerToast(
        getApiErrorTitle(err, "Error stopping subscription."),
        false,
      );
    }
  };

  const canEdit = !!sub && wallet.userRole !== "VIEWER";
  const headerActions = canEdit ? (
    <>
      <button
        type="button"
        aria-label="Edit"
        onClick={() => handleEditAndClose(sub!)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
      <button
        type="button"
        aria-label="Delete"
        onClick={() =>
          deleteModalRef.current?.deleteObject(sub!, "subscription", async () =>
            handleConfirmDelete(sub!.id),
          )
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
      {selectedDate && (
        <button
          type="button"
          aria-label="Stop here"
          onClick={handleStopSubscriptionAtDate}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-yellow/10 hover:text-app-yellow"
        >
          <FontAwesomeIcon icon={faStopCircle} />
        </button>
      )}
    </>
  ) : undefined;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      title="Subscription"
      accentColor={wallet.color}
      headerActions={headerActions}
    >
      {sub && <SubscriptionView sub={sub} wallet={wallet} />}
    </ResponsiveOverlay>
  );
});
