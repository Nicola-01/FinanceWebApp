import type { Subscription } from "../../types/domain";
import { toLocalIsoDate } from "../../utils/localDate";

export interface ScheduleFields {
  status: Subscription["status"];
  startDate: Date;
  frequencyType: Subscription["frequencyType"];
  frequencyInterval: number;
  duration: Subscription["duration"];
  durationTimes: number;
  durationUntil: Date | null;
}

/**
 * Scheduling part of a `SubscriptionRequest`: dates as local `YYYY-MM-DD`,
 * and the duration detail only for the duration mode that uses it.
 */
export const buildSchedulePayload = (f: ScheduleFields) => ({
  status: f.status,
  startDate: toLocalIsoDate(f.startDate),
  frequencyType: f.frequencyType,
  frequencyInterval: f.frequencyInterval,
  duration: f.duration,
  durationTimes: f.duration === "TIMES" ? f.durationTimes : null,
  durationUntil:
    f.duration === "UNTIL" && f.durationUntil
      ? toLocalIsoDate(f.durationUntil)
      : null,
});
