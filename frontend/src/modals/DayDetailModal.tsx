import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus, faRepeat, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import type { Subscription } from '../utils/types.ts';
import { SubscriptionCard } from '../dashboard/subscription/SubscriptionCard.tsx';
import { ModalDialog } from './ModalDialog.tsx';

export interface DayDetailModalHandle {
    openModal: (date: Date, subscriptions: Subscription[]) => void;
}

interface DayDetailPanelProps {
    /** Called to resolve subscriptions for a given date (when navigating days inside the modal) */
    getSubscriptionsForDate: (date: Date) => Subscription[];
    onEditSubscription?: (subscription: Subscription, date: Date) => void;
    onAddSubscription?: (date: Date) => void;
}

export const DayDetailPanel = forwardRef<DayDetailModalHandle, DayDetailPanelProps>(
    ({ getSubscriptionsForDate, onEditSubscription, onAddSubscription }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const touchStartX = useRef<number | null>(null);
        const touchStartY = useRef<number | null>(null);

        const [selectedDate, setSelectedDate] = useState<Date>(new Date());
        const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

        useImperativeHandle(ref, () => ({
            openModal: (date: Date, subs: Subscription[]) => {
                setSelectedDate(date);
                setSubscriptions(subs);
                dialogRef.current?.showModal();
            }
        }));

        const handleClose = () => {
            if (dialogRef.current?.open) dialogRef.current.close();
        };

        // Navigate to a new date and resolve its subscriptions
        const navigateToDate = useCallback((newDate: Date) => {
            setSelectedDate(newDate);
            setSubscriptions(getSubscriptionsForDate(newDate));
        }, [getSubscriptionsForDate]);

        const goToPrevDay = useCallback(() => {
            navigateToDate(subDays(selectedDate, 1));
        }, [selectedDate, navigateToDate]);

        const goToNextDay = useCallback(() => {
            navigateToDate(addDays(selectedDate, 1));
        }, [selectedDate, navigateToDate]);

        // Keyboard navigation (arrows + escape handled by dialog natively)
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (!dialogRef.current?.open) return;
                if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevDay(); }
                else if (e.key === 'ArrowRight') { e.preventDefault(); goToNextDay(); }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [goToPrevDay, goToNextDay]);

        // Mobile swipe
        const handleTouchStart = (e: React.TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: React.TouchEvent) => {
            if (touchStartX.current === null || touchStartY.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = e.changedTouches[0].clientY - touchStartY.current;

            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx > 0) goToPrevDay();
                else goToNextDay();
            }
            touchStartX.current = null;
            touchStartY.current = null;
        };

        const isToday = isSameDay(selectedDate, new Date());

        const dayLabel = (() => {
            if (isToday) return 'Today';
            if (isSameDay(selectedDate, subDays(new Date(), 1))) return 'Yesterday';
            if (isSameDay(selectedDate, addDays(new Date(), 1))) return 'Tomorrow';
            return format(selectedDate, 'EEEE');
        })();

        const rightActions = [
            {
                icon: <FontAwesomeIcon icon={faPlus} className="text-lg" />,
                onClick: () => {
                    handleClose();
                    onAddSubscription?.(selectedDate);
                },
                color: undefined,
                hoverColor: 'hover:text-[#00ff7f]',
                hoverBg: 'hover:bg-[#00ff7f]/10'
            }
        ];

        return (
            <ModalDialog
                ref={dialogRef}
                className="max-w-[550px] overflow-hidden"
                title={<><FontAwesomeIcon icon={faCalendarDay} color="#00bfff" /> Day Details</>}
                rightActions={rightActions}
            >
                <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className="flex flex-col"
                >
                    {/* Day navigation header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-app-border bg-app-input/20">
                        <button
                            onClick={goToPrevDay}
                            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-app-muted hover:text-white hover:bg-app-surface transition-all active:scale-90"
                            aria-label="Previous day"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                        </button>

                        <div className="flex flex-col items-center gap-0.5 select-none min-w-0">
                            <span className={`text-sm sm:text-base font-bold ${isToday ? 'text-[#00bfff]' : 'text-app-text'}`}>
                                {dayLabel}
                            </span>
                            <span className="text-[10px] sm:text-xs text-app-muted font-medium">
                                {format(selectedDate, 'd MMM yyyy')}
                            </span>
                        </div>

                        <button
                            onClick={goToNextDay}
                            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-app-muted hover:text-white hover:bg-app-surface transition-all active:scale-90"
                            aria-label="Next day"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                        </button>
                    </div>

                    {/* Subscription list */}
                    <div className="flex flex-col gap-2 p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[50vh]">
                        {subscriptions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 mb-4 text-app-muted">
                                    <FontAwesomeIcon icon={faRepeat} className="text-xl" />
                                </div>
                                <p className="text-sm text-app-muted">No subscriptions on this day</p>
                            </div>
                        ) : (
                            subscriptions.map(sub => (
                                <SubscriptionCard
                                    key={sub.id}
                                    subscription={sub}
                                    date={format(selectedDate, 'yyyy-MM-dd')}
                                    onClick={() => {
                                        handleClose();
                                        onEditSubscription?.(sub, selectedDate);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </ModalDialog>
        );
    }
);
