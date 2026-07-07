import { useState } from "react";
import Button from "../../../../components/ui/Button";
import { AmountInput } from "../../../../components/ui/AmountInput";
import { TagTreePicker } from "../../../../components/TagSelector/TagTreePicker";
import CustomDatePicker from "../../../../components/DataPicker/CustomDatePicker";
import { TransactionTypeToggle } from "../../../TransactionModal/TransactionTypeToggle";
import {
  SchedulingRules,
  type DurationType,
  type FrequencyType,
} from "../../../subscription/SchedulingRules";
import { CURRENCY_META, type CurrencyCode } from "../../../../utils/currencies";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

/** Local YYYY-MM-DD (no UTC shift, unlike `toISOString`). */
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const FIELD_LABEL =
  "mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted";

export interface SubscriptionCreateModeProps {
  /** Tags staged in the previous step — the only tags a custom subscription can use. */
  tags: TagRequest[];
  /** Wallet currency code (e.g. "EUR"). */
  currency: string;
  /** Wallet accent colour (hex) for the CTA and pickers. */
  accentColor?: string;
  /** Called with a fully-formed subscription when the user adds one. */
  onAdd: (sub: SubscriptionRequest) => void;
}

/**
 * "Create" mode of the wizard's Subscriptions step. Mirrors the full
 * SubscriptionModal — same AmountInput, TransactionTypeToggle, TagTreePicker
 * and SchedulingRules — minus name/notes/multi-currency (sensible defaults;
 * they can be edited later in the wallet). The category tree is fed with the
 * tags staged in the previous step, so a created subscription never conflicts.
 * Self-contained: it only ever calls {@link onAdd}.
 */
export function SubscriptionCreateMode({
  tags,
  currency,
  accentColor,
  onAdd,
}: SubscriptionCreateModeProps) {
  const [tagName, setTagName] = useState("");
  // Neutral until the user picks a sign or a toggle — matches the modal.
  const [type, setType] = useState<"EXPENSE" | "INCOME" | "">("");
  const [amount, setAmount] = useState("");
  const [frequencyInterval, setFrequencyInterval] = useState(1);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("MONTHLY");
  const [duration, setDuration] = useState<DurationType>("FOREVER");
  const [durationTimes, setDurationTimes] = useState(1);
  const [durationUntil, setDurationUntil] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  // Bumped on every add to remount the date picker: it reads `initialStartDate`
  // only at mount, so resetting the state alone wouldn't clear its display.
  const [resetNonce, setResetNonce] = useState(0);

  const currencySymbol =
    CURRENCY_META[currency as CurrencyCode]?.symbol ?? currency;
  const hasTags = tags.length > 0;
  const parsedAmount = Math.abs(Number(amount));
  const canAdd =
    hasTags &&
    tagName !== "" &&
    type !== "" &&
    amount !== "" &&
    parsedAmount > 0;

  const handleAdd = () => {
    if (!canAdd || !type) return;
    const sub: SubscriptionRequest = {
      name: tagName,
      tag: tagName,
      amount: parsedAmount,
      type,
      status: "ACTIVE",
      startDate: toIsoDate(startDate),
      frequencyType,
      frequencyInterval: Math.max(1, frequencyInterval),
      lastWorkingDayOfMonth: false,
      duration,
      autoExchangeRate: false,
    };
    if (duration === "TIMES") sub.durationTimes = Math.max(1, durationTimes);
    if (duration === "UNTIL" && durationUntil)
      sub.durationUntil = toIsoDate(durationUntil);
    onAdd(sub);
    // Reset the whole form back to its defaults so the next subscription starts clean.
    setTagName("");
    setType("");
    setAmount("");
    setFrequencyInterval(1);
    setFrequencyType("MONTHLY");
    setDuration("FOREVER");
    setDurationTimes(1);
    setDurationUntil(null);
    setStartDate(new Date());
    setResetNonce((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-6 rounded-[var(--r-card)] border border-app-border bg-app-surface p-4 text-left">
      {!hasTags && (
        <p className="rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 px-3 py-2 text-xs text-app-yellow">
          Add at least one tag in the previous step to categorise a custom
          subscription.
        </p>
      )}

      {/* 1. AMOUNT AREA — same block as the subscription modal */}
      <div className="flex flex-col items-center justify-center py-2">
        <AmountInput
          value={amount}
          type={type}
          setType={setType}
          currencySymbol={currencySymbol}
          autoFocus={false}
          onAmountChange={setAmount}
        />
        <TransactionTypeToggle type={type} setType={setType} />
      </div>

      {/* 2. CATEGORY & START DATE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          {/* Same drill-down tree as the subscription modal's TagPicker, fed
              with the staged tags (the wallet doesn't exist yet). */}
          <TagTreePicker
            tags={tags}
            color={accentColor}
            selectedTagName={tagName}
            onSelectTag={setTagName}
          />
        </div>
        <div>
          <label className={FIELD_LABEL}>Start Date</label>
          <CustomDatePicker
            key={resetNonce}
            isRange={false}
            color={accentColor}
            initialPreset="custom"
            initialStartDate={startDate}
            onChange={(val) => {
              if (val instanceof Date) setStartDate(val);
            }}
          />
        </div>
      </div>

      {/* 3. SCHEDULING RULES — shared with the subscription modal. Status is
          hidden: a subscription staged for a brand-new wallet is always ACTIVE. */}
      <SchedulingRules
        frequencyInterval={frequencyInterval}
        onFrequencyIntervalChange={setFrequencyInterval}
        frequencyType={frequencyType}
        onFrequencyTypeChange={setFrequencyType}
        duration={duration}
        onDurationChange={setDuration}
        durationTimes={durationTimes}
        onDurationTimesChange={setDurationTimes}
        durationUntil={durationUntil}
        onDurationUntilChange={setDurationUntil}
        showStatus={false}
        accentColor={accentColor}
      />

      <Button
        type="button"
        fullWidth
        ripple
        size="lg"
        accentColor={accentColor}
        onClick={handleAdd}
        disabled={!canAdd}
        aria-label="Add subscription"
      >
        Add subscription
      </Button>
    </div>
  );
}

export default SubscriptionCreateMode;
