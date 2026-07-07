import { forwardRef, useImperativeHandle, useState } from "react";
import api from "../../api/axiosConfig";
import Button from "../../components/ui/Button.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies";
import type { Tag, Wallet, Subscription } from "../../utils/types";

// Sub-components reused from the transaction modal.
import CustomDatePicker from "../../components/DataPicker/CustomDatePicker";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Textarea } from "../../components/ui/Textarea";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { TransactionTypeToggle } from "../TransactionModal/TransactionTypeToggle";
import { TagPicker } from "../TransactionModal/TagPicker/TagPicker";
import { ExchangeRateSection } from "../TransactionModal/ExchangeRateSection";
import { SchedulingRules } from "./SchedulingRules";
import { getApiErrorTitle } from "../../utils/apiError";

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
    const [type, setType] = useState<"EXPENSE" | "INCOME" | "">("");
    const [name, setName] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [convertedAmount, setConvertedAmount] = useState<string>("0");
    const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
    const [exchangeRate, setExchangeRate] = useState<string>("1");
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");
    const [selectedTagName, setSelectedTagName] = useState<string>("");
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
          setType(sub.type);
          setName(sub.name || "");

          const origCurrency = sub.originalCurrency || baseCurrency;
          setCurrency(origCurrency as CurrencyCode);

          const origAmount = sub.originalAmount || sub.amount;
          setAmount(origAmount.toString());

          setConvertedAmount(sub.amount.toString());

          const exRate = sub.exchangeValue || 1;
          setExchangeRate(exRate.toString());

          setStartDate(new Date(sub.startDate));
          setSelectedTagName(sub.tag?.name || "");
          setNotes(sub.notes || "");
          setAutoExchangeRate(sub.autoExchangeRate ?? true);

          // Subscription-specific fields
          setFrequencyInterval(sub.frequencyInterval || 1);
          setFrequencyType(sub.frequencyType || "MONTHLY");
          setDuration(sub.duration || "FOREVER");
          setDurationTimes(sub.durationTimes || 1);
          setDurationUntil(
            sub.durationUntil ? new Date(sub.durationUntil) : null,
          );
          setStatus(sub.status || "ACTIVE");
        } else {
          // --- CREATE MODE ---
          setEditingSubId(null);
          // Open neutral (no type preselected) — matches New Transaction; the
          // type is set as soon as the user enters an amount (sign-driven).
          setType("");
          setName("");
          setAmount("");
          setConvertedAmount("0");
          setCurrency(baseCurrency);
          setExchangeRate("1");
          setStartDate(initialDate || new Date());
          setSelectedTagName("");
          setNotes("");
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
      if (!amount || Number(amount) === 0)
        return triggerToast("Please enter a valid amount.", false);
      if (!selectedTagName)
        return triggerToast("Please select a category.", false);
      if (!type) return triggerToast("Please select income or expense.", false);

      setLoading(true);
      try {
        const finalName =
          name.trim().length > 0 ? name.trim() : selectedTagName;

        // Payload mapped to SubscriptionRequest.java
        const payload = {
          name: finalName,
          amount: Math.abs(Number(convertedAmount)),
          originalAmount: Math.abs(Number(amount)),
          type,
          originalCurrency: currency,
          exchangeValue: Number(exchangeRate) || 1,
          autoExchangeRate,
          tag: selectedTagName,
          notes,
          status,
          startDate: startDate
            .toLocaleDateString()
            .split("/")
            .reverse()
            .join("-"),
          frequencyType,
          frequencyInterval,
          duration,
          durationTimes: duration === "TIMES" ? durationTimes : null,
          durationUntil:
            duration === "UNTIL" && durationUntil
              ? durationUntil.toISOString().split("T")[0]
              : null,
        };

        if (editingSubId) {
          await api.put(`/subscription/${wallet.id}/${editingSubId}`, payload);
          triggerToast("Subscription updated successfully!", true);
        } else {
          await api.post(`/subscription/${wallet.id}`, payload);
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

    const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
    const canSave =
      amount !== "" &&
      Number(amount) !== 0 &&
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
            <AmountInput
              value={amount}
              type={type}
              setType={setType}
              currencySymbol={currencySymbol}
              autoFocus={!isEditing}
              onAmountChange={(val) => {
                setAmount(val);
                if (currency !== baseCurrency && exchangeRate)
                  setConvertedAmount(
                    (Number(val) * Number(exchangeRate)).toFixed(2),
                  );
                else setConvertedAmount(val);
              }}
            />
            <TransactionTypeToggle type={type} setType={setType} />
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
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Start Date
              </label>
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

          {/* 3. SCHEDULING RULES (Frequenza e Durata) */}
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
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Name
              </label>
              <Input
                type="text"
                placeholder="Name of the subscription (Optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Description
              </label>
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
            baseCurrency={baseCurrency}
            selectedCurrency={currency}
            onCurrencyChange={setCurrency}
            originalAmount={amount}
            onOriginalAmountChange={setAmount}
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            convertedAmount={convertedAmount}
            onConvertedAmountChange={setConvertedAmount}
          />
        </div>
      </ResponsiveOverlay>
    );
  },
);
