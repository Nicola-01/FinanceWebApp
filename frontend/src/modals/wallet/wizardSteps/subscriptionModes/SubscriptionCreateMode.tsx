import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import { Selector } from "../../../../components/ui/Selector";
import { AmountInput } from "../../../../components/ui/AmountInput";
import { CustomSelect } from "../../../../components/ui/CustomSelect";
import { Icon } from "../../../../components/icon/Icon";
import CustomDatePicker from "../../../../components/DataPicker/CustomDatePicker";
import { CURRENCY_META, type CurrencyCode } from "../../../../utils/currencies";
import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

type FrequencyType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type DurationType = "FOREVER" | "TIMES" | "UNTIL";

/** Local YYYY-MM-DD (no UTC shift, unlike `toISOString`). */
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const NUMBER_FIELD =
  "h-11 w-full [appearance:textfield] rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3 text-center font-bold text-app-text outline-none transition-colors focus:border-[var(--brand-1)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const FIELD_LABEL =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-app-muted";

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
 * "Create" mode of the wizard's Subscriptions step: a focused form to hand-make
 * one recurring payment. The tag is chosen from the tags staged in the previous
 * step, so a created subscription never conflicts. Multi-currency/notes are left
 * out (sensible defaults) to keep the wizard light — they can be edited later in
 * the wallet. Self-contained: it only ever calls {@link onAdd}.
 */
export function SubscriptionCreateMode({
  tags,
  currency,
  accentColor,
  onAdd,
}: SubscriptionCreateModeProps) {
  const [name, setName] = useState("");
  const [tagName, setTagName] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [frequencyInterval, setFrequencyInterval] = useState(1);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("MONTHLY");
  const [duration, setDuration] = useState<DurationType>("FOREVER");
  const [durationTimes, setDurationTimes] = useState(1);
  const [durationUntil, setDurationUntil] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => new Date());

  const currencySymbol =
    CURRENCY_META[currency as CurrencyCode]?.symbol ?? currency;
  const hasTags = tags.length > 0;
  const parsedAmount = Math.abs(Number(amount));
  const canAdd = hasTags && tagName !== "" && amount !== "" && parsedAmount > 0;

  const tagOptions = [
    { value: "", label: "Choose a tag" },
    ...tags.map((t) => ({
      value: t.name,
      label: (
        <span className="flex items-center gap-2">
          <Icon icon={t.icon} color={t.colorHex} />
          {t.name}
        </span>
      ),
    })),
  ];

  const handleAdd = () => {
    if (!canAdd) return;
    const sub: SubscriptionRequest = {
      name: name.trim() || tagName,
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
    // Keep tag/frequency/dates so adding several is quick; clear the identity.
    setName("");
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-4 rounded-[var(--r-card)] border border-app-border bg-app-surface p-4 text-left">
      {!hasTags && (
        <p className="rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/5 px-3 py-2 text-xs text-app-yellow">
          Add at least one tag in the previous step to categorise a custom
          subscription.
        </p>
      )}

      {/* Amount + type */}
      <div className="flex flex-col items-center gap-2">
        <AmountInput
          value={amount}
          currencySymbol={currencySymbol}
          type={type}
          setType={(t) => t && setType(t)}
          onAmountChange={setAmount}
          autoFocus={false}
        />
        <Selector<"EXPENSE" | "INCOME">
          size="sm"
          fullWidth={false}
          value={type}
          onChange={setType}
          options={[
            {
              value: "EXPENSE",
              label: "Expense",
              activeColorClass: "text-app-red",
            },
            {
              value: "INCOME",
              label: "Income",
              activeColorClass: "text-app-green",
            },
          ]}
        />
      </div>

      {/* Name + tag */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className={FIELD_LABEL}>Name</span>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional — defaults to the tag"
            aria-label="Subscription name"
          />
        </div>
        <div>
          <span className={FIELD_LABEL}>Tag</span>
          <CustomSelect
            value={tagName}
            onChange={setTagName}
            options={tagOptions}
            activeColor={accentColor}
            className="h-11 w-full rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3.5 text-sm text-app-text"
          />
        </div>
      </div>

      {/* Frequency + end */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className={FIELD_LABEL}>Repeat every</span>
          <div className="flex items-stretch gap-2">
            <input
              type="number"
              min={1}
              value={frequencyInterval}
              onChange={(e) =>
                setFrequencyInterval(Number(e.target.value) || 1)
              }
              aria-label="Frequency interval"
              className={`${NUMBER_FIELD} w-20`}
            />
            <CustomSelect
              value={frequencyType}
              onChange={(v) => setFrequencyType(v as FrequencyType)}
              options={[
                { value: "DAILY", label: "Days" },
                { value: "WEEKLY", label: "Weeks" },
                { value: "MONTHLY", label: "Months" },
                { value: "YEARLY", label: "Years" },
              ]}
              activeColor={accentColor}
              className="h-11 flex-1 rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3.5 text-sm font-bold text-app-text"
            />
          </div>
        </div>
        <div>
          <span className={FIELD_LABEL}>Ends</span>
          <div className="flex items-stretch gap-2">
            <CustomSelect
              value={duration}
              onChange={(v) => setDuration(v as DurationType)}
              options={[
                { value: "FOREVER", label: "Never" },
                { value: "TIMES", label: "After times" },
                { value: "UNTIL", label: "On date" },
              ]}
              activeColor={accentColor}
              className={`h-11 rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3.5 text-sm font-bold text-app-text ${duration === "FOREVER" ? "flex-1" : "w-32"}`}
            />
            {duration === "TIMES" && (
              <input
                type="number"
                min={1}
                value={durationTimes}
                onChange={(e) => setDurationTimes(Number(e.target.value) || 1)}
                aria-label="Number of occurrences"
                className={`${NUMBER_FIELD} flex-1`}
              />
            )}
            {duration === "UNTIL" && (
              <div className="flex-1">
                <CustomDatePicker
                  isRange={false}
                  color={accentColor}
                  initialPreset="custom"
                  initialStartDate={durationUntil || new Date()}
                  onChange={(val) => {
                    if (val instanceof Date) setDurationUntil(val);
                  }}
                  dropdownAlign="right"
                  dropdownPosition="top"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start date */}
      <div>
        <span className={FIELD_LABEL}>Start date</span>
        <CustomDatePicker
          isRange={false}
          color={accentColor}
          initialPreset="custom"
          initialStartDate={startDate}
          onChange={(val) => {
            if (val instanceof Date) setStartDate(val);
          }}
        />
      </div>

      <Button
        type="button"
        fullWidth
        ripple
        accentColor={accentColor}
        onClick={handleAdd}
        disabled={!canAdd}
      >
        <FontAwesomeIcon icon={faPlus} />
        Add subscription
      </Button>
    </div>
  );
}

export default SubscriptionCreateMode;
