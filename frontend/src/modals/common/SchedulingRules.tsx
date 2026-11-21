import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckDouble,
  faCircleHalfStroke,
  faFlagCheckered,
  faPause,
  faPlay,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import CustomDatePicker from "../../components/datePicker/CustomDatePicker";
import { Selector } from "../../components/ui/Selector.tsx";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { FormRow } from "../../components/ui/FormRow";
import { MonthlyRulePicker } from "./MonthlyRulePicker";
import type { MonthlyRule } from "../../utils/monthlyRule";

export type FrequencyType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type DurationType = "FOREVER" | "TIMES" | "UNTIL";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface SchedulingRulesProps {
  frequencyInterval: number;
  onFrequencyIntervalChange: (value: number) => void;
  frequencyType: FrequencyType;
  onFrequencyTypeChange: (value: FrequencyType) => void;
  duration: DurationType;
  onDurationChange: (value: DurationType) => void;
  durationTimes: number;
  onDurationTimesChange: (value: number) => void;
  durationUntil: Date | null;
  onDurationUntilChange: (value: Date) => void;
  /** Show the Active/Paused/Completed status selector. Default: true. */
  showStatus?: boolean;
  status?: SubscriptionStatus;
  onStatusChange?: (value: SubscriptionStatus) => void;
  /** Accent colour (hex) for the selects + active status pill. */
  accentColor?: string;
  /** Monthly "on which day" rule; the picker shows for MONTHLY when provided. */
  monthlyRule?: MonthlyRule;
  onMonthlyRuleChange?: (rule: MonthlyRule) => void;
  /** Start date the monthly rule defaults and preview are derived from. */
  startDate?: Date;
  /**
   * "card": the boxed v1 editor. "rows": v2 — bare FormRows (no wrapper) to
   * drop straight into a `divide-y` form card.
   */
  variant?: "card" | "rows";
}

/** v2 Active/Paused/Completed row, usable on its own in a `divide-y` card. */
export function SubscriptionStatusRow({
  status,
  onStatusChange,
  accentColor,
}: {
  status?: SubscriptionStatus;
  onStatusChange?: (value: SubscriptionStatus) => void;
  accentColor?: string;
}) {
  return (
    <FormRow icon={faCircleHalfStroke} label="Status">
      <CustomSelect
        value={status ?? "ACTIVE"}
        onChange={(val) => onStatusChange?.(val as SubscriptionStatus)}
        className="min-w-0 bg-transparent px-1 py-1 text-sm text-app-text cursor-pointer"
        activeColor={accentColor}
        options={[
          { value: "PAUSED", label: "Paused" },
          { value: "ACTIVE", label: "Active" },
          { value: "COMPLETED", label: "Completed" },
        ]}
      />
    </FormRow>
  );
}

/**
 * Reusable recurrence editor (frequency + duration + optional status) shared by
 * the subscription modal and the wallet-creation wizard. Fully controlled: all
 * values and change handlers come from props. The `showStatus` flag toggles the
 * Active/Paused/Completed status row.
 */
export function SchedulingRules({
  frequencyInterval,
  onFrequencyIntervalChange,
  frequencyType,
  onFrequencyTypeChange,
  duration,
  onDurationChange,
  durationTimes,
  onDurationTimesChange,
  durationUntil,
  onDurationUntilChange,
  showStatus = true,
  status,
  onStatusChange,
  accentColor,
  monthlyRule,
  onMonthlyRuleChange,
  startDate,
  variant = "card",
}: SchedulingRulesProps) {
  if (variant === "rows") {
    const selectClass =
      "min-w-0 bg-transparent px-1 py-1 text-sm text-app-text cursor-pointer";
    return (
      <>
        <FormRow icon={faRepeat} label="Repeats">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm text-app-muted">Every</span>
            <input
              type="number"
              min="1"
              aria-label="Repeat every"
              value={frequencyInterval}
              onChange={(e) =>
                onFrequencyIntervalChange(Number(e.target.value) || 1)
              }
              className="h-8 w-12 min-w-0 rounded-[var(--r-sm)] bg-app-raised text-center text-sm text-app-text focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <CustomSelect
              value={frequencyType}
              onChange={(val) => onFrequencyTypeChange(val as FrequencyType)}
              className={selectClass}
              activeColor={accentColor}
              options={[
                { value: "DAILY", label: "Days" },
                { value: "WEEKLY", label: "Weeks" },
                { value: "MONTHLY", label: "Months" },
                { value: "YEARLY", label: "Years" },
              ]}
            />
          </div>
        </FormRow>

        <FormRow icon={faFlagCheckered} label="Ends">
          <div className="flex min-w-0 items-center gap-2">
            <CustomSelect
              value={duration}
              onChange={(val) => onDurationChange(val as DurationType)}
              className={selectClass}
              activeColor={accentColor}
              options={[
                { value: "FOREVER", label: "Never" },
                { value: "TIMES", label: "After times" },
                { value: "UNTIL", label: "On date" },
              ]}
            />
            {duration === "TIMES" && (
              <input
                type="number"
                min="1"
                aria-label="Number of times"
                value={durationTimes}
                onChange={(e) =>
                  onDurationTimesChange(Number(e.target.value) || 1)
                }
                className="h-8 w-12 min-w-0 rounded-[var(--r-sm)] bg-app-raised text-center text-sm text-app-text focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
            {duration === "UNTIL" && (
              <CustomDatePicker
                isRange={false}
                color={accentColor}
                initialPreset="custom"
                initialStartDate={durationUntil || new Date()}
                onChange={(val) => {
                  if (val instanceof Date) onDurationUntilChange(val);
                }}
                triggerClassName="bg-transparent shadow-none px-0 text-sm text-app-text"
                dropdownAlign="right"
                dropdownPosition="top"
              />
            )}
          </div>
        </FormRow>

        {frequencyType === "MONTHLY" &&
          monthlyRule &&
          onMonthlyRuleChange &&
          startDate && (
            <MonthlyRulePicker
              variant="rows"
              rule={monthlyRule}
              onChange={onMonthlyRuleChange}
              startDate={startDate}
              frequencyInterval={frequencyInterval}
              accentColor={accentColor}
            />
          )}

        {showStatus && (
          <SubscriptionStatusRow
            status={status}
            onStatusChange={onStatusChange}
            accentColor={accentColor}
          />
        )}
      </>
    );
  }

  return (
    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-sm font-bold text-app-text">Scheduling Rules</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repeat Every */}
        <div>
          <FieldLabel>Repeat Every</FieldLabel>
          <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner focus-within:border-[var(--brand-1)] transition-colors h-12">
            <input
              type="number"
              min="1"
              value={frequencyInterval}
              onChange={(e) =>
                onFrequencyIntervalChange(Number(e.target.value) || 1)
              }
              className="w-1/2 bg-transparent px-3 py-2 text-app-text font-bold focus:outline-none text-center border-r border-app-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <CustomSelect
              value={frequencyType}
              onChange={(val) =>
                onFrequencyTypeChange(
                  val as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
                )
              }
              className="w-1/2 bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer"
              activeColor={accentColor}
              options={[
                { value: "DAILY", label: "Days" },
                { value: "WEEKLY", label: "Weeks" },
                { value: "MONTHLY", label: "Months" },
                { value: "YEARLY", label: "Years" },
              ]}
            />
          </div>
        </div>

        {/* Ends */}
        <div>
          <FieldLabel>Ends</FieldLabel>
          <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner focus-within:border-[var(--brand-1)] transition-colors h-12">
            <CustomSelect
              value={duration}
              onChange={(val) =>
                onDurationChange(val as "FOREVER" | "TIMES" | "UNTIL")
              }
              className={`${duration === "FOREVER" ? "w-full" : "w-1/2 border-r border-app-border"} bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer`}
              activeColor={accentColor}
              options={[
                { value: "FOREVER", label: "Never" },
                { value: "TIMES", label: "After times" },
                { value: "UNTIL", label: "On date" },
              ]}
            />

            {duration === "TIMES" && (
              <input
                type="number"
                min="1"
                value={durationTimes}
                onChange={(e) =>
                  onDurationTimesChange(Number(e.target.value) || 1)
                }
                className="w-1/2 bg-transparent px-3 py-2 text-app-text font-bold focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}

            {duration === "UNTIL" && (
              <div className="w-1/2 relative flex">
                <CustomDatePicker
                  isRange={false}
                  color={accentColor}
                  initialPreset="custom"
                  initialStartDate={durationUntil || new Date()}
                  onChange={(val) => {
                    if (val instanceof Date) onDurationUntilChange(val);
                  }}
                  triggerClassName="w-full h-full border-0 bg-transparent shadow-none px-3 py-2 text-app-text font-bold focus:outline-none"
                  dropdownAlign="right"
                  dropdownPosition="top"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {frequencyType === "MONTHLY" &&
        monthlyRule &&
        onMonthlyRuleChange &&
        startDate && (
          <MonthlyRulePicker
            rule={monthlyRule}
            onChange={onMonthlyRuleChange}
            startDate={startDate}
            frequencyInterval={frequencyInterval}
            accentColor={accentColor}
          />
        )}

      {showStatus && (
        <div>
          <FieldLabel>Status</FieldLabel>
          <Selector<SubscriptionStatus>
            value={status ?? "ACTIVE"}
            onChange={(val) => onStatusChange?.(val)}
            size="md"
            options={[
              {
                value: "PAUSED",
                label: "Paused",
                icon: <FontAwesomeIcon icon={faPause} />,
                activeColorClass: "text-app-yellow",
              },
              {
                value: "ACTIVE",
                label: "Active",
                icon: <FontAwesomeIcon icon={faPlay} />,
                activeColorClass: "text-app-sky",
              },
              {
                value: "COMPLETED",
                label: "Completed",
                icon: <FontAwesomeIcon icon={faCheckDouble} />,
                activeColorClass: "text-app-green",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default SchedulingRules;
