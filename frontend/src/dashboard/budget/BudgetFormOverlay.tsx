import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Budget, BudgetPayload, Tag } from "../../utils/types";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay";
import { Input } from "../../components/ui/Input";
import { CustomSelect } from "../../components/ui/CustomSelect";
import type { CustomSelectOption } from "../../components/ui/CustomSelect";
import Button from "../../components/ui/Button";
import Toggle from "../../components/ui/Toggle";
import { validateThresholds } from "./budgetLogic";

export interface BudgetFormOverlayProps {
  open: boolean;
  /** `null` = create mode; a `Budget` = edit mode, fields prefilled from it. */
  initial: Budget | null;
  /** Wallet tags — one becomes a scope option, alongside "Whole wallet". */
  tags: Tag[];
  /** Per-wallet accent, matching the rest of the wallet's CTAs. */
  accentColor: string;
  onClose: () => void;
  onSubmit: (payload: BudgetPayload) => Promise<boolean>;
}

/** Sentinel scope value for a whole-wallet budget (no tag can ever collide with it). */
const WHOLE_WALLET_SCOPE = "__WHOLE_WALLET__";

const PERIOD_OPTIONS: CustomSelectOption[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom range" },
];

const LABEL = "text-xs font-semibold uppercase tracking-wider text-app-muted";
const SELECT_CLASS =
  "rounded-[var(--r-input)] border border-app-border bg-app-input/70 px-3.5 py-2.5 text-sm font-semibold text-app-text";

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
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [scope, setScope] = useState(initial?.tagName ?? WHOLE_WALLET_SCOPE);
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
  const [submitting, setSubmitting] = useState(false);

  // Reset every field whenever the overlay (re)opens — the tab keeps one
  // instance mounted across create → close → edit-another transitions, so
  // the initial useState value alone would only apply on first mount.
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setScope(initial?.tagName ?? WHOLE_WALLET_SCOPE);
    setLimitAmount(initial ? String(initial.limitAmount) : "");
    setPeriodType(initial?.periodType ?? "MONTHLY");
    setStartDate(initial?.startDate ?? "");
    setEndDate(initial?.endDate ?? "");
    setRollover(initial?.rollover ?? false);
    setThresholds(initial?.alertThresholds ?? [80, 100]);
    setNewThreshold("");
    setSubmitting(false);
  }, [open, initial]);

  const scopeOptions: CustomSelectOption[] = [
    { value: WHOLE_WALLET_SCOPE, label: "Whole wallet" },
    ...tags.map((t) => ({ value: t.name, label: t.name })),
  ];

  const trimmedName = name.trim();
  const nameOk = trimmedName.length >= 3 && trimmedName.length <= 25;
  const amountOk = Number(limitAmount) > 0;
  const isCustom = periodType === "CUSTOM";
  const dateOk =
    !isCustom || (startDate !== "" && endDate !== "" && endDate >= startDate);
  const thresholdsError = validateThresholds(thresholds);
  const canSubmit = nameOk && amountOk && dateOk && thresholdsError === null;

  const buildPayload = (): BudgetPayload => ({
    name: trimmedName,
    tagName: scope === WHOLE_WALLET_SCOPE ? null : scope,
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

  const handleAddThreshold = () => {
    const parsed = Number(newThreshold);
    if (!newThreshold.trim() || Number.isNaN(parsed)) return;
    setThresholds((prev) => [...prev, parsed]);
    setNewThreshold("");
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
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            accentColor={accentColor}
            ripple
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {initial ? "Save changes" : "Create budget"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Name</span>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            aria-label="Name"
            invalid={name.length > 0 && !nameOk}
          />
          {name.length > 0 && !nameOk && (
            <p className="text-xs text-app-red">
              Name must be 3–25 characters.
            </p>
          )}
        </div>

        {/* Scope */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Scope</span>
          <CustomSelect
            value={scope}
            onChange={setScope}
            options={scopeOptions}
            activeColor={accentColor}
            className={SELECT_CLASS}
          />
        </div>

        {/* Limit amount */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Limit amount</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            placeholder="0.00"
            aria-label="Limit amount"
            invalid={limitAmount.length > 0 && !amountOk}
          />
        </div>

        {/* Period */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Period</span>
          <CustomSelect
            value={periodType}
            onChange={(val) => setPeriodType(val as Budget["periodType"])}
            options={PERIOD_OPTIONS}
            activeColor={accentColor}
            className={SELECT_CLASS}
          />
        </div>

        {/* Custom range dates */}
        {isCustom && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Start date</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>End date</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
                invalid={!dateOk && endDate !== ""}
              />
            </div>
            {!dateOk && startDate && endDate && (
              <p className="col-span-2 text-xs text-app-red">
                End date must be on or after the start date.
              </p>
            )}
          </div>
        )}

        {/* Rollover — recurring periods only */}
        {!isCustom && (
          <div className="flex items-center justify-between rounded-[var(--r-input)] border border-app-border bg-app-input/50 px-3.5 py-2.5">
            <div>
              <p className="text-sm font-semibold text-app-text">
                Roll over unused budget
              </p>
              <p className="text-xs text-app-muted">
                Carry any unspent amount into the next period.
              </p>
            </div>
            <Toggle
              checked={rollover}
              onChange={setRollover}
              accentColor={accentColor}
              aria-label="Roll over unused budget"
            />
          </div>
        )}

        {/* Alert thresholds */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Alert thresholds</span>
          <div className="flex flex-wrap gap-2">
            {thresholds.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full bg-app-input px-3 py-1 text-xs font-semibold text-app-text"
              >
                {`${t}%`}
                <button
                  type="button"
                  aria-label={`Remove ${t}%`}
                  onClick={() => removeThreshold(t)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-hover hover:text-app-red"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="200"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddThreshold();
                }
              }}
              placeholder="e.g. 90"
              aria-label="New alert threshold"
              className="max-w-[7rem]"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddThreshold}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add
            </Button>
          </div>
          {thresholdsError && (
            <p className="text-xs text-app-red">{thresholdsError}</p>
          )}
        </div>
      </div>
    </ResponsiveOverlay>
  );
};

export default BudgetFormOverlay;
