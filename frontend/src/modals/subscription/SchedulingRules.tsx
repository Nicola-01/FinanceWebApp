import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faPlay,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import CustomDatePicker from "../../components/DataPicker/CustomDatePicker";
import { Selector } from "../../components/ui/Selector.tsx";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";

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
}: SchedulingRulesProps) {
  return (
    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="text-sm font-bold text-app-text">Scheduling Rules</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repeat Every */}
        <div>
          <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
            Repeat Every
          </label>
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
          <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
            Ends
          </label>
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

      {showStatus && (
        <div>
          <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
            Status
          </label>
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
