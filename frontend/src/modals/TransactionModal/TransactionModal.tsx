import { forwardRef, useImperativeHandle, useState } from "react";
import api from "../../api/axiosConfig";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies";
import type { Tag, Wallet, Transaction } from "../../utils/types.ts";

// Sub-components
import { TagPicker } from "./TagPicker/TagPicker.tsx";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { ExchangeRateSection } from "./ExchangeRateSection.tsx";
import { TransactionTypeToggle } from "./TransactionTypeToggle.tsx";
import { TransactionMetadataInputs } from "./TransactionMetadataInputs.tsx";
import CustomDatePicker from "../../components/DataPicker/CustomDatePicker.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

export interface TransactionModalHandle {
  openModal: (tx?: Transaction) => void;
}

interface Props {
  wallet: Wallet;
  tags: Tag[];
  baseCurrency: CurrencyCode;
  onSuccess: () => void;
}

export const TransactionModal = forwardRef<TransactionModalHandle, Props>(
  ({ wallet, tags, baseCurrency, onSuccess }, ref) => {
    const [open, setOpen] = useState(false);

    // --- Form States ---
    const [editingTxId, setEditingTxId] = useState<number | string | null>(
      null,
    );
    const [type, setType] = useState<"EXPENSE" | "INCOME" | "">("");
    const [name, setName] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [convertedAmount, setConvertedAmount] = useState<string>("0");
    const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
    const [exchangeRate, setExchangeRate] = useState<string>("1");
    const [date, setDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedTagName, setSelectedTagName] = useState<string>("");
    const [resetKey, setResetKey] = useState(0);

    useImperativeHandle(ref, () => ({
      openModal: (tx?: Transaction) => {
        setResetKey((prev) => prev + 1);

        if (tx) {
          // --- EDIT MODE ---
          setEditingTxId(tx.id);
          setType(tx.type);
          setName(tx.name || "");

          const origCurrency = tx.originalCurrency || baseCurrency;
          setCurrency(origCurrency as CurrencyCode);

          const origAmount = tx.originalAmount || tx.amount;
          setAmount(origAmount.toString());

          setConvertedAmount(tx.amount.toString());

          const exRate = tx.exchangeValue || 1;
          setExchangeRate(exRate.toString());

          setDate(new Date(tx.transactionDate));
          setSelectedTagName(tx.tag.name);
          setNotes(tx.notes || "");
        } else {
          // --- CREATE MODE ---
          setEditingTxId(null);
          setType("");
          setName("");
          setAmount("");
          setConvertedAmount("0");
          setCurrency(baseCurrency);
          setExchangeRate("1");
          setDate(new Date());
          setSelectedTagName("");
          setNotes("");
        }
        setOpen(true);
      },
    }));

    const handleSave = async () => {
      if (!amount || Number(amount) === 0)
        return triggerToast("Please enter a valid amount.", false);
      if (!selectedTagName)
        return triggerToast("Please select a category.", false);

      setLoading(true);
      try {
        const finalName =
          name.trim().length > 0 ? name.trim() : selectedTagName;

        const payload = {
          name: finalName,
          amount: Math.abs(Number(convertedAmount)),
          originalAmount: Math.abs(Number(amount)),
          type,
          transactionDate: date
            .toLocaleDateString()
            .split("/")
            .reverse()
            .join("-"),
          originalCurrency: currency,
          exchangeValue: Number(exchangeRate) || 1,
          tag: selectedTagName,
          notes,
        };

        if (editingTxId)
          await api.put(`/transactions/${wallet.id}/${editingTxId}`, payload);
        else await api.post(`/transactions/${wallet.id}`, payload);

        onSuccess();
        setOpen(false);
      } catch (err: unknown) {
        const actionText = editingTxId ? "updating" : "creating";
        triggerToast(
          getApiErrorTitle(err, `Error ${actionText} transaction`),
          false,
        );
      } finally {
        setLoading(false);
      }
    };

    const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
    const canSave =
      amount !== "" && Number(amount) !== 0 && selectedTagName !== "";
    const isEditing = !!editingTxId;

    const footer = (
      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || loading}
        accentColor={wallet.color}
        ripple
        fullWidth
        size="lg"
        aria-label="Save transaction"
      >
        {loading ? "Saving…" : isEditing ? "Save changes" : "Add transaction"}
      </Button>
    );

    return (
      <ResponsiveOverlay
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "Edit Transaction" : "New Transaction"}
        accentColor={wallet.color}
        footer={footer}
      >
        <div
          id="transaction-form"
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

          {/* 2. TAGS & DATE */}
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
                Date
              </label>
              <CustomDatePicker
                isRange={false}
                color={wallet.color}
                initialPreset="custom"
                initialStartDate={date}
                onChange={(val) => {
                  if (val instanceof Date) setDate(val);
                }}
              />
            </div>
          </div>

          {/* 3. NAME & NOTES */}
          <TransactionMetadataInputs
            name={name}
            setName={setName}
            notes={notes}
            setNotes={setNotes}
            selectedTagName={selectedTagName}
            accentColor={wallet.color}
          />

          <hr className="my-2 border-app-border" />

          {/* 4. EXCHANGE RATE */}
          <ExchangeRateSection
            mode={isEditing ? "edit" : "create"}
            accentColor={wallet.color}
            walletId={wallet.id}
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

          {/* 5. RECURRING TOGGLE */}
          {/*{!isEditing && (*/}
          {/*    <RecurringPaymentToggle*/}
          {/*        isRecurring={isRecurring}*/}
          {/*        setIsRecurring={setIsRecurring}*/}
          {/*    />*/}
          {/*)}*/}
        </div>
      </ResponsiveOverlay>
    );
  },
);
