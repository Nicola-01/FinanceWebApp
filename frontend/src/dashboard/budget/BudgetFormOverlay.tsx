import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Budget, BudgetPayload, Tag } from "../../types/domain";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay";
import { Input } from "../../components/ui/Input";
import { NumberInput } from "../../components/ui/NumberInput";
import { AmountInput } from "../../components/ui/AmountInput";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { Selector } from "../../components/ui/Selector";
import type { SelectorOption } from "../../components/ui/Selector";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { TagTreePicker } from "../../components/tags/TagTreePicker";
import CustomDatePicker from "../../components/datePicker/CustomDatePicker";
import type { DateRangeValue } from "../../components/datePicker/CustomDatePicker";
import { getCurrencySymbol } from "../../utils/currencies";
import { parseLocalIsoDate, toLocalIsoDate } from "../../utils/localDate";
import { validateThresholds } from "./budgetLogic";

export interface BudgetFormOverlayProps {
  open: boolean;
  /** `null` = create mode; a `Budget` = edit mode, fields prefilled from it. */
  initial: Budget | null;
  /** Wallet tags — one becomes a scope option, alongside "Whole wallet". */
  tags: Tag[];
  /** Per-wallet accent, matching the rest of the wallet's CTAs. */
  accentColor: string;
  /** Wallet currency code, shown next to the limit. */
  currency: string;
  onClose: () => void;
  onSubmit: (payload: BudgetPayload) => Promise<boolean>;
}

type ScopeMode = "WALLET" | "TAG";

const SCOPE_OPTIONS: SelectorOption<ScopeMode>[] = [
  { value: "WALLET", label: "Whole wallet" },
  { value: "TAG", label: "One category" },
];

const PERIOD_OPTIONS: SelectorOption<Budget["periodType"]>[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
];

/**
 * Create/edit form for a budget, hosted in the shared drawer/mobile-sheet
 * shell. Fully controlled by local state initialised from `initial` (reset on
 * every open, since the tab keeps a single instance alive across create/edit).
 */
export const BudgetFormOverlay: React.FC<BudgetFormOverlayProps> = ({
  open,
  initial,
  tags,
  accentColor,
  currency,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [scopeMode, setScopeMode] = useState<ScopeMode>(
    initial?.tagName ? "TAG" : "WALLET",
  );
  const [tagName, setTagName] = useState(initial?.tagName ?? "");
  const [limitAmount, setLimitAmount] = useState(
    initial ? String(initial.limitAmount) : "",
  );
  const [periodType, setPeriodType] = useState<Budget["periodType"]>(
    initial?.periodType ?? "MONTHLY",
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [rollover, setRollover] = useState(initial?.rollover ?? false);
  const [thresholds, setThresholds] = useState<number[]>(
    initial?.alertThresholds ?? [80, 100],
  );
  const [newThreshold, setNewThreshold] = useState("");
  const [addingThreshold, setAddingThreshold] = useState(false);
  const thresholdInputRef = useRef<HTMLInputElement>(null);
  // Only feeds AmountInput's sign colour; a limit is always a magnitude.
  const [amountType, setAmountType] = useState<"EXPENSE" | "INCOME" | "">("");
  const [submitting, setSubmitting] = useState(false);

  // Reset every field whenever the overlay (re)opens — the tab keeps one
  // instance mounted across create → close → edit-another transitions, so
  // the initial useState value alone would only apply on first mount.
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setScopeMode(initial?.tagName ? "TAG" : "WALLET");
    setTagName(initial?.tagName ?? "");
    setLimitAmount(initial ? String(initial.limitAmount) : "");
    setPeriodType(initial?.periodType ?? "MONTHLY");
    setStartDate(initial?.startDate ?? "");
    setEndDate(initial?.endDate ?? "");
    setRollover(initial?.rollover ?? false);
    setThresholds(initial?.alertThresholds ?? [80, 100]);
    setNewThreshold("");
    setAddingThreshold(false);
    setAmountType("");
    setSubmitting(false);
  }, [open, initial]);

  const trimmedName = name.trim();
  const nameOk = trimmedName.length >= 3 && trimmedName.length <= 25;
  const amountOk = Number(limitAmount) > 0;
  const isCustom = periodType === "CUSTOM";
  const dateOk =
    !isCustom || (startDate !== "" && endDate !== "" && endDate >= startDate);
  const thresholdsError = validateThresholds(thresholds);
  const scopeOk = scopeMode === "WALLET" || tagName !== "";
  const canSubmit =
    nameOk && amountOk && scopeOk && dateOk && thresholdsError === null;

  const buildPayload = (): BudgetPayload => ({
    name: trimmedName,
    tagName: scopeMode === "WALLET" ? null : tagName,
    limitAmount: Number(limitAmount),
    periodType,
    alertThresholds: thresholds,
    ...(isCustom ? { startDate, endDate } : { rollover }),
  });

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onSubmit(buildPayload());
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Swap "Add" for the input and focus it in the same tap, so mobile
  // browsers open the keyboard (a deferred focus is ignored there).
  const startAddingThreshold = () => {
    flushSync(() => setAddingThreshold(true));
    thresholdInputRef.current?.focus();
  };

  // Enter / blur: keep a valid, non-duplicate value and fold back into "Add".
  const commitThreshold = () => {
    const parsed = Number(newThreshold);
    if (newThreshold.trim() && !Number.isNaN(parsed)) {
      setThresholds((prev) =>
        prev.includes(parsed) ? prev : [...prev, parsed],
      );
    }
    setNewThreshold("");
    setAddingThreshold(false);
  };

  const removeThreshold = (t: number) =>
    setThresholds((prev) => prev.filter((x) => x !== t));

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title={initial ? "Edit budget" : "New budget"}
      accentColor={accentColor}
      footer={
        <Button
          type="button"
          size="lg"
          fullWidth
          accentColor={accentColor}
          ripple
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Create budget"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 text-left">
        {/* Limit — same big amount field as transactions */}
        <div className="flex flex-col items-center py-2">
          <AmountInput
            value={limitAmount}
            type={amountType}
            setType={setAmountType}
            currencySymbol={getCurrencySymbol(currency)}
            onAmountChange={setLimitAmount}
            autoFocus={!initial}
            aria-label="Limit amount"
          />
          <p className="mt-1 text-xs text-app-muted">Spending limit</p>
        </div>

        <div>
          <FieldLabel>Name</FieldLabel>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            aria-label="Name"
            invalid={name.length > 0 && !nameOk}
          />
          {name.length > 0 && !nameOk && (
            <p className="mt-1.5 ml-1 text-xs text-app-red">
              Name must be 3–25 characters.
            </p>
          )}
        </div>

        {/* Scope */}
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Applies to</FieldLabel>
            <Selector
              options={SCOPE_OPTIONS}
              value={scopeMode}
              onChange={setScopeMode}
              accentColor={accentColor}
            />
          </div>
          {scopeMode === "TAG" && (
            <TagTreePicker
              tags={tags}
              color={accentColor}
              selectedTagName={tagName}
              onSelectTag={setTagName}
              showLabel={false}
            />
          )}
        </div>

        {/* Period */}
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Period</FieldLabel>
            <Selector
              options={PERIOD_OPTIONS}
              value={periodType}
              onChange={setPeriodType}
              accentColor={accentColor}
            />
          </div>
          {isCustom ? (
            // The picker caps its own width (max-w-sm); centre it in the row.
            <div className="flex justify-center">
              <CustomDatePicker
                isRange
                hideSidebar
                color={accentColor}
                initialPreset="custom"
                initialStartDate={
                  startDate ? parseLocalIsoDate(startDate) : null
                }
                initialEndDate={endDate ? parseLocalIsoDate(endDate) : null}
                onChange={(val) => {
                  const range = val as DateRangeValue | null;
                  setStartDate(range?.start ? toLocalIsoDate(range.start) : "");
                  setEndDate(range?.end ? toLocalIsoDate(range.end) : "");
                }}
              />
            </div>
          ) : (
            <Toggle
              checked={rollover}
              onChange={setRollover}
              accentColor={accentColor}
              size="sm"
              label="Carry unspent budget into the next period"
              aria-label="Roll over unused budget"
            />
          )}
        </div>

        <hr className="border-app-border" />

        {/* Alert thresholds */}
        <div>
          <FieldLabel>Alert me at</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {thresholds.map((t) => (
              <Badge
                key={t}
                size="md"
                mono
                color={accentColor}
                className="pr-1"
              >
                {`${t}%`}
                <button
                  type="button"
                  aria-label={`Remove ${t}%`}
                  onClick={() => removeThreshold(t)}
                  className="flex h-4 w-4 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              </Badge>
            ))}
            {addingThreshold ? (
              <div className="w-20">
                <NumberInput
                  ref={thresholdInputRef}
                  inputMode="numeric"
                  min="1"
                  max="200"
                  inputSize="sm"
                  value={newThreshold}
                  onChange={setNewThreshold}
                  onBlur={commitThreshold}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitThreshold();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewThreshold("");
                      setAddingThreshold(false);
                    }
                  }}
                  placeholder="90"
                  aria-label="New alert threshold"
                  className="tabular-nums"
                  rightSlot={
                    <span className="pr-1.5 text-xs text-app-muted">%</span>
                  }
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startAddingThreshold}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add
              </Button>
            )}
          </div>
          {thresholdsError && (
            <p className="mt-1.5 ml-1 text-xs text-app-red">
              {thresholdsError}
            </p>
          )}
        </div>
      </div>
    </ResponsiveOverlay>
  );
};
