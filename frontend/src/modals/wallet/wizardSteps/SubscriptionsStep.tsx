import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { Checkbox } from "../../../components/ui/Checkbox";
import { AmountInput } from "../../../components/ui/AmountInput";
import { CsvUploadField } from "../../../components/ui/CsvUploadField";
import { WizardStepHeader } from "./WizardStepHeader";
import { CURRENCY_META, type CurrencyCode } from "../../../utils/currencies";
import type { SubscriptionRequest } from "../../../dashboard/settings/csvImport";

export interface SubscriptionsStepProps {
  /** Subscriptions staged so far (owned by the wizard). */
  value: SubscriptionRequest[];
  /** Emit the next staged list (append on add/upload, or the trimmed list on remove). */
  onChange: (next: SubscriptionRequest[]) => void;
  /** Wallet currency code (e.g. "EUR") used to annotate amounts. */
  currency: string;
  /** Wallet colour (hex) applied to the checkboxes and upload CTA. */
  accentColor?: string;
}

/** A curated subscription offered as a one-tap starting point. */
interface RecommendedSubscription {
  name: string;
  tag: string;
  amount: number;
}

const RECOMMENDED_SUBSCRIPTIONS: RecommendedSubscription[] = [
  { name: "Netflix", tag: "Entertainment", amount: 12.99 },
  { name: "Spotify", tag: "Music", amount: 9.99 },
  { name: "Gym", tag: "Fitness", amount: 30 },
  { name: "Rent", tag: "Housing", amount: 800 },
  { name: "Mobile plan", tag: "Phone", amount: 15 },
  { name: "Internet", tag: "Internet", amount: 30 },
  { name: "Insurance", tag: "Insurance", amount: 40 },
  { name: "Cloud storage", tag: "Software", amount: 2.99 },
];

/**
 * Expands a recommended suggestion (with its possibly-edited amount) into a
 * complete `SubscriptionRequest`: a monthly, active, never-ending expense
 * starting today with no multi-currency conversion.
 */
const toSubscriptionRequest = (
  suggestion: RecommendedSubscription,
  amount: number,
): SubscriptionRequest => ({
  name: suggestion.name,
  tag: suggestion.tag,
  amount,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: new Date().toISOString().slice(0, 10),
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
});

/**
 * Wizard step (body only) that stages subscriptions for a new wallet. Two entry
 * points feed the same controlled `value`: curated recommendations toggled
 * on/off (each with an editable amount) and a CSV upload via the shared
 * {@link CsvUploadField}. Optional — the wizard lets the user continue with none.
 */
export function SubscriptionsStep({
  value,
  onChange,
  currency,
  accentColor,
}: SubscriptionsStepProps): React.JSX.Element {
  // Per-suggestion editable amount (magnitude string), seeded from the defaults.
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      RECOMMENDED_SUBSCRIPTIONS.map((s) => [s.name, String(s.amount)]),
    ),
  );

  const currencySymbol = useMemo(
    () => CURRENCY_META[currency as CurrencyCode]?.symbol ?? currency,
    [currency],
  );

  const stagedIndexOf = (name: string): number =>
    value.findIndex((s) => s.name === name);

  const toggleSuggestion = (suggestion: RecommendedSubscription) => {
    const idx = stagedIndexOf(suggestion.name);
    if (idx !== -1) {
      onChange(value.filter((_, i) => i !== idx));
      return;
    }
    const raw = amounts[suggestion.name];
    const parsed = Number(raw);
    const amount =
      raw !== "" && Number.isFinite(parsed) ? parsed : suggestion.amount;
    onChange([...value, toSubscriptionRequest(suggestion, amount)]);
  };

  const editAmount = (
    suggestion: RecommendedSubscription,
    magnitude: string,
  ) => {
    setAmounts((prev) => ({ ...prev, [suggestion.name]: magnitude }));
    const idx = stagedIndexOf(suggestion.name);
    if (idx === -1) return;
    const parsed = magnitude === "" ? 0 : Number(magnitude);
    if (!Number.isFinite(parsed)) return;
    onChange(value.map((s, i) => (i === idx ? { ...s, amount: parsed } : s)));
  };

  const removeStaged = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-5 text-left">
      <WizardStepHeader
        icon={faArrowsRotate}
        title="Subscriptions"
        subtitle="Optional — add recurring payments from common ones or a CSV."
      />

      {/* Recommended subscriptions — toggle on to stage, edit the amount inline. */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-app-muted">
          Recommended
        </p>
        <ul className="flex flex-col gap-2">
          {RECOMMENDED_SUBSCRIPTIONS.map((s) => {
            const checked = stagedIndexOf(s.name) !== -1;
            return (
              <li
                key={s.name}
                className="rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Checkbox
                    state={checked}
                    onChange={() => toggleSuggestion(s)}
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

      <CsvUploadField<SubscriptionRequest>
        resource="subscriptions"
        title="Import subscriptions from a CSV"
        columnsHint="Name, Tag, Amount, Type, Status, …"
        noun="subscription"
        accentColor={accentColor}
        onDtos={(dtos) => onChange([...value, ...dtos])}
      />

      {/* Staged list: count + per-row remove. */}
      {value.length > 0 && (
        <div className="rounded-[var(--r-input)] border border-app-border bg-app-input">
          <div className="border-b border-app-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-muted">
              {value.length} subscription{value.length === 1 ? "" : "s"} ready
            </span>
          </div>
          <ul className="custom-scrollbar max-h-52 divide-y divide-app-border overflow-y-auto">
            {value.map((sub, i) => (
              <li
                key={`${sub.name}-${i}`}
                className="flex items-center gap-3 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-app-text">
                  {sub.name || (
                    <span className="text-app-muted">(unnamed)</span>
                  )}
                </span>
                <span className="shrink-0 font-app-mono text-xs tabular-nums text-app-muted">
                  <span
                    className={
                      sub.type === "INCOME" ? "text-app-green" : "text-app-red"
                    }
                  >
                    {sub.type === "INCOME" ? "+" : "-"}
                    {sub.amount} {currencySymbol}
                  </span>
                  {" · "}
                  {sub.frequencyType.toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={() => removeStaged(i)}
                  aria-label={`Remove ${sub.name}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-app-muted transition-colors hover:bg-app-hover hover:text-app-red"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SubscriptionsStep;
