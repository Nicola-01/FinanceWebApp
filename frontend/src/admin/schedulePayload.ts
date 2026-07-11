export interface ScheduleDraft {
  frequency: string;
  hourOfDay: number;
  minuteOfHour: number;
  daysOfWeek: string[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
}

export interface SchedulePayload extends ScheduleDraft {
  dayOfMonth: number | null;
  monthOfYear: number | null;
}

/** Normalizes the schedule-editor draft into the PUT /admin/jobs/{key}/schedule body. */
export function buildSchedulePayload(draft: ScheduleDraft): SchedulePayload {
  return {
    frequency: draft.frequency,
    hourOfDay: draft.hourOfDay,
    minuteOfHour: draft.minuteOfHour,
    daysOfWeek: draft.frequency === "WEEKLY" ? draft.daysOfWeek : [],
    dayOfMonth:
      draft.frequency === "MONTHLY" || draft.frequency === "YEARLY"
        ? (draft.dayOfMonth ?? 1)
        : null,
    monthOfYear: draft.frequency === "YEARLY" ? (draft.monthOfYear ?? 1) : null,
  };
}
