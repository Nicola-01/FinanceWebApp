import React, { useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFileCsv,
  faTriangleExclamation,
  faCircleCheck,
  faXmark,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { AmountInput } from "../../../components/ui/AmountInput";
import { CURRENCY_META, type CurrencyCode } from "../../../utils/currencies";
import {
  parseAndValidateCsv,
  type RowError,
} from "../../../dashboard/settings/csvValidation";
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
 * complete `SubscriptionRequest` the bulk endpoint accepts: a monthly, active,
 * never-ending expense starting today with no multi-currency conversion.
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
 * Wizard step body (content only — no stepper, no Back/Continue) that stages
 * subscriptions for a new wallet. Two entry points feed the same controlled
 * `value` list: a set of curated recommendations toggled on/off (each with an
 * editable amount), and a CSV upload run through the shared parse+validate pass
 * so a file the all-or-nothing bulk endpoint would reject is caught here first.
 * The parent wizard owns `value` and navigation.
 */
export function SubscriptionsStep({
  value,
  onChange,
  currency,
  accentColor,
}: SubscriptionsStepProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  // Row-level problems from the last CSV upload; a non-empty list blocks append.
  const [errors, setErrors] = useState<RowError[]>([]);
  // Count from the last successful CSV upload (null = none yet / after clear).
  const [addedCount, setAddedCount] = useState<number | null>(null);
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

  // Match a staged subscription to a suggestion by name.
  const stagedIndexOf = (name: string): number =>
    value.findIndex((s) => s.name === name);

  const toggleSuggestion = (suggestion: RecommendedSubscription) => {
    const idx = stagedIndexOf(suggestion.name);
    if (idx !== -1) {
      // Toggling off removes the staged item.
      onChange(value.filter((_, i) => i !== idx));
      return;
    }
    // Toggling on appends a complete request using the (possibly edited) amount.
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
    // Keep an already-staged item's amount in sync while editing.
    const idx = stagedIndexOf(suggestion.name);
    if (idx === -1) return;
    const parsed = magnitude === "" ? 0 : Number(magnitude);
    if (!Number.isFinite(parsed)) return;
    onChange(value.map((s, i) => (i === idx ? { ...s, amount: parsed } : s)));
  };

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset immediately so re-selecting the same file fires `change` again.
    input.value = "";
    if (!file) return;

    const { dtos, rowErrors } = parseAndValidateCsv(
      "subscriptions",
      await file.text(),
    );

    if (rowErrors.length > 0) {
      // Surface every problem inline; nothing is staged.
      setErrors(rowErrors);
      setAddedCount(null);
      return;
    }

    setErrors([]);
    setAddedCount(dtos.length);
    onChange([...value, ...dtos]);
  };

  const removeStaged = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* Recommended subscriptions — toggle on to stage, edit the amount inline. */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-sm font-bold text-app-text">
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className="mr-2 text-app-muted"
            />
            Start from a recommendation
          </h3>
          <p className="mt-1 text-xs text-app-muted">
            Pick the ones you pay for — each is a monthly expense you can tweak
            now or later.
          </p>
        </div>

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

                {/* Editable amount revealed once the suggestion is selected. */}
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

      {/* CSV upload — an alternative bulk entry point. */}
      <div className="flex flex-col items-center gap-3 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-6 text-center">
        <FontAwesomeIcon icon={faFileCsv} className="text-2xl text-app-muted" />
        <div>
          <p className="text-sm font-semibold text-app-text">
            Import subscriptions from a CSV
          </p>
          <p className="mt-1 text-xs text-app-muted">
            The file must match the subscriptions export format.
          </p>
        </div>
        <Button
          type="button"
          accentColor={accentColor}
          ripple
          onClick={openPicker}
        >
          <FontAwesomeIcon icon={faUpload} />
          Upload CSV
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          aria-label="Subscriptions CSV file"
          onChange={handleFile}
        />
        <p className="text-[11px] text-app-muted">
          Columns:{" "}
          <span className="font-app-mono">
            Name, Tag, Amount, Type, Status, …
          </span>{" "}
          —{" "}
          <span className="font-semibold text-app-text underline decoration-app-border underline-offset-2">
            match the export format
          </span>
          .
        </p>
      </div>

      {/* Validation errors from the last upload (blocks the append). */}
      {errors.length > 0 && (
        <div className="rounded-[var(--r-input)] border border-app-red/40 bg-app-red/10 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-app-red">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            This file has {errors.length} problem
            {errors.length === 1 ? "" : "s"} — nothing was imported.
          </p>
          <ul className="custom-scrollbar max-h-40 space-y-1 overflow-y-auto">
            {errors.map((err, i) => (
              <li key={`${err.row}-${i}`} className="text-xs text-app-text">
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success summary from the last upload. */}
      {addedCount !== null && errors.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-app-green">
          <FontAwesomeIcon icon={faCircleCheck} />
          {addedCount} subscription{addedCount === 1 ? "" : "s"} imported from
          CSV.
        </p>
      )}

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
