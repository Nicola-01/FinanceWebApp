import React, {useState} from 'react';
import api from '../../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowLeft, faCalendarAlt, faStickyNote, faTag} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../../components/ToastNotification';
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';
import type {Tag, Transaction, Wallet} from "../../utils/types.ts";

import {HierarchicalTagSelector} from './HierarchicalTagSelector.tsx';
import {AmountInput} from "./AmountInput.tsx";
import {ExchangeRateSection} from "./ExchangeRateSection.tsx";

interface TransactionEditProps {
    tx: Transaction;
    wallet: Wallet;
    tags: Tag[];
    onCancel: () => void;
    onUpdateSuccess: () => void;
}

export const TransactionEdit: React.FC<TransactionEditProps> = ({
                                                                    tx,
                                                                    wallet,
                                                                    tags,
                                                                    onCancel,
                                                                    onUpdateSuccess
                                                                }) => {
    const [loading, setLoading] = useState(false);

    // Inizializza gli stati direttamente dai dati della transazione
    const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>(tx.type);
    const [name, setName] = useState(tx.name);
    const [amount, setAmount] = useState<string>(tx.amount.toString());
    const [currency, setCurrency] = useState<CurrencyCode>((tx as any).originalCurrency || wallet.currency);
    const [exchangeRate, setExchangeRate] = useState<number | ''>((tx as any).exchangeValue || 1);
    const [date, setDate] = useState(tx.transactionDate.split('T')[0]);
    const [notes, setNotes] = useState(tx.notes || '');
    const [selectedTagName, setSelectedTagName] = useState<string>(tx.tag.name);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return triggerToast("Please enter a valid amount.", false);
        if (!selectedTagName) return triggerToast("Please select a tag.", false);

        setLoading(true);
        try {
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

            await api.put(`/transactions/${wallet.id}/${tx.id}`, payload);
            triggerToast("Transaction updated successfully!", true);
            onUpdateSuccess();
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating transaction", false);
        } finally {
            setLoading(false);
        }
    };

    const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
    const canSave = amount !== '' && Number(amount) > 0 && selectedTagName !== '';

    return (
        <div className="text-center animate-[fadeIn_0.2s_ease-out]">
            <h3 className="mb-6 flex items-center justify-between text-xl font-semibold text-white/60">
                <button type="button" onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faArrowLeft}/>
                </button>
                <span>Edit Transaction</span>
                <div className="w-5"/>
                {/* Spaziatore per centrare */}
            </h3>

            <form onSubmit={handleUpdate} className="text-left flex flex-col gap-6">
                <div className="flex flex-col items-center justify-center py-4">
                    <AmountInput
                        value={amount}
                        type={type}
                        setType={setType}
                        currencySymbol={currencySymbol}
                        onAmountChange={(val) => setAmount(val)}
                    />
                    <div className="mt-4 flex rounded-xl bg-black/40 p-1 border border-white/10 w-full max-w-[250px]">
                        <button type="button" onClick={() => setType('EXPENSE')}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'EXPENSE' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] shadow-sm' : 'text-white/40 hover:text-white'}`}>Expense
                        </button>
                        <button type="button" onClick={() => setType('INCOME')}
                                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f] shadow-sm' : 'text-white/40 hover:text-white'}`}>Income
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <HierarchicalTagSelector tags={tags} selectedTagName={selectedTagName}
                                                 onSelectTag={setSelectedTagName}/>
                    </div>
                    <div>
                        <label
                            className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon
                            icon={faCalendarAlt} className="mr-2"/>Date</label>
                        <input
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f] [color-scheme:dark]"
                            type="date" value={date} onChange={(e) => setDate(e.target.value)} required/>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon
                            icon={faTag} className="mr-2"/>Name</label>
                        <input
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                            type="text" placeholder={selectedTagName || "e.g. Groceries"} value={name}
                            onChange={(e) => setName(e.target.value)}/>
                    </div>
                    <div>
                        <label
                            className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon
                            icon={faStickyNote} className="mr-2"/>Notes</label>
                        <input
                            className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                            type="text" placeholder="Any details..." value={notes}
                            onChange={(e) => setNotes(e.target.value)}/>
                    </div>
                </div>

                <hr className="my-2 border-white/10"/>

                <ExchangeRateSection
                    baseCurrency={wallet.currency as CurrencyCode}
                    selectedCurrency={currency}
                    onCurrencyChange={setCurrency}
                    exchangeRate={exchangeRate}
                    onExchangeRateChange={setExchangeRate}
                    amount={Number(amount)}
                    onConvertedAmountChange={(amount) => setAmount(amount.toString())}
                />

                <div className="flex gap-4 pt-2">
                    <button type="button" onClick={onCancel}
                            className="flex-1 rounded-xl bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10">
                        Cancel
                    </button>
                    <button type="submit" disabled={!canSave}
                            className="flex-1 rounded-xl py-4 font-bold text-black transition-all hover:-translate-y-1 disabled:opacity-50"
                            style={{
                                backgroundColor: wallet.color,
                                boxShadow: !canSave ? 'none' : `0 10px 20px -5px ${wallet.color}66`
                            }}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};