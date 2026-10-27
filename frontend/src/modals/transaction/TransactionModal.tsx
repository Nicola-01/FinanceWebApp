import { forwardRef, useImperativeHandle, useState } from "react";
import * as walletOps from "../../api/walletOps";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import Button from "../../components/ui/Button.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import type { CurrencyCode } from "../../utils/currencies";
import type { Tag, Wallet, Transaction } from "../../types/domain.ts";

// Sub-components
import { TagPicker } from "./TagPicker.tsx";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { ExchangeRateSection } from "../common/exchangeRate/ExchangeRateSection.tsx";
import { TransactionTypeToggle } from "../../components/ui/TransactionTypeToggle.tsx";
import { TransactionMetadataInputs } from "./TransactionMetadataInputs.tsx";
import CustomDatePicker from "../../components/datePicker/CustomDatePicker.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { parseLocalIsoDate, toLocalIsoDate } from "../../utils/localDate";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { useAmountEntryForm } from "../common/useAmountEntryForm";

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
    // Full row kept while editing so we can read its updatedAt (offline
    // precondition for the queued update op).
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const form = useAmountEntryForm(baseCurrency);
    const { type, setType, name, setName, notes, setNotes } = form;
    const { selectedTagName, setSelectedTagName } = form;
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    useImperativeHandle(ref, () => ({
      openModal: (tx?: Transaction) => {
        setResetKey((prev) => prev + 1);

        if (tx) {
          // --- EDIT MODE ---
          setEditingTxId(tx.id);
          setEditingTx(tx);
          form.reset(tx);
          setDate(parseLocalIsoDate(tx.transactionDate));
        } else {
          // --- CREATE MODE ---
          setEditingTxId(null);
          setEditingTx(null);
          form.reset();
          setDate(new Date());
        }
        setOpen(true);
      },
    }));

    const handleSave = async () => {
      if (!form.hasAmount)
        return triggerToast("Please enter a valid amount.", false);
      if (!selectedTagName)
        return triggerToast("Please select a category.", false);

      setLoading(true);
      try {
        const payload = {
          ...form.buildBasePayload(),
          transactionDate: toLocalIsoDate(date),
        };

        if (editingTxId)
          await walletOps.updateTransaction(
            wallet.id,
            String(editingTxId),
            payload,
            editingTx?.updatedAt ?? null,
          );
        else await walletOps.createTransaction(wallet.id, payload);

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

    const canSave = form.hasAmount && selectedTagName !== "";
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
              value={form.amount}
              type={type}
              setType={setType}
              currencySymbol={form.currencySymbol}
              autoFocus={!isEditing}
              onAmountChange={form.handleAmountChange}
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
              <FieldLabel>Date</FieldLabel>
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
            {...form.exchangeRateProps}
          />
        </div>
      </ResponsiveOverlay>
    );
  },
);
