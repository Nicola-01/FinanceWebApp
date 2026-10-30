import { useTheme } from "../../utils/ThemeContext";
import CalendarContainer from "./CalendarContainer";
import DatePickerTrigger from "./DatePickerTrigger";
import DatePickerSidebar from "./DatePickerSidebar";
import DatePickerSurface from "./DatePickerSurface";
import { useDatePicker } from "./useDatePicker";
import type { DatePickerValue, PresetType } from "./datePresets";

export type {
  DateRangeValue,
  DatePickerValue,
  PresetType,
} from "./datePresets";

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
  const {
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
  } = useDatePicker({
    isRange,
    onChange,
    initialPreset,
    initialStartDate,
    initialEndDate,
    onPresetChange,
  });

  return (
    <div
      className="relative w-full sm:max-w-sm min-w-0 font-sans flex items-center gap-3"
      ref={popoverRef}
    >
      {/* Calendar icon pinned left (disabled) */}
      {/*<CalendarIcon className={`w-5 h-5 flex-shrink-0 ${isDark ? 'theme-text-muted' : 'theme-text-subtle'}`} />*/}

      {/* Clickable trigger */}
      <DatePickerTrigger
        isRange={isRange}
        isDark={isDark}
        preset={preset}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        startDate={startDate}
        endDate={endDate}
        onToggle={() => setIsOpen(!isOpen)}
        triggerClassName={triggerClassName}
      />

      {/* Calendar popover */}
      {isOpen && (
        <DatePickerSurface
          isMobile={isMobile}
          withSidebar={isRange && !hideSidebar}
          isDark={isDark}
          mobileDialogRef={mobileDialogRef}
          modalRef={modalRef}
          onClose={() => setIsOpen(false)}
          dropdownAlign={dropdownAlign}
          dropdownPosition={dropdownPosition}
        >
          {/* SIDEBAR PRESET — hidden in single-date mode or if hideSidebar is true */}
          {isRange && !hideSidebar && (
            <DatePickerSidebar
              preset={preset}
              setPreset={setPreset}
              color={color}
              isDark={isDark}
            />
          )}

          {/* CALENDAR */}
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
        </DatePickerSurface>
      )}
    </div>
  );
}
