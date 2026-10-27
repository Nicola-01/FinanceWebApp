import React, { useCallback, useEffect, useRef, useState } from "react";
import { addDays, subDays } from "date-fns";
import type { Subscription } from "../../types/domain";

/**
 * Day-by-day navigation for the calendar day panel: prev/next, ←/→ keys while
 * the dialog is open, and horizontal swipe on mobile. Each move re-resolves
 * that day's subscriptions via `getSubscriptionsForDate`.
 */
export function useDayNavigation(
  getSubscriptionsForDate: (date: Date) => Subscription[],
  dialogRef: React.RefObject<HTMLDialogElement | null>,
) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  /** Jump to a date with an already-resolved subscription list (on open). */
  const showDay = (date: Date, subs: Subscription[]) => {
    setSelectedDate(date);
    setSubscriptions(subs);
  };

  // Navigate to a new date and resolve its subscriptions
  const navigateToDate = useCallback(
    (newDate: Date) => {
      setSelectedDate(newDate);
      setSubscriptions(getSubscriptionsForDate(newDate));
    },
    [getSubscriptionsForDate],
  );

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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevDay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextDay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevDay, goToNextDay, dialogRef]);

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

  return {
    selectedDate,
    subscriptions,
    showDay,
    goToPrevDay,
    goToNextDay,
    handleTouchStart,
    handleTouchEnd,
  };
}
