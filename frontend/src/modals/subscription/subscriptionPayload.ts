import type { Subscription } from "../../types/domain";
import { toLocalIsoDate } from "../../utils/localDate";
import { monthlyRulePayload, type MonthlyRule } from "../../utils/monthlyRule";

export interface ScheduleFields {
  status: Subscription["status"];
  startDate: Date;
  frequencyType: Subscription["frequencyType"];
  frequencyInterval: number;
  duration: Subscription["duration"];
  durationTimes: number;
  durationUntil: Date | null;
  /** Omitted by callers without a rule editor (the API then gets no rule). */
  monthlyRule?: MonthlyRule;
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
  ...(f.monthlyRule &&
    monthlyRulePayload(f.monthlyRule, f.frequencyType, f.startDate)),
});

export interface BankMatchFields {
  /** Selected wallet bank rule; null = None. */
  ruleId: string | null;
}

/**
 * Bank rule part of a `SubscriptionRequest`. The backend reads a null
 * `bankRuleId` as "unchanged", so None is sent as `clearBankRule`. The form
 * no longer offers date-from-bank, so it is always switched off.
 */
export const buildBankMatchPayload = (f: BankMatchFields) =>
  f.ruleId
    ? { bankRuleId: f.ruleId, bankDriven: false }
    : { clearBankRule: true, bankDriven: false };
