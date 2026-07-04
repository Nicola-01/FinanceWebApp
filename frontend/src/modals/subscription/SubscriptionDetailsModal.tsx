import { forwardRef, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faStopCircle,
} from "@fortawesome/free-solid-svg-icons";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
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
  const footer = canEdit ? (
    <div className="flex flex-col gap-3">
      {selectedDate && (
        <Button
          type="button"
          variant="secondary"
          onClick={handleStopSubscriptionAtDate}
          ripple
          fullWidth
          style={{ color: "var(--color-app-yellow)" }}
          aria-label="Stop here"
        >
          <FontAwesomeIcon icon={faStopCircle} />
          Stop on {format(selectedDate, "d MMM yyyy")}
        </Button>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => handleEditAndClose(sub!)}
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
          onClick={() =>
            deleteModalRef.current?.deleteObject(
              sub!,
              "subscription",
              async () => handleConfirmDelete(sub!.id),
              1,
            )
          }
          ripple
          aria-label="Delete"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      title="Subscription"
      accentColor={wallet.color}
      footer={footer}
    >
      {sub && <SubscriptionView sub={sub} wallet={wallet} />}
    </ResponsiveOverlay>
  );
});
