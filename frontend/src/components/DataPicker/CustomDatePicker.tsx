import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../utils/ThemeContext";
import { createPortal } from "react-dom";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  addMonths,
  subYears,
  addYears,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarContainer from "./CalendarContainer";

export type DateRangeValue = { start: Date | null; end: Date | null };
export type DatePickerValue = DateRangeValue | Date | null;
export type PresetType =
  "last30" | "month" | "year" | "all" | "custom" | "today";

export interface CustomDatePickerProps {
  isRange?: boolean;
  color?: string;
  isDark?: boolean;
  onChange?: (value: DatePickerValue) => void;
  initialPreset?: PresetType;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  onPresetChange?: (preset: PresetType) => void;
  hideSidebar?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disableDaySelection?: boolean;
  triggerClassName?: string;
  dropdownAlign?: "left" | "center" | "right";
  dropdownPosition?: "top" | "bottom";
}

export default function CustomDatePicker({
  isRange = true,
  color = "var(--color-app-green)",
  isDark: isDarkProp,
  onChange,
  initialPreset = "month",
  initialStartDate = null,
  initialEndDate = null,
  onPresetChange,
  hideSidebar = false,
  weekStartsOn = 1,
  disableDaySelection = false,
  triggerClassName,
  dropdownAlign = "center",
  dropdownPosition = "bottom",
}: CustomDatePickerProps) {
  const { resolvedTheme } = useTheme();
  const isDark =
    isDarkProp !== undefined ? isDarkProp : resolvedTheme === "dark";
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        if (modalRef.current && modalRef.current.contains(target)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen && mobileDialogRef.current) {
      if (!mobileDialogRef.current.open) {
        mobileDialogRef.current.showModal(); // Lo invia nel Top Layer!
      }
    }
  }, [isMobile, isOpen]);

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
        // Derivazione dell'intervallo da preset+currentDate con jump imperativi:
        // sincronizzazione legittima in effetto.
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

  const formatDateLabel = (date: Date | null) =>
    date ? format(date, "MMM d, yyyy") : "-";

  const mainPresets: { id: PresetType; label: string }[] = [
    { id: "last30", label: "Last 30 Days" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
    { id: "all", label: "All" },
    { id: "custom", label: "Custom" },
  ];

  const bgMain = isDark ? "bg-app-card" : "bg-app-bg";
  const textMain = "text-app-text";
  const textMuted = "text-app-muted";
  const borderMain = "border-app-border";
  const bgHover = "hover:bg-app-hover";
  const bgInput = "bg-app-input";
  const borderInput = "border-app-border";

  // Auto-close on single-date selection
  useEffect(() => {
    if (!isRange && startDate && isOpen) {
      // Auto-chiusura in risposta alla selezione di una data in un componente figlio.
      setIsOpen(false);
    }
    // `isOpen` escluso di proposito: l'effetto deve reagire solo a una NUOVA
    // selezione di data (startDate/isRange). Includere isOpen richiuderebbe il
    // picker nell'istante stesso in cui viene aperto con una data già selezionata.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, isRange]);

  const renderTriggerContent = () => {
    // Single-date mode: show just the selected date
    if (!isRange) {
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          {startDate ? format(startDate, "MMM d, yyyy") : "Select a date"}
        </span>
      );
    }

    if (preset === "all")
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          All transactions
        </span>
      );

    // Aggiunta la visualizzazione del testo statico per "Last 30 Days"
    if (preset === "last30")
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          Last 30 Days
        </span>
      );

    if (preset === "month") {
      return (
        <div className="flex items-center justify-between w-full flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => subMonths(prev, 1));
            }}
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${textMain} font-medium text-sm capitalize flex-1 min-w-0 text-center truncate px-1`}
          >
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => addMonths(prev, 1));
            }}
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }
    if (preset === "year") {
      return (
        <div className="flex items-center justify-between w-full flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => subYears(prev, 1));
            }}
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${textMain} font-medium text-sm flex-1 min-w-0 text-center truncate px-1`}
          >
            {format(currentDate, "yyyy")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => addYears(prev, 1));
            }}
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-2 flex-1 min-w-0 font-medium text-sm w-full text-app-text`}
      >
        <span
          className={`flex-1 min-w-0 truncate text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}
        >
          {formatDateLabel(startDate)}
        </span>
        <span className={`${textMuted} shrink-0`}>→</span>
        <span
          className={`flex-1 min-w-0 truncate text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}
        >
          {formatDateLabel(endDate)}
        </span>
      </div>
    );
  };

  return (
    // Contenitore principale flessibile per posizionare l'icona all'esterno
    <div
      className="relative w-full sm:max-w-sm min-w-0 font-sans flex items-center gap-3"
      ref={popoverRef}
    >
      {/* Icona del Calendario fissa a sinistra */}
      {/*<CalendarIcon className={`w-5 h-5 flex-shrink-0 ${isDark ? 'theme-text-muted' : 'theme-text-subtle'}`} />*/}

      {/* Box Cliccabile */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={
          triggerClassName
            ? `flex-1 min-w-0 flex items-center justify-between cursor-pointer ${triggerClassName}`
            : `flex-1 min-w-0 flex items-center justify-between p-3 border rounded-lg shadow-sm cursor-pointer transition-colors h-12 ${bgMain} ${borderMain} hover:border-opacity-70`
        }
      >
        <div className="flex items-center w-full min-w-0">
          {renderTriggerContent()}
        </div>
      </div>

      {/* Popover del Calendario */}
      {isOpen &&
        (() => {
          const popoverContent = (
            <>
              {/* SIDEBAR PRESET — hidden in single-date mode or if hideSidebar is true */}
              {isRange && !hideSidebar && (
                <div
                  className={`flex flex-row sm:flex-col p-2 overflow-x-auto no-scrollbar sm:w-36 flex-shrink-0 border-b sm:border-b-0 sm:border-r ${isDark ? "theme-bg-neutral-dark theme-border-neutral" : "theme-bg-inverse-muted theme-border-inverse"}`}
                >
                  <div className="flex flex-row sm:flex-col gap-1 flex-1">
                    {mainPresets.map((p) => {
                      const isSelected = preset === p.id;
                      const btnBg = isSelected
                        ? isDark
                          ? "bg-app-hover text-app-text shadow-sm"
                          : "bg-app-hover text-app-text shadow-sm"
                        : "text-app-muted hover:bg-app-hover/50";
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPreset(p.id)}
                          className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal ${btnBg}`}
                          style={isSelected ? { color } : {}}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`hidden sm:block h-px w-full my-2 ${isDark ? "theme-bg-neutral" : "theme-bg-inverse-subtle"}`}
                  />
                  <div
                    className={`sm:hidden w-px h-auto mx-2 ${isDark ? "theme-bg-neutral" : "theme-bg-inverse-subtle"}`}
                  />

                  <div className="flex flex-row sm:flex-col gap-1">
                    <button
                      onClick={() => setPreset("today")}
                      className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal ${
                        preset === "today"
                          ? isDark
                            ? "bg-app-hover text-app-text shadow-sm"
                            : "bg-app-hover text-app-text shadow-sm"
                          : "text-app-muted hover:bg-app-hover/50"
                      }`}
                      style={preset === "today" ? { color } : {}}
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}

              {/* CALENDARIO */}
              <div className="flex-1 p-4 overflow-hidden">
                <CalendarContainer
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  startDate={startDate}
                  endDate={endDate}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  preset={preset}
                  setPreset={setPreset}
                  isRange={isRange}
                  color={color}
                  isDark={isDark}
                  weekStartsOn={weekStartsOn}
                  disableDaySelection={disableDaySelection}
                />
              </div>
            </>
          );

          if (isMobile && typeof document !== "undefined") {
            return createPortal(
              <dialog
                ref={mobileDialogRef}
                onClose={() => setIsOpen(false)}
                onClick={(e) => {
                  // Chiude il modale se si clicca sullo sfondo trasparente
                  if (e.target === e.currentTarget) setIsOpen(false);
                }}
                // Rimuoviamo il vecchio div overlay e usiamo il backdrop nativo
                className="m-0 p-0 w-full h-full max-w-none max-h-none theme-bg-transparent backdrop:theme-bg-backdrop-dark open:flex open:flex-col open:justify-end sm:hidden z-[100]"
              >
                <div
                  ref={modalRef}
                  className={`relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl pb-6 shadow-2xl border-t flex flex-col ${bgMain} ${borderMain} animate-[slideUp_0.3s_ease-out]`}
                >
                  {popoverContent}
                </div>
              </dialog>,
              document.body,
            );
          }

          let alignClasses = "left-1/2 -translate-x-1/2";
          if (dropdownAlign === "left") alignClasses = "left-0";
          if (dropdownAlign === "right") alignClasses = "right-0";

          const positionClasses =
            dropdownPosition === "top" ? "bottom-full mb-4" : "top-full mt-4";

          return (
            <div
              ref={modalRef}
              className={`absolute ${positionClasses} ${alignClasses} transform rounded-xl shadow-2xl border flex flex-col sm:flex-row z-[100] ${isRange ? "w-[380px] sm:w-auto sm:min-w-[550px]" : "w-[320px]"} overflow-hidden ${bgMain} ${borderMain}`}
            >
              {popoverContent}
            </div>
          );
        })()}
    </div>
  );
}
