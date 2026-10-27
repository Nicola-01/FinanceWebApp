// Pure edit helpers for a staged subscription in the wizard.

import type { DurationType } from "../../../common/SchedulingRules";
import { parseLocalIsoDate, toLocalIsoDate } from "../../../../utils/localDate";
import type { SubscriptionRequest } from "../../../../dashboard/settings/csvImport";

/** Parse an optional wallet-local YYYY-MM-DD back to a Date at local midnight. */
export const parseIsoDate = (s?: string): Date | null =>
  s ? parseLocalIsoDate(s) : null;

/**
 * Patch for a duration-mode change: seeds the detail field the new mode needs
 * (1 occurrence / today) when the subscription doesn't carry one yet.
 */
export const durationChangePatch = (
  sub: SubscriptionRequest,
  d: DurationType,
): Partial<SubscriptionRequest> => {
  const patch: Partial<SubscriptionRequest> = { duration: d };
  if (d === "TIMES" && sub.durationTimes == null) patch.durationTimes = 1;
  if (d === "UNTIL" && !sub.durationUntil)
    patch.durationUntil = toLocalIsoDate(new Date());
  return patch;
};
