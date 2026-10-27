import { forwardRef, useImperativeHandle, useState } from "react";
import * as walletOps from "../../api/walletOps";
import Button from "../../components/ui/Button.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import type { CurrencyCode } from "../../utils/currencies";
import type { Tag, Wallet, Subscription } from "../../types/domain";

// Sub-components reused from the transaction modal.
import CustomDatePicker from "../../components/datePicker/CustomDatePicker";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Textarea } from "../../components/ui/Textarea";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { TransactionTypeToggle } from "../../components/ui/TransactionTypeToggle";
import { TagPicker } from "../transaction/TagPicker";
import { ExchangeRateSection } from "../common/exchangeRate/ExchangeRateSection";
import { SchedulingRules } from "../common/SchedulingRules";
import { getApiErrorTitle } from "../../utils/apiError";
import { parseLocalIsoDate } from "../../utils/localDate";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { useAmountEntryForm } from "../common/useAmountEntryForm";
import { buildSchedulePayload } from "./subscriptionPayload";

export interface SubscriptionModalHandle {
  openModal: (sub?: Subscription, initialDate?: Date) => void;
}

interface Props {
  wallet: Wallet;
  tags: Tag[];
  baseCurrency: CurrencyCode;
  onSuccess: () => void;
}

export const SubscriptionModal = forwardRef<SubscriptionModalHandle, Props>(
  ({ wallet, tags, baseCurrency, onSuccess }, ref) => {
    const [open, setOpen] = useState(false);

    // --- General data state ---
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    // Full row kept while editing so we can read its updatedAt (offline
    // precondition for the queued update op).
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const form = useAmountEntryForm(baseCurrency);
    const { type, setType, name, setName, notes, setNotes } = form;
    const { selectedTagName, setSelectedTagName } = form;
    // Reminder mode: no fixed amount — the user fills it in each occurrence.
    const [amountPending, setAmountPending] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date());
    // Foreign-currency rate mode: true = use each day's live rate at execution.
    const [autoExchangeRate, setAutoExchangeRate] = useState(true);

    // --- Scheduling & duration state (subscription-specific) ---
    const [frequencyInterval, setFrequencyInterval] = useState<number>(1);
    const [frequencyType, setFrequencyType] = useState<
      "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
    >("MONTHLY");
    const [duration, setDuration] = useState<"FOREVER" | "TIMES" | "UNTIL">(
      "FOREVER",
    );
    const [durationTimes, setDurationTimes] = useState<number>(1);
    const [durationUntil, setDurationUntil] = useState<Date | null>(null);
    const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "COMPLETED">(
      "ACTIVE",
    );

    const [loading, setLoading] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    useImperativeHandle(ref, () => ({
      openModal: (sub?: Subscription, initialDate?: Date) => {
        setResetKey((prev) => prev + 1);

        if (sub) {
          // --- EDIT MODE ---
          setEditingSubId(sub.id);
          setEditingSub(sub);
          form.reset(sub);
          setAmountPending(sub.amountPending ?? false);
          setStartDate(parseLocalIsoDate(sub.startDate));
          setAutoExchangeRate(sub.autoExchangeRate ?? true);

          // Subscription-specific fields
          setFrequencyInterval(sub.frequencyInterval || 1);
          setFrequencyType(sub.frequencyType || "MONTHLY");
          setDuration(sub.duration || "FOREVER");
          setDurationTimes(sub.durationTimes || 1);
          setDurationUntil(
            sub.durationUntil ? parseLocalIsoDate(sub.durationUntil) : null,
          );
          setStatus(sub.status || "ACTIVE");
        } else {
          // --- CREATE MODE ---
          setEditingSubId(null);
          setEditingSub(null);
          // Open neutral (no type preselected) — matches New Transaction; the
          // type is set as soon as the user enters an amount (sign-driven).
          form.reset();
          setAmountPending(false);
          setStartDate(initialDate || new Date());
          setAutoExchangeRate(true);

          // Reset subscription-specific fields
          setFrequencyInterval(1);
          setFrequencyType("MONTHLY");
          setDuration("FOREVER");
          setDurationTimes(1);
          setDurationUntil(null);
          setStatus("ACTIVE");
        }
        setOpen(true);
      },
    }));

    const handleSave = async () => {
      if (!amountPending && !form.hasAmount)
        return triggerToast("Please enter a valid amount.", false);
      if (!selectedTagName)
        return triggerToast("Please select a category.", false);
      if (!type) return triggerToast("Please select income or expense.", false);

      setLoading(true);
      try {
        // Payload mapped to SubscriptionRequest.java
        const payload = {
          ...form.buildBasePayload(amountPending),
          amountPending,
          autoExchangeRate,
          ...buildSchedulePayload({
            status,
            startDate,
            frequencyType,
            frequencyInterval,
            duration,
            durationTimes,
            durationUntil,
          }),
        };

        if (editingSubId) {
          await walletOps.updateSubscription(
            wallet.id,
            editingSubId,
            payload,
            editingSub?.updatedAt ?? null,
          );
          triggerToast("Subscription updated successfully!", true);
        } else {
          await walletOps.createSubscription(wallet.id, payload);
          triggerToast("Subscription created successfully!", true);
        }

        onSuccess();
        setOpen(false);
      } catch (err: unknown) {
        const actionText = editingSubId ? "updating" : "creating";
        triggerToast(
          getApiErrorTitle(err, `Error ${actionText} subscription`),
          false,
        );
      } finally {
        setLoading(false);
      }
    };

    const canSave =
      (amountPending || form.hasAmount) &&
      selectedTagName !== "" &&
      type !== "";
    const isEditing = !!editingSubId;

    // Primary save control lives in the sticky footer.
    const footer = (
      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || loading}
        accentColor={wallet.color}
        ripple
        fullWidth
        size="lg"
        aria-label="Save subscription"
      >
        {loading ? "Saving…" : isEditing ? "Save changes" : "Add subscription"}
      </Button>
    );

    return (
      <ResponsiveOverlay
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "Edit Subscription" : "New Subscription"}
        accentColor={wallet.color}
        footer={footer}
      >
        <div
          id="subscription-form"
          key={resetKey}
          className="text-left flex flex-col gap-6"
        >
          {/* 1. AMOUNT AREA */}
          <div className="flex flex-col items-center justify-center py-2">
            {!amountPending && (
              <AmountInput
                value={form.amount}
                type={type}
                setType={setType}
                currencySymbol={form.currencySymbol}
                autoFocus={!isEditing}
                onAmountChange={form.handleAmountChange}
              />
            )}
            <TransactionTypeToggle type={type} setType={setType} />
            <Toggle
              checked={amountPending}
              onChange={setAmountPending}
              accentColor={wallet.color}
              size="sm"
              className="mt-3"
              label="Reminder — no fixed amount, fill it in each time"
              aria-label="Reminder subscription (no fixed amount)"
            />
          </div>

          {/* 2. TAGS & START DATE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <TagPicker
                tags={tags}
                selectedTagName={selectedTagName}
                onSelectTag={setSelectedTagName}
              />
            </div>
            <div>
              <FieldLabel>Start Date</FieldLabel>
              <CustomDatePicker
                isRange={false}
                color={wallet.color}
                initialPreset="custom"
                initialStartDate={startDate}
                onChange={(val) => {
                  if (val instanceof Date) setStartDate(val);
                }}
              />
            </div>
          </div>

          {/* 3. SCHEDULING RULES (frequency & duration) */}
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
            showStatus
            status={status}
            onStatusChange={setStatus}
            accentColor={wallet.color}
          />

          {/* 4. NAME & DESCRIPTION */}
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input
                type="text"
                placeholder="Name of the subscription (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                placeholder="Any details... (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                accentColor={wallet.color}
              />
            </div>
          </div>

          <hr className="my-2 border-app-border" />

          {/* 5. EXCHANGE RATE */}
          <ExchangeRateSection
            mode={isEditing ? "edit" : "create"}
            accentColor={wallet.color}
            walletId={wallet.id}
            autoExchangeRate={autoExchangeRate}
            onAutoExchangeRateChange={setAutoExchangeRate}
            {...form.exchangeRateProps}
          />
        </div>
      </ResponsiveOverlay>
    );
  },
);
