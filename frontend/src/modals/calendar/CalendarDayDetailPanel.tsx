import { forwardRef, useImperativeHandle, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import type { Subscription, Transaction } from "../../types/domain";
import { ModalDialog } from "../common/ModalDialog";
import Button from "../../components/ui/Button";
import { useDayNavigation } from "./useDayNavigation";
import { CalendarDayNavHeader } from "./CalendarDayNavHeader";
import { CalendarDaySubscriptionList } from "./CalendarDaySubscriptionList";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface DayDetailModalHandle {
  openModal: (date: Date, subscriptions: Subscription[]) => void;
}

interface CalendarDayDetailPanelProps {
  /** Called to resolve subscriptions for a given date (when navigating days inside the modal) */
  getSubscriptionsForDate: (date: Date) => Subscription[];
  onEditSubscription?: (subscription: Subscription, date: Date) => void;
  onAddSubscription?: (date: Date) => void;
  onTransactionClick?: (tx: Transaction) => void;
}

export const CalendarDayDetailPanel = forwardRef<
  DayDetailModalHandle,
  CalendarDayDetailPanelProps
>(
  (
    {
      getSubscriptionsForDate,
      onEditSubscription,
      onAddSubscription,
      onTransactionClick,
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [ui] = useUiVersion();
    const isV2 = ui === "v2"; // ui-v2-switch
    const nav = useDayNavigation(getSubscriptionsForDate, dialogRef);

    useImperativeHandle(ref, () => ({
      openModal: (date: Date, subs: Subscription[]) => {
        nav.showDay(date, subs);
        dialogRef.current?.showModal();
      },
    }));

    const handleClose = () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };

    return (
      <ModalDialog
        ref={dialogRef}
        className="max-w-[550px] overflow-hidden"
        title={
          isV2 ? ( // ui-v2-switch
            "Day details"
          ) : (
            <>
              <FontAwesomeIcon
                icon={faCalendarDay}
                color="var(--color-app-sky)"
              />{" "}
              Day Details
            </>
          )
        }
        footer={
          onAddSubscription ? (
            <Button
              variant="primary"
              fullWidth
              ripple
              onClick={() => {
                handleClose();
                onAddSubscription(nav.selectedDate);
              }}
            >
              <FontAwesomeIcon icon={faPlus} /> Add subscription
            </Button>
          ) : undefined
        }
      >
        <div
          onTouchStart={nav.handleTouchStart}
          onTouchEnd={nav.handleTouchEnd}
          className={isV2 ? "flex flex-col gap-4" : "flex flex-col"} // ui-v2-switch
        >
          <CalendarDayNavHeader
            selectedDate={nav.selectedDate}
            onPrev={nav.goToPrevDay}
            onNext={nav.goToNextDay}
          />
          <CalendarDaySubscriptionList
            subscriptions={nav.subscriptions}
            selectedDate={nav.selectedDate}
            onClose={handleClose}
            onEditSubscription={onEditSubscription}
            onTransactionClick={onTransactionClick}
          />
        </div>
      </ModalDialog>
    );
  },
);
