import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import type { DatePickerValue, PresetType } from "./datePresets";

export interface UseDatePickerOptions {
  isRange: boolean;
  onChange?: (value: DatePickerValue) => void;
  initialPreset: PresetType;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  onPresetChange?: (preset: PresetType) => void;
}

/**
 * State machine of CustomDatePicker: open state, preset -> range derivation,
 * mobile detection, outside-click dismissal, mobile `<dialog>` opening,
 * desktop popover viewport clamping and single-date auto-close.
 */
export function useDatePicker({
  isRange,
  onChange,
  initialPreset,
  initialStartDate,
  initialEndDate,
  onPresetChange,
}: UseDatePickerOptions) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [preset, setPreset] = useState<PresetType>(initialPreset);
  const [currentDate, setCurrentDate] = useState<Date>(
    initialStartDate || new Date(),
  );
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useOutsideClick(popoverRef, (event) => {
    if (modalRef.current && modalRef.current.contains(event.target as Node)) {
      return;
    }
    setIsOpen(false);
  });

  useEffect(() => {
    if (isMobile && isOpen && mobileDialogRef.current) {
      if (!mobileDialogRef.current.open) {
        mobileDialogRef.current.showModal(); // Puts it in the top layer
      }
    }
  }, [isMobile, isOpen]);

  // Shift the desktop popover horizontally so it stays inside the viewport and
  // any clipping (overflow) ancestor, e.g. a modal body.
  useLayoutEffect(() => {
    const el = modalRef.current;
    if (!isOpen || isMobile || !el) return;
    const PAD = 8;
    let minX = 0;
    let maxX = window.innerWidth;
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (getComputedStyle(p).overflowX === "visible") continue;
      const r = p.getBoundingClientRect();
      minX = Math.max(minX, r.left);
      maxX = Math.min(maxX, r.right);
    }
    const rect = el.getBoundingClientRect();
    let dx = Math.min(0, maxX - PAD - rect.right);
    if (rect.left + dx < minX + PAD) dx = minX + PAD - rect.left;
    el.style.marginLeft = `${dx}px`;
  }, [isOpen, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (onPresetChange) {
      onPresetChange(preset);
    }
  }, [preset, onPresetChange]);

  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current(
        isRange ? { start: startDate, end: endDate } : startDate,
      );
    }
  }, [startDate, endDate, isRange]);

  useEffect(() => {
    const today = new Date();
    const jumpToToday = () => {
      if (
        currentDate.getMonth() !== today.getMonth() ||
        currentDate.getFullYear() !== today.getFullYear()
      ) {
        setCurrentDate(today);
      }
    };

    switch (preset) {
      case "today":
        // Deriving the range from preset+currentDate with imperative jumps:
        // a legitimate sync in an effect.
        setStartDate(today);
        setEndDate(null);
        jumpToToday();
        break;
      case "last30":
        setStartDate(subDays(today, 30));
        setEndDate(today);
        jumpToToday();
        break;
      case "month":
        setStartDate(startOfMonth(currentDate));
        setEndDate(endOfMonth(currentDate));
        break;
      case "year":
        setStartDate(startOfYear(currentDate));
        setEndDate(endOfYear(currentDate));
        break;
      case "all":
        setStartDate(null);
        setEndDate(null);
        jumpToToday();
        break;
      case "custom":
        break;
    }
  }, [preset, currentDate]);

  // Auto-close on single-date selection
  useEffect(() => {
    if (!isRange && startDate && isOpen) {
      setIsOpen(false);
    }
    // `isOpen` deliberately excluded: react only to a NEW date selection
    // (startDate/isRange). Including isOpen would close the picker the moment
    // it opens with a date already selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, isRange]);

  return {
    isOpen,
    setIsOpen,
    preset,
    setPreset,
    currentDate,
    setCurrentDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isMobile,
    popoverRef,
    modalRef,
    mobileDialogRef,
  };
}
