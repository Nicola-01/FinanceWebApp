import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRightArrowLeft, faTags, faCalendarAlt,
    faStickyNote, faRepeat, faMoneyBillTransfer
} from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import { CurrencySelector } from '../components/CurrencySelector';
import type { CurrencyCode } from '../utils/currencies';
import type { Tag } from "../utils/types.ts";

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

        // Tasso di cambio reso editabile (può essere vuoto temporaneamente durante la digitazione)
        const [exchangeRate, setExchangeRate] = useState<number | ''>(1);

        // Date (Default to today: YYYY-MM-DD)
        const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

        // Tags
        const [tags, setTags] = useState<Tag[]>([]);
        const [selectedTag, setSelectedTag] = useState<string>('');
        const [customTagName, setCustomTagName] = useState('');

        // Extra features
        const [notes, setNotes] = useState('');
        const [isRecurring, setIsRecurring] = useState(false);
        const [loading, setLoading] = useState(false);

        // --- Expose openModal to parent ---
        useImperativeHandle(ref, () => ({
            openModal: () => {
                setType('EXPENSE');
                setName('');
                setAmount('');
                setCurrency(baseCurrency);
                setExchangeRate(1);
                setDate(new Date().toISOString().split('T')[0]);
                setSelectedTag('');
                setCustomTagName('');
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
                if (response.data.length > 0) {
                    setSelectedTag(response.data[0].name);
                }
            } catch (err) {
                triggerToast("Failed to load tags", false);
            }
        };

        // --- CHIAMATA API FRANKFURTER PER IL CAMBIO ---
        useEffect(() => {
            const fetchExchangeRate = async () => {
                if (currency === baseCurrency) {
                    setExchangeRate(1);
                    return;
                }
                try {
                    // Chiamata all'API pubblica. Usa symbols=baseCurrency per farsi restituire esattamente il tasso verso la valuta del wallet
                    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=${baseCurrency}`);
                    const data = await response.json();

                    if (data && data.rates && data.rates[baseCurrency]) {
                        // Imposta il valore di default appena trovato!
                        setExchangeRate(data.rates[baseCurrency]);
                    } else {
                        triggerToast("Could not retrieve exchange rate.", false);
                    }
                } catch (error) {
                    console.error("Frankfurter API Error:", error);
                    triggerToast("Error fetching exchange rate.", false);
                }
            };

            fetchExchangeRate();
        }, [currency, baseCurrency]);

        // --- Submit Handler ---
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (name.trim().length < 3) return triggerToast("Name must be at least 3 characters.", false);
            if (!amount || Number(amount) <= 0) return triggerToast("Please enter a valid amount.", false);
            if (!exchangeRate || Number(exchangeRate) <= 0) return triggerToast("Please enter a valid exchange rate.", false);
            if (selectedTag === 'ADD_CUSTOM' && customTagName.trim().length < 2) return triggerToast("Invalid custom tag name.", false);

            setLoading(true);
            try {
                const payload = {
                    name,
                    amount: Number(amount),
                    type,
                    transactionDate: date,
                    originalCurrency: currency,
                    exchangeValue: Number(exchangeRate), // Inviamo il tasso (modificato o meno) al backend
                    tag: selectedTag === 'ADD_CUSTOM' ? { name: customTagName } : { name: selectedTag },
                    notes,
                };

                await api.post(`/transactions/${walletId}`, payload);

                triggerToast("Transaction added successfully!", true);
                onSuccess();
                dialogRef.current?.close();
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
                                        className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-white outline-none transition-all focus:border-[#00ff7f]"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value) || '')}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">
                                        {currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Currency and Exchange Rate (Editabile) */}
                        <div className={`grid grid-cols-1 gap-4 ${currency !== baseCurrency ? 'sm:grid-cols-2' : ''}`}>
                            <div>
                                <CurrencySelector value={currency} onChange={setCurrency} />
                            </div>

                            {currency !== baseCurrency && (
                                <div className="animate-[fadeIn_0.2s_ease-out]">
                                    <label className="mb-2 ml-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#00bfff]">
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                                        Rate (1 {currency} = ?)
                                    </label>
                                    <div className="relative">
                                        <input
                                            className="h-[48px] w-full rounded-xl border border-[#00bfff]/30 bg-[#00bfff]/5 px-4 text-white outline-none transition-all focus:border-[#00bfff]"
                                            type="number"
                                            step="0.000001" // Permette molta precisione per i tassi
                                            min="0.000001"
                                            value={exchangeRate}
                                            onChange={(e) => setExchangeRate(e.target.value ? Number(e.target.value) : '')}
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00bfff]/50">
                                            {baseCurrency}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Date and Tag */}
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
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                    <FontAwesomeIcon icon={faTags} className="mr-2" />
                                    Tag
                                </label>
                                <select
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-white outline-none transition-all focus:border-[#00ff7f] appearance-none"
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                >
                                    <option value="" disabled>Select a tag</option>
                                    {tags.map((t) => (
                                        <option key={t.name} value={t.name}>{t.name}</option>
                                    ))}
                                    <option value="ADD_CUSTOM" className="text-[#00ff7f] font-bold">+ Add Custom Tag</option>
                                </select>
                            </div>
                        </div>

                        {selectedTag === 'ADD_CUSTOM' && (
                            <div className="animate-[fadeIn_0.2s_ease-out]">
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Custom Tag Name</label>
                                <input
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                    type="text"
                                    placeholder="Enter new tag name..."
                                    value={customTagName}
                                    onChange={(e) => setCustomTagName(e.target.value)}
                                />
                            </div>
                        )}

                        {/* 5. Notes */}
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
                                onClick={() => dialogRef.current?.close()}
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