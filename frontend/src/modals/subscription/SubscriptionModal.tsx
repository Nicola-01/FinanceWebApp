import { forwardRef, useImperativeHandle, useState } from "react";
import api from "../../api/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faPause,
  faPlay,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies";
import type { Tag, Wallet, Subscription } from "../../utils/types";

// Sub-components riutilizzati dalle transazioni!
import CustomDatePicker from "../../components/DataPicker/CustomDatePicker";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { TransactionTypeToggle } from "../TransactionModal/TransactionTypeToggle";
import { TagPicker } from "../TransactionModal/TagPicker/TagPicker";
import { ExchangeRateSection } from "../TransactionModal/ExchangeRateSection";
import { Selector } from "../../components/ui/Selector.tsx";
import { CustomSelect } from "../../components/ui/CustomSelect.tsx";
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

    // --- States per Dati Generici ---
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

    // --- States per Scheduling e Durata (Specifici per Subscription) ---
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

          // Campi Subscription
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
          setType("EXPENSE");
          setName("");
          setAmount("");
          setConvertedAmount("0");
          setCurrency(baseCurrency);
          setExchangeRate("1");
          setStartDate(initialDate || new Date());
          setSelectedTagName("");
          setNotes("");

          // Reset Campi Subscription
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

        // Payload mappato su SubscriptionRequest.java
        const payload = {
          name: finalName,
          amount: Math.abs(Number(convertedAmount)),
          originalAmount: Math.abs(Number(amount)),
          type,
          originalCurrency: currency,
          exchangeValue: Number(exchangeRate) || 1,
          autoExchangeRate: true,
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

    // Save control shown in the overlay header.
    const headerActions = (
      <button
        type="button"
        onClick={() => {
          if (canSave && !loading) handleSave();
        }}
        disabled={!canSave || loading}
        aria-label="Save subscription"
        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-app-input disabled:cursor-not-allowed disabled:opacity-40"
        style={{ color: canSave ? wallet.color : undefined }}
      >
        <FontAwesomeIcon icon={faCheck} className="text-lg" />
      </button>
    );

    return (
      <ResponsiveOverlay
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "Edit Subscription" : "New Subscription"}
        accentColor={wallet.color}
        width={480}
        headerActions={headerActions}
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
          <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-sm font-bold theme-text-default">
              Scheduling Rules
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Repeat Every */}
              <div>
                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                  Repeat Every
                </label>
                <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner focus-within:theme-border-focus transition-colors h-12">
                  <input
                    type="number"
                    min="1"
                    value={frequencyInterval}
                    onChange={(e) =>
                      setFrequencyInterval(Number(e.target.value) || 1)
                    }
                    className="w-1/2 bg-transparent px-3 py-2 text-app-text font-bold focus:outline-none text-center border-r border-app-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <CustomSelect
                    value={frequencyType}
                    onChange={(val) =>
                      setFrequencyType(
                        val as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
                      )
                    }
                    className="w-1/2 bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer"
                    activeColor={wallet.color}
                    options={[
                      { value: "DAILY", label: "Days" },
                      { value: "WEEKLY", label: "Weeks" },
                      { value: "MONTHLY", label: "Months" },
                      { value: "YEARLY", label: "Years" },
                    ]}
                  />
                </div>
              </div>

              {/* Ends */}
              <div>
                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                  Ends
                </label>
                <div className="flex bg-app-input border border-app-border rounded-xl shadow-inner focus-within:theme-border-focus transition-colors h-12">
                  <CustomSelect
                    value={duration}
                    onChange={(val) =>
                      setDuration(val as "FOREVER" | "TIMES" | "UNTIL")
                    }
                    className={`${duration === "FOREVER" ? "w-full" : "w-1/2 border-r border-app-border"} bg-transparent px-3 py-2 text-sm font-bold text-app-text cursor-pointer`}
                    activeColor={wallet.color}
                    options={[
                      { value: "FOREVER", label: "Never" },
                      { value: "TIMES", label: "After times" },
                      { value: "UNTIL", label: "On date" },
                    ]}
                  />

                  {duration === "TIMES" && (
                    <input
                      type="number"
                      min="1"
                      value={durationTimes}
                      onChange={(e) =>
                        setDurationTimes(Number(e.target.value) || 1)
                      }
                      className="w-1/2 bg-transparent px-3 py-2 text-app-text font-bold focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}

                  {duration === "UNTIL" && (
                    <div className="w-1/2 relative flex">
                      <CustomDatePicker
                        isRange={false}
                        color={wallet.color}
                        initialPreset="custom"
                        initialStartDate={durationUntil || new Date()}
                        onChange={(val) => {
                          if (val instanceof Date) setDurationUntil(val);
                        }}
                        triggerClassName="w-full h-full border-0 bg-transparent shadow-none px-3 py-2 text-app-text font-bold focus:outline-none"
                        dropdownAlign="right"
                        dropdownPosition="top"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Status
              </label>
              <Selector
                value={status}
                onChange={(val) => setStatus(val)}
                size="md"
                options={[
                  {
                    value: "PAUSED",
                    label: "Paused",
                    icon: <FontAwesomeIcon icon={faPause} />,
                    activeColorClass: "theme-text-warning",
                  },
                  {
                    value: "ACTIVE",
                    label: "Active",
                    icon: <FontAwesomeIcon icon={faPlay} />,
                    activeColorClass: "text-app-sky",
                  },
                  {
                    value: "COMPLETED",
                    label: "Completed",
                    icon: <FontAwesomeIcon icon={faCheckDouble} />,
                    activeColorClass: "theme-text-success",
                  },
                ]}
              />
            </div>
          </div>

          {/* 4. NAME & NOTES */}
          {/*<TransactionMetadataInputs*/}
          {/*    name={name}*/}
          {/*    setName={setName}*/}
          {/*    notes={notes}*/}
          {/*    setNotes={setNotes}*/}
          {/*    selectedTagName={selectedTagName}*/}
          {/*/>*/}

          <hr className="my-2 border-app-border" />

          {/* 5. EXCHANGE RATE */}
          <ExchangeRateSection
            mode={isEditing ? "edit" : "create"}
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
