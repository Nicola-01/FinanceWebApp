import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from '../ModalDialog';
import { triggerToast } from '../../components/ToastNotification';
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';
import type { Tag, Wallet } from "../../utils/types.ts";

// Sub-components
import { HierarchicalTagSelector } from './HierarchicalTagSelector.tsx';
import { AmountInput } from "./AmountInput.tsx";
import { ExchangeRateSection } from "./ExchangeRateSection.tsx";
import { TransactionTypeToggle } from './TransactionTypeToggle.tsx';
import { TransactionMetadataInputs } from './TransactionMetadataInputs.tsx';
import { RecurringPaymentToggle } from './RecurringPaymentToggle.tsx';

export interface CreateTransactionModalHandle {
    openModal: () => void;
}

interface Props {
    wallet: Wallet;
    tags: Tag[];
    baseCurrency: CurrencyCode;
    onSuccess: () => void;
}

export const CreateTransactionModal = forwardRef<CreateTransactionModalHandle, Props>(
    ({ wallet, tags, baseCurrency, onSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // --- Form States ---
        const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>('');
        const [name, setName] = useState('');
        const [amount, setAmount] = useState<string>('');
        const [convertedAmount, setConvertedAmount] = useState<string>('0');
        const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
        const [exchangeRate, setExchangeRate] = useState<string>('1');
        const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
        const [notes, setNotes] = useState('');
        const [isRecurring, setIsRecurring] = useState(false);
        const [loading, setLoading] = useState(false);
        const [selectedTagName, setSelectedTagName] = useState<string>('');

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setType('');
                setName('');
                setAmount('');
                setConvertedAmount('0');
                setCurrency(baseCurrency);
                setExchangeRate('1');
                setDate(new Date().toISOString().split('T')[0]);
                setSelectedTagName('');
                setNotes('');
                setIsRecurring(false);
                dialogRef.current?.showModal();
            }
        }));

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (!amount || Number(amount) === 0) return triggerToast("Please enter a valid amount.", false);
            if (!selectedTagName) return triggerToast("Please select a category.", false);

            setLoading(true);
            try {
                const finalName = name.trim().length > 0 ? name.trim() : selectedTagName;

                const payload = {
                    name: finalName,
                    amount: Math.abs(Number(convertedAmount)),
                    originalAmount: Math.abs(Number(amount)),
                    type,
                    transactionDate: date,
                    originalCurrency: currency,
                    exchangeValue: Number(exchangeRate) || 1,
                    tag: selectedTagName,
                    notes,
                };

                await api.post(`/transactions/${wallet.id}`, payload);

                triggerToast("Transaction added successfully!", true);
                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error creating transaction", false);
            } finally {
                setLoading(false);
            }
        };

        const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
        const canSave = amount !== '' && Number(amount) !== 0 && selectedTagName !== '';

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                <div className="text-center">
                    {/* Header */}
                    <h3 className="mb-6 flex items-center justify-center gap-3 text-xl font-semibold text-white/60">
                        <FontAwesomeIcon icon={faMoneyBillTransfer} color={wallet.color} />
                        New Transaction
                    </h3>

                    <form onSubmit={handleSubmit} className="text-left flex flex-col gap-6">
                        {/* 1. AMOUNT AREA */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <AmountInput
                                value={amount}
                                type={type}
                                setType={setType}
                                currencySymbol={currencySymbol}
                                onAmountChange={(val) => {
                                    setAmount(val);
                                    if (currency !== baseCurrency && exchangeRate)
                                        setConvertedAmount((Number(val) * Number(exchangeRate)).toFixed(2));
                                    else
                                        setConvertedAmount(val);
                                }}
                            />
                            <TransactionTypeToggle type={type} setType={setType} />
                        </div>

                        {/* 2. TAGS & DATE */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <HierarchicalTagSelector
                                    tags={tags}
                                    selectedTagName={selectedTagName}
                                    onSelectTag={setSelectedTagName}
                                />
                            </div>
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                                    Date
                                </label>
                                <input
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f] [color-scheme:dark]"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* 3. NAME & NOTES (Full row, bigger textarea) */}
                        <TransactionMetadataInputs
                            name={name}
                            setName={setName}
                            notes={notes}
                            setNotes={setNotes}
                            selectedTagName={selectedTagName}
                        />

                        <hr className="my-2 border-white/10" />

                        {/* 4. EXCHANGE RATE */}
                        <ExchangeRateSection
                            mode="create"
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
                        <RecurringPaymentToggle
                            isRecurring={isRecurring}
                            setIsRecurring={setIsRecurring}
                        />

                        {/* ACTIONS */}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                className="flex-1 rounded-xl bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10"
                                onClick={() => { if (dialogRef.current?.open) dialogRef.current.close() }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={!canSave}
                                className="flex-1 rounded-xl py-4 font-bold text-black transition-all animate-[fadeIn_0.3s_ease-out] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                style={{
                                    backgroundColor: wallet.color,
                                    boxShadow: !canSave ? 'none' : `0 10px 20px -5px ${wallet.color}66`
                                }}
                            >
                                {loading ? "Saving..." : "Save Transaction"}
                            </button>
                        </div>
                    </form>
                </div>
            </ModalDialog>
        );
    }
);