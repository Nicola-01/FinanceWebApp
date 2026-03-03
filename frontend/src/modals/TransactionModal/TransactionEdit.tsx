import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCalendarAlt,
    faEdit,
    faExchangeAlt, faHashtag,
    faSave,
    faStickyNote,
    faTag,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import { triggerToast } from '../../components/ToastNotification';
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';
import type { Tag, Transaction, Wallet } from "../../utils/types.ts";
import { HierarchicalTagSelector } from './HierarchicalTagSelector.tsx';
import { AmountInput } from "./AmountInput.tsx";

interface TransactionEditProps {
    tx: Transaction;
    wallet: Wallet;
    tags: Tag[];
    onCancel: () => void;
    onUpdateSuccess: () => void;
}

export const TransactionEdit: React.FC<TransactionEditProps> = ({
                                                                    tx, wallet, tags, onCancel, onUpdateSuccess
                                                                }) => {
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>(tx.type);
    const [name, setName] = useState(tx.name || '');
    const [amount, setAmount] = useState<string>(tx.amount.toString());
    const [date, setDate] = useState(tx.transactionDate.split('T')[0]);
    const [notes, setNotes] = useState(tx.notes || '');
    const [selectedTagName, setSelectedTagName] = useState<string>(tx.tag.name);

    const isForeignCurrency = (tx as any).originalCurrency && (tx as any).originalCurrency !== wallet.currency;
    // @ts-ignore
    const [currency, setCurrency] = useState<CurrencyCode>((tx as any).originalCurrency || wallet.currency);
    const [originalAmountInput, setOriginalAmountInput] = useState<string>((tx as any).originalAmount?.toFixed(2) || '');
    const [exchangeRateInput, setExchangeRateInput] = useState<string>((tx as any).exchangeValue?.toFixed(6).replace(/\.?0+$/, '') || '1');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return triggerToast("Please enter a valid amount.", false);
        if (!selectedTagName) return triggerToast("Please select a tag.", false);

        setLoading(true);
        try {
            const finalName = name.trim().length > 0 ? name.trim() : selectedTagName;

            const numericAmount = Math.abs(Number(amount));
            const numericOriginalAmount = isForeignCurrency ? (Number(originalAmountInput) || numericAmount) : numericAmount;
            const numericExchangeRate = isForeignCurrency ? (Number(exchangeRateInput) || 1) : 1;

            const payload = {
                name: finalName,
                amount: numericAmount,
                originalAmount: numericOriginalAmount,
                type,
                transactionDate: date,
                originalCurrency: currency,
                exchangeValue: numericExchangeRate,
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

    const handleForeignCurrencyChange = (newOriginal: string, newRate: string) => {
        setOriginalAmountInput(newOriginal);
        setExchangeRateInput(newRate);
        if (newOriginal && newRate) {
            const newTotal = (Number(newOriginal) * Number(newRate)).toFixed(2);
            setAmount(newTotal);
        }
    };

    // Funziona per il main input gigante o per l'input convertito a destra!
    const handleMainAmountChange = (newAmount: string) => {
        setAmount(newAmount);
        if (isForeignCurrency && originalAmountInput && Number(originalAmountInput) > 0) {
            const newRate = Number(newAmount) / Number(originalAmountInput);
            setExchangeRateInput(newRate.toFixed(6).replace(/\.?0+$/, ''));
        }
    };

    // Una classe condivisa per pulire tutti gli input type="number"
    const hideArrowsClass = "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

    return (
        <form onSubmit={handleUpdate} className="flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">

            <div className="flex w-full items-center justify-between -mb-2">
                <button type="button" onClick={onCancel} className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    Cancel
                </button>

                <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50" style={{ backgroundColor: wallet.color, color: '#000000', boxShadow: `0 5px 15px -5px ${wallet.color}cc` }}>
                    <FontAwesomeIcon icon={faSave} />
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>

            <div className="text-center mt-2 group relative rounded-2xl p-4 border border-transparent focus-within:border-white/10 focus-within:bg-black/20 transition-all">
                <div className="absolute top-2 right-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <FontAwesomeIcon icon={faEdit} className="text-[#00ff7f]/50" />
                </div>
                <AmountInput
                    value={amount}
                    placeholder={tx.amount.toFixed(2)}
                    type={type}
                    setType={setType}
                    currencySymbol={CURRENCY_META[wallet.currency as CurrencyCode]?.symbol || wallet.currency}
                    onAmountChange={handleMainAmountChange}
                    autoFocus={false}
                />
            </div>

            <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-left flex flex-col gap-2">

                <div className="flex justify-between items-center group">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        <FontAwesomeIcon icon={faHashtag} className="mr-2"/>Category
                    </span>
                    <HierarchicalTagSelector tags={tags} selectedTagName={selectedTagName} onSelectTag={setSelectedTagName} showLabel={false}/>
                </div>

                <hr className="my-2 border-white/10"/>

                <div className="flex justify-between items-center group">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider shrink-0">
                        <FontAwesomeIcon icon={faTag} className="mr-2"/>Name
                    </span>
                    <div className="flex items-center gap-2 flex-1 justify-end border-b border-transparent focus-within:border-[#00ff7f]/50 transition-colors pb-1">
                        <input
                            type="text"
                            className="bg-transparent text-right text-white font-medium outline-none w-full placeholder-white/20"
                            placeholder={tx.name || tx.tag.name}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faEdit} className="text-white/10 group-focus-within:text-[#00ff7f]" />
                    </div>
                </div>

                <hr className="my-2 border-white/10"/>

                <div className="flex justify-between items-center group">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>Date
                    </span>
                    <div className="flex items-center gap-2 border-b border-transparent focus-within:border-[#00ff7f]/50 transition-colors pb-1">
                        <input
                            type="date"
                            className="bg-transparent text-right text-white font-medium outline-none [color-scheme:dark]"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <FontAwesomeIcon icon={faEdit} className="text-white/10 group-focus-within:text-[#00ff7f]" />
                    </div>
                </div>

                <hr className="my-2 border-white/10"/>

                <div className="flex flex-col gap-2 group">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        <FontAwesomeIcon icon={faStickyNote} className="mr-2"/>Notes
                    </span>
                    <div className="relative">
                        <textarea
                            className="w-full text-white/80 text-sm bg-white/5 p-3 pr-8 rounded-lg border border-white/5 outline-none focus:border-[#00ff7f]/50 transition-colors placeholder-white/20 min-h-[60px]"
                            placeholder={tx.notes || "Add some notes..."}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faEdit} className="absolute right-3 top-3 text-white/10 group-focus-within:text-[#00ff7f]" />
                    </div>
                </div>

                {isForeignCurrency && (
                    <>
                        <hr className="my-2 border-white/10"/>
                        <div className="flex flex-col gap-3">
                            <span className="text-[#00bfff]/70 text-xs font-bold uppercase tracking-wider">
                                <FontAwesomeIcon icon={faExchangeAlt} className="mr-2"/>
                                Currency Exchange (TO FIX)
                                {/*TODO da sistemare la modifica*/}
                            </span>

                            <div className="flex items-center justify-between rounded-xl bg-[#00bfff]/5 p-4 border border-[#00bfff]/20">
                                {/* Importo Originale (Input) */}
                                <div className="flex flex-col items-center flex-1 group">
                                    <div className="flex items-center border-b border-transparent focus-within:border-[#00bfff]/50 transition-colors">
                                        <input
                                            type="number" step="0.01" min="0"
                                            className={`w-[80px] bg-transparent text-center text-base font-bold font-app-mono text-white outline-none placeholder-white/20 ${hideArrowsClass}`}
                                            placeholder={(tx as any).originalAmount?.toFixed(2)}
                                            value={originalAmountInput}
                                            onChange={(e) => handleForeignCurrencyChange(e.target.value, exchangeRateInput)}
                                        />
                                        <FontAwesomeIcon icon={faEdit} className="text-[#00bfff]/30 text-[10px] ml-1 opacity-0 group-focus-within:opacity-100" />
                                    </div>
                                    <span className="text-[10px] text-[#00bfff]/70 font-bold uppercase tracking-wider mt-1">
                                        {CURRENCY_META[currency as CurrencyCode]?.symbol || currency}
                                    </span>
                                </div>

                                {/* Freccia e Tasso di Cambio (Input) */}
                                <div className="flex flex-col items-center justify-center flex-[1.5] px-2 group">
                                    <div className="flex items-center text-[10px] font-bold text-[#00bfff]/70 mb-1 whitespace-nowrap border-b border-transparent focus-within:border-[#00bfff]/50 transition-colors">
                                        <span>1 {currency} = </span>
                                        <input
                                            type="number" step="0.000001" min="0"
                                            className={`w-[65px] bg-transparent text-center outline-none mx-1 text-white placeholder-white/20 ${hideArrowsClass}`}
                                            placeholder={(tx as any).exchangeValue?.toFixed(6)}
                                            value={exchangeRateInput}
                                            onChange={(e) => handleForeignCurrencyChange(originalAmountInput, e.target.value)}
                                        />
                                        <span>{wallet.currency}</span>
                                        <FontAwesomeIcon icon={faEdit} className="text-[#00bfff]/30 ml-1 opacity-0 group-focus-within:opacity-100" />
                                    </div>
                                    <div className="flex w-full items-center">
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                        <FontAwesomeIcon icon={faArrowRight} className="text-[#00bfff]/50 px-2 text-xs" />
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                    </div>
                                </div>

                                {/* Importo Convertito a Destra (ORA EDITABILE) */}
                                <div className="flex flex-col items-center flex-1 group">
                                    <div className="flex items-center border-b border-transparent focus-within:border-[#00bfff]/50 transition-colors">
                                        <input
                                            type="number" step="0.01" min="0"
                                            className={`w-[80px] bg-transparent text-center text-base font-bold font-app-mono text-[#00bfff] outline-none placeholder-[#00bfff]/50 ${hideArrowsClass}`}
                                            placeholder={tx.amount.toFixed(2)}
                                            value={amount}
                                            onChange={(e) => handleMainAmountChange(e.target.value)}
                                        />
                                        <FontAwesomeIcon icon={faEdit} className="text-[#00bfff]/30 text-[10px] ml-1 opacity-0 group-focus-within:opacity-100" />
                                    </div>
                                    <span className="text-[10px] text-[#00bfff]/70 font-bold uppercase tracking-wider mt-1">
                                        {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol || wallet.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </form>
    );
};