import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faStickyNote, faRepeat, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from '..//ModalDialog';
import { triggerToast } from '../../components/ToastNotification';
import type { CurrencyCode } from '../../utils/currencies';
import type { Tag } from "../../utils/types.ts";

// Import the new components
import { ExchangeRateSection } from './ExchangeRateSection.tsx';
import { HierarchicalTagSelector } from './HierarchicalTagSelector.tsx';

export interface CreateTransactionModalHandle {
    openModal: () => void;
}

interface Props {
    walletId: string;
    baseCurrency: CurrencyCode;
    onSuccess: () => void;
}

export const CreateTransactionModal = forwardRef<CreateTransactionModalHandle, Props>(
    ({ walletId, baseCurrency, onSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // --- Form States ---
        const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
        const [name, setName] = useState('');
        const [amount, setAmount] = useState<number | ''>('');
        const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
        const [exchangeRate, setExchangeRate] = useState<number | ''>(1);
        const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
        const [notes, setNotes] = useState('');
        const [isRecurring, setIsRecurring] = useState(false);
        const [loading, setLoading] = useState(false);

        // Tags States
        const [tags, setTags] = useState<Tag[]>([]);
        const [selectedTagName, setSelectedTagName] = useState<string>('');

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setType('EXPENSE');
                setName('');
                setAmount('');
                setCurrency(baseCurrency);
                setExchangeRate(1);
                setDate(new Date().toISOString().split('T')[0]);
                setSelectedTagName('');
                setNotes('');
                setIsRecurring(false);

                fetchTags();
                dialogRef.current?.showModal();
            }
        }));

        const fetchTags = async () => {
            try {
                const response = await api.get(`/tags/${walletId}`);
                setTags(response.data);
            } catch (err) {
                triggerToast("Failed to load tags", false);
            }
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (name.trim().length < 3) return triggerToast("Name must be at least 3 characters.", false);
            if (!amount || Number(amount) <= 0) return triggerToast("Please enter a valid amount.", false);
            if (!exchangeRate || Number(exchangeRate) <= 0) return triggerToast("Please enter a valid exchange rate.", false);
            if (!selectedTagName) return triggerToast("Please select a tag.", false);

            setLoading(true);
            try {
                const payload = {
                    name,
                    amount: Number(amount),
                    type,
                    transactionDate: date,
                    originalCurrency: currency,
                    exchangeValue: Number(exchangeRate),
                    tag: selectedTagName, // Assuming backend now expects ID, not name, for better integrity
                    notes,
                };

                await api.post(`/transactions/${walletId}`, payload);

                triggerToast("Transaction added successfully!", true);
                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error creating transaction", false);
            } finally {
                setLoading(false);
            }
        };

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                <div className="text-center">
                    <h3 className="mb-2 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                        <FontAwesomeIcon icon={faMoneyBillTransfer} className="text-[#00ff7f]" />
                        New Transaction
                    </h3>
                    <p className="mb-6 text-sm text-white/60">Log a new income or expense for your wallet.</p>

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">

                        {/* 1. Type Toggle */}
                        <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                            {/* ... (Keep existing Type Toggle buttons) ... */}
                            <button
                                type="button"
                                onClick={() => setType('EXPENSE')}
                                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${type === 'EXPENSE' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] shadow-sm' : 'text-white/40 hover:text-white'}`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('INCOME')}
                                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f] shadow-sm' : 'text-white/40 hover:text-white'}`}
                            >
                                Income
                            </button>
                        </div>

                        {/* 2. Amount and Name */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* ... (Keep existing Name input) ... */}
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Name *</label>
                                <input
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                    type="text"
                                    placeholder="e.g. Groceries"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Amount *</label>
                                <div className="relative">
                                    <input
                                        // Aggiunte qui le classi per nascondere le frecce!
                                        className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-white outline-none transition-all focus:border-[#00ff7f] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value) || '')}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40 pointer-events-none">
                                        {currency === baseCurrency ? baseCurrency : currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. NEW: Exchange Rate Section */}
                        <ExchangeRateSection
                            baseCurrency={baseCurrency}
                            selectedCurrency={currency}
                            onCurrencyChange={setCurrency}
                            exchangeRate={exchangeRate}
                            onExchangeRateChange={setExchangeRate}
                            amount={amount}
                        />

                        {/* 4. Date and NEW Hierarchical Tag */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                            {/* Use the new Component */}
                            <div>
                                <HierarchicalTagSelector
                                    tags={tags}
                                    selectedTagName={selectedTagName}
                                    onSelectTag={setSelectedTagName}
                                />
                            </div>
                        </div>

                        {/* 5. Notes */}
                        {/* ... (Keep existing Notes textarea) ... */}
                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                <FontAwesomeIcon icon={faStickyNote} className="mr-2" />
                                Notes (Optional)
                            </label>
                            <textarea
                                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none transition-all focus:border-[#00ff7f] min-h-[80px]"
                                placeholder="Add any details here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* 6. Recurring Toggle */}
                        {/* ... (Keep existing Recurring toggle logic) ... */}
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-all">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isRecurring ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-white/5 text-white/40'}`}>
                                        <FontAwesomeIcon icon={faRepeat} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Recurring Payment</h4>
                                        <p className="text-xs text-white/50">Automate this transaction</p>
                                    </div>
                                </div>
                                <div className={`relative w-12 h-6 rounded-full transition-colors ${isRecurring ? 'bg-[#00ff7f]' : 'bg-white/10'}`}>
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`} />
                                </div>
                            </div>

                            {isRecurring && (
                                <div className="mt-4 rounded-lg border border-dashed border-[#00bfff]/30 bg-[#00bfff]/10 p-4 text-center animate-[fadeIn_0.2s_ease-out]">
                                    <span className="text-sm font-bold text-[#00bfff]">🚀 Recurring Payments feature is coming soon!</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                className="w-1/3 rounded-xl bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                                onClick={() => { if (dialogRef.current?.open) dialogRef.current.close() }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-2/3 rounded-xl py-3 font-bold text-black shadow-lg transition-all hover:-translate-y-0.5 
                                    ${type === 'INCOME' ? 'bg-[#00ff7f] shadow-[#00ff7f]/20 hover:bg-[#00e673]' : 'bg-[#ff4d4d] shadow-[#ff4d4d]/20 hover:bg-[#e60000] text-white'}`}
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