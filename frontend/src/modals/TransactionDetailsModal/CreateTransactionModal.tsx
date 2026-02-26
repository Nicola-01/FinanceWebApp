import React, {useState, useRef, useImperativeHandle, forwardRef} from 'react';
import api from '../../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCalendarAlt, faStickyNote, faRepeat, faMoneyBillTransfer, faTag} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from '../ModalDialog';
import {triggerToast} from '../../components/ToastNotification';
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';
import type {Tag} from "../../utils/types.ts";

// import {ExchangeRateSection} from './ExchangeRateSection.tsx';
import {HierarchicalTagSelector} from './HierarchicalTagSelector.tsx';
import {AmountInput} from "./AmountInput.tsx";

export interface CreateTransactionModalHandle {
    openModal: () => void;
}

interface Props {
    walletId: string;
    baseCurrency: CurrencyCode;
    walletColor: string; // <-- Aggiunto per il bottone dinamico
    onSuccess: () => void;
}

export const CreateTransactionModal = forwardRef<CreateTransactionModalHandle, Props>(
    ({walletId, baseCurrency, walletColor, onSuccess}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const amountRef = useRef<HTMLInputElement>(null)

        // --- Form States ---
        const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>('');
        const [name, setName] = useState('');
        const [amount, setAmount] = useState<string>('');
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
                setType('');
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

        // Gestione Intelligente dell'Importo
        // const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        //     const val = e.target.value;
        //
        //     // Se digita il "meno", lo convertiamo in positivo e passiamo a EXPENSE
        //     if (val.includes('-') || Number(val) < 0) {
        //         setType('EXPENSE');
        //         setAmount(Math.abs(Number(val)));
        //     } else {
        //         // Se è un numero positivo, impostiamo INCOME (se non è già Expense per scelta dell'utente)
        //         if (Number(val) > 0 && type !== 'EXPENSE') {
        //             setType('INCOME');
        //         }
        //         setAmount(val === '' ? '' : Number(val));
        //     }
        // };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            // Validazioni obbligatorie
            if (!amount || Number(amount) <= 0) return triggerToast("Please enter a valid amount.", false);
            if (!selectedTagName) return triggerToast("Please select a tag.", false);

            setLoading(true);
            try {
                // Se il nome è vuoto, usa il nome del Tag!
                const finalName = name.trim().length > 0 ? name.trim() : selectedTagName;

                const payload = {
                    name: finalName,
                    amount: Number(amount),
                    type,
                    transactionDate: date,
                    originalCurrency: currency,
                    exchangeValue: Number(exchangeRate),
                    tag: selectedTagName,
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

        const currencySymbol = CURRENCY_META[currency]?.symbol || currency;

        // Il bottone appare solo se i campi obbligatori ci sono
        const canSave = amount !== '' && Number(amount) > 0 && selectedTagName !== '';

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                <div className="text-center">

                    {/* Header Semplificato */}
                    <h3 className="mb-6 flex items-center justify-center gap-3 text-xl font-semibold text-white/60">
                        <FontAwesomeIcon icon={faMoneyBillTransfer}/>
                        New Transaction
                    </h3>

                    <form onSubmit={handleSubmit} className="text-left flex flex-col gap-6">

                        {/* 1. AREA IMPORTO GIGANTE */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <AmountInput
                                ref={amountRef}
                                type={type}
                                setType={setType}
                                currencySymbol={currencySymbol}
                            />

                            {/* Type Toggle Sub-menu */}
                            <div
                                className="mt-4 flex rounded-xl bg-black/40 p-1 border border-white/10 w-full max-w-[250px]">
                                <button
                                    type="button"
                                    onClick={() => setType('EXPENSE')}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'EXPENSE' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] shadow-sm' : 'text-white/40 hover:text-white'}`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('INCOME')}
                                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f] shadow-sm' : 'text-white/40 hover:text-white'}`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>

                        {/* 2. TAG E DATA (Griglia principale) */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <HierarchicalTagSelector
                                    tags={tags}
                                    selectedTagName={selectedTagName}
                                    onSelectTag={setSelectedTagName}
                                />
                            </div>
                            <div>
                                <label
                                    className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>
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

                        {/* 3. NOME (Opzionale) E NOTE */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                    <FontAwesomeIcon icon={faTag} className="mr-2"/>
                                    Name (Optional)
                                </label>
                                <input
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                    type="text"
                                    placeholder={selectedTagName || "e.g. Groceries"}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label
                                    className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                    <FontAwesomeIcon icon={faStickyNote} className="mr-2"/>
                                    Notes
                                </label>
                                <input
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                    type="text"
                                    placeholder="Any details..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 4. EXCHANGE RATE SECTION */}
                        {/*<ExchangeRateSection*/}
                        {/*    baseCurrency={baseCurrency}*/}
                        {/*    selectedCurrency={currency}*/}
                        {/*    onCurrencyChange={setCurrency}*/}
                        {/*    exchangeRate={exchangeRate}*/}
                        {/*    onExchangeRateChange={setExchangeRate}*/}
                        {/*    amount={amount}*/}
                        {/*/>*/}

                        {/* 5. RECURRING TOGGLE */}
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-all">
                            <div className="flex items-center justify-between cursor-pointer"
                                 onClick={() => setIsRecurring(!isRecurring)}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${isRecurring ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-white/5 text-white/40'}`}>
                                        <FontAwesomeIcon icon={faRepeat}/>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Recurring Payment</h4>
                                        <p className="text-xs text-white/50">Automate this transaction</p>
                                    </div>
                                </div>
                                <div
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isRecurring ? 'bg-[#00ff7f]' : 'bg-white/10'}`}>
                                    <div
                                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`}/>
                                </div>
                            </div>
                            {isRecurring && (
                                <div
                                    className="mt-4 rounded-lg border border-dashed border-[#00bfff]/30 bg-[#00bfff]/10 p-4 text-center animate-[fadeIn_0.2s_ease-out]">
                                    <span className="text-sm font-bold text-[#00bfff]">🚀 Recurring Payments feature is coming soon!</span>
                                </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                className="flex-1 rounded-xl bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10"
                                onClick={() => {
                                    if (dialogRef.current?.open) dialogRef.current.close()
                                }}
                            >
                                Cancel
                            </button>

                            {/* Appare solo se Tag e Importo sono compilati! */}
                            {canSave && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] rounded-xl py-4 font-bold text-black transition-all hover:-translate-y-1 animate-[fadeIn_0.3s_ease-out]"
                                    style={{
                                        backgroundColor: walletColor,
                                        boxShadow: `0 10px 20px -5px ${walletColor}66`
                                    }}
                                >
                                    {loading ? "Saving..." : "Save Transaction"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </ModalDialog>
        );
    }
);