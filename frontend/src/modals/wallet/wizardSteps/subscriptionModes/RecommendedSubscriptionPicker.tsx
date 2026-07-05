import { useState } from "react";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { AmountInput } from "../../../../components/ui/AmountInput";
import {
  RECOMMENDED_SUBSCRIPTIONS,
  type RecommendedSubscription,
} from "./recommendedSubscriptions";

export interface RecommendedSubscriptionPickerProps {
  /** Names of subscriptions currently staged (drives the checked state). */
  stagedNames: Set<string>;
  /** Wallet-currency symbol shown next to each amount. */
  currencySymbol: string;
  /** Wallet accent colour applied to the checkboxes. */
  accentColor?: string;
  /** Stage a suggestion at its (possibly edited) amount. */
  onStage: (suggestion: RecommendedSubscription, amount: number) => void;
  /** Unstage a suggestion by name. */
  onUnstage: (name: string) => void;
  /** Update the amount of an already-staged suggestion. */
  onEditAmount: (name: string, amount: number) => void;
}

/**
 * "Recommended" mode of the wizard's Subscriptions step: a checklist of common
 * subscriptions, each toggled on to stage it and revealing an inline amount
 * editor. Self-contained — it owns the pending per-suggestion amount, and hands
 * every change up through the callbacks; the parent owns the staged list.
 */
export function RecommendedSubscriptionPicker({
  stagedNames,
  currencySymbol,
  accentColor,
  onStage,
  onUnstage,
  onEditAmount,
}: RecommendedSubscriptionPickerProps) {
  // Per-suggestion editable amount (magnitude string), seeded from the defaults.
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      RECOMMENDED_SUBSCRIPTIONS.map((s) => [s.name, String(s.amount)]),
    ),
  );

  const toggle = (s: RecommendedSubscription) => {
    if (stagedNames.has(s.name)) {
      onUnstage(s.name);
      return;
    }
    const raw = amounts[s.name];
    const parsed = Number(raw);
    const amount = raw !== "" && Number.isFinite(parsed) ? parsed : s.amount;
    onStage(s, amount);
  };

  const editAmount = (s: RecommendedSubscription, magnitude: string) => {
    setAmounts((prev) => ({ ...prev, [s.name]: magnitude }));
    if (!stagedNames.has(s.name)) return;
    const parsed = magnitude === "" ? 0 : Number(magnitude);
    if (!Number.isFinite(parsed)) return;
    onEditAmount(s.name, parsed);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">
        Recommended
      </p>
      <ul className="flex flex-col gap-2">
        {RECOMMENDED_SUBSCRIPTIONS.map((s) => {
          const checked = stagedNames.has(s.name);
          return (
            <li
              key={s.name}
              className="rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Checkbox
                  state={checked}
                  onChange={() => toggle(s)}
                  label={s.name}
                  color={accentColor}
                />
                <div className="flex items-center gap-2">
                  <span className="rounded-[var(--r-sm)] border border-app-border bg-app-surface px-2 py-0.5 text-[11px] font-medium text-app-muted">
                    {s.tag}
                  </span>
                  {!checked && (
                    <span className="font-app-mono text-sm tabular-nums text-app-muted">
                      {amounts[s.name]} {currencySymbol}
                    </span>
                  )}
                </div>
              </div>

              {checked && (
                <div className="mt-1 flex justify-center">
                  <AmountInput
                    value={amounts[s.name]}
                    currencySymbol={currencySymbol}
                    type="EXPENSE"
                    setType={() => {}}
                    onAmountChange={(magnitude) => editAmount(s, magnitude)}
                    autoFocus={false}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default RecommendedSubscriptionPicker;
