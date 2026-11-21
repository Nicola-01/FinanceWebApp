import { useMemo } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { Selector } from "../../components/ui/Selector.tsx";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { FormRow } from "../../components/ui/FormRow";
import { faCalendarDay } from "@fortawesome/free-solid-svg-icons";
import type { Subscription, Weekday } from "../../types/domain";
import {
  generateSubscriptionOccurrences,
  WEEKDAYS,
} from "../../utils/subscriptionHelper";
import { toLocalIsoDate } from "../../utils/localDate";
import {
  defaultRuleForMode,
  EMPTY_MONTHLY_RULE,
  monthlyRuleMode,
  monthlyRulePayload,
  ordinalLabel,
  weekdayLabel,
  type MonthlyRule,
  type MonthlyRuleMode,
} from "../../utils/monthlyRule";

interface Props {
  rule: MonthlyRule;
  onChange: (rule: MonthlyRule) => void;
  startDate: Date;
  frequencyInterval: number;
  accentColor?: string;
  /** "card": boxed v1 editor. "rows": v2 FormRows for a `divide-y` card. */
  variant?: "card" | "rows";
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const DAY_OPTIONS = [
  ...range(1, 31).map((d) => ({ value: String(d), label: ordinalLabel(d) })),
  ...[-1, -2, -3, -4, -5].map((d) => ({
    value: String(d),
    label: `${ordinalLabel(d)} day`.replace(/^./, (c) => c.toUpperCase()),
  })),
];
const WORKING_ORDINALS = [1, 2, 3, 4, 5, -1, -2, -3];
const WEEKDAY_ORDINALS = [1, 2, 3, 4, -1, -2];
// Monday-first for the dropdown.
const WEEKDAY_OPTIONS = [...WEEKDAYS.slice(1), WEEKDAYS[0]].map((w) => ({
  value: w,
  label: weekdayLabel(w),
}));

const ordinalOptions = (values: number[]) =>
  values.map((n) => ({
    value: String(n),
    label: ordinalLabel(n).replace(/^./, (c) => c.toUpperCase()),
  }));

const PREVIEW_COUNT = 3;

function previewDates(
  rule: MonthlyRule,
  startDate: Date,
  frequencyInterval: number,
): Date[] {
  const sub = {
    frequencyType: "MONTHLY",
    frequencyInterval,
    startDate: toLocalIsoDate(startDate),
    duration: "FOREVER",
    ...monthlyRulePayload(rule, "MONTHLY", startDate),
  } as unknown as Subscription;
  const today = startOfDay(new Date());
  const year = Math.max(today.getFullYear(), startDate.getFullYear());
  return generateSubscriptionOccurrences(sub, year - 1, year + 2)
    .filter((d) => !isBefore(d, today))
    .slice(0, PREVIEW_COUNT);
}

/** "Next: …" preview line, rendered by the modal below its schedule card (v2). */
export function MonthlyRuleNext({
  rule,
  startDate,
  frequencyInterval,
}: Pick<Props, "rule" | "startDate" | "frequencyInterval">) {
  const preview = useMemo(
    () => previewDates(rule, startDate, frequencyInterval),
    [rule, startDate, frequencyInterval],
  );
  if (preview.length === 0) return null;
  return (
    <p className="mt-2 px-1 text-[13px] text-app-faint" aria-live="polite">
      Next: {preview.map((d) => format(d, "EEE d MMM yyyy")).join(", ")}
    </p>
  );
}

/**
 * "On which day" editor for MONTHLY subscriptions: a plain day of the month
 * (incl. counting from the end), the n-th weekday, or the n-th working day,
 * with a preview of the next dates so the rule can be checked at a glance.
 */
export function MonthlyRulePicker({
  rule,
  onChange,
  startDate,
  frequencyInterval,
  accentColor,
  variant = "card",
}: Props) {
  const mode = monthlyRuleMode(rule);

  const preview = useMemo(
    () => previewDates(rule, startDate, frequencyInterval),
    [rule, startDate, frequencyInterval],
  );

  const selectClass =
    "flex-1 min-w-0 bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer";

  // Shared edit handlers for both variants.
  const setSpecificDay = (v: string) =>
    onChange({ ...EMPTY_MONTHLY_RULE, monthlySpecificDay: Number(v) });
  const setWeekdayOrdinal = (v: string) =>
    onChange({ ...rule, monthlyWeekdayOrdinal: Number(v) });
  const setWeekday = (v: string) =>
    onChange({ ...rule, monthlyWeekday: v as Weekday });
  const setWorkingDay = (v: string) =>
    onChange({ ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: Number(v) });

  if (variant === "rows") {
    const rowSelect =
      "min-w-0 bg-transparent px-1 py-1 text-sm text-app-text cursor-pointer";
    return (
      <>
        <div className="px-4 py-3">
          <Selector<MonthlyRuleMode>
            value={mode}
            onChange={(m) => onChange(defaultRuleForMode(m, startDate))}
            size="md"
            accentColor={accentColor}
            options={[
              { value: "DAY", label: "Day of month" },
              { value: "WEEKDAY", label: "Weekday" },
              { value: "WORKING_DAY", label: "Working day" },
            ]}
          />
        </div>

        <FormRow icon={faCalendarDay} label="Day">
          <div className="flex min-w-0 items-center gap-2">
            {mode === "DAY" && (
              <CustomSelect
                value={String(rule.monthlySpecificDay ?? startDate.getDate())}
                onChange={setSpecificDay}
                className={rowSelect}
                activeColor={accentColor}
                options={DAY_OPTIONS}
              />
            )}
            {mode === "WEEKDAY" && (
              <>
                <CustomSelect
                  value={String(rule.monthlyWeekdayOrdinal)}
                  onChange={setWeekdayOrdinal}
                  className={rowSelect}
                  activeColor={accentColor}
                  options={ordinalOptions(WEEKDAY_ORDINALS)}
                />
                <CustomSelect
                  value={rule.monthlyWeekday ?? "MONDAY"}
                  onChange={setWeekday}
                  className={rowSelect}
                  activeColor={accentColor}
                  dropdownAlign="right"
                  options={WEEKDAY_OPTIONS}
                />
              </>
            )}
            {mode === "WORKING_DAY" && (
              <>
                <CustomSelect
                  value={String(rule.monthlyWorkingDay)}
                  onChange={setWorkingDay}
                  className={rowSelect}
                  activeColor={accentColor}
                  options={ordinalOptions(WORKING_ORDINALS)}
                />
                <span className="text-sm text-app-muted">working day</span>
              </>
            )}
          </div>
        </FormRow>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <FieldLabel>On</FieldLabel>
        <Selector<MonthlyRuleMode>
          value={mode}
          onChange={(m) => onChange(defaultRuleForMode(m, startDate))}
          size="md"
          accentColor={accentColor}
          options={[
            { value: "DAY", label: "Day of month" },
            { value: "WEEKDAY", label: "Weekday" },
            { value: "WORKING_DAY", label: "Working day" },
          ]}
        />
      </div>

      <div className="flex items-center bg-app-input border border-app-border rounded-xl shadow-inner focus-within:border-[var(--brand-1)] transition-colors h-12">
        {mode === "DAY" && (
          <CustomSelect
            value={String(rule.monthlySpecificDay ?? startDate.getDate())}
            onChange={setSpecificDay}
            className={selectClass}
            activeColor={accentColor}
            options={DAY_OPTIONS}
          />
        )}

        {mode === "WEEKDAY" && (
          <>
            <CustomSelect
              value={String(rule.monthlyWeekdayOrdinal)}
              onChange={setWeekdayOrdinal}
              className={`${selectClass} border-r border-app-border`}
              activeColor={accentColor}
              options={ordinalOptions(WEEKDAY_ORDINALS)}
            />
            <CustomSelect
              value={rule.monthlyWeekday ?? "MONDAY"}
              onChange={setWeekday}
              className={selectClass}
              activeColor={accentColor}
              dropdownAlign="right"
              options={WEEKDAY_OPTIONS}
            />
          </>
        )}

        {mode === "WORKING_DAY" && (
          <>
            <CustomSelect
              value={String(rule.monthlyWorkingDay)}
              onChange={setWorkingDay}
              className={`${selectClass} border-r border-app-border`}
              activeColor={accentColor}
              options={ordinalOptions(WORKING_ORDINALS)}
            />
            <span className="flex-1 px-3 text-sm text-app-muted">
              working day (Mon–Fri)
            </span>
          </>
        )}
      </div>

      {preview.length > 0 && (
        <p className="text-xs text-app-muted" aria-live="polite">
          Next:{" "}
          {preview.map((d, i) => (
            <span key={d.toISOString()}>
              {i > 0 && ", "}
              <span className="font-bold text-app-text">
                {format(d, "EEE d MMM yyyy")}
              </span>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export default MonthlyRulePicker;
