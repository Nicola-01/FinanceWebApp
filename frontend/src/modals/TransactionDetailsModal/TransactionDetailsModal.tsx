import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import api from '../../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCalendarAlt,
    faEdit,
    faExchangeAlt,
    faRepeat,
    faStickyNote,
    faTag,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from '../ModalDialog';
import {triggerToast} from '../../components/ToastNotification';
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';
import type {Tag, Transaction} from "../../utils/types.ts";
import {type IconKey, ICONS} from "../../utils/icons.ts";

import {HierarchicalTagSelector} from './HierarchicalTagSelector.tsx';
import {AmountInput} from "./AmountInput.tsx";
import {ExchangeRateSection} from "./ExchangeRateSection.tsx";

export interface TransactionDetailsModalHandle {
    openModal: (transaction: Transaction) => void;
}

interface Props {
    walletId: string;
    baseCurrency: CurrencyCode;
    walletColor: string;
    onSuccess: () => void;
    tags: Tag[]
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({ walletId, baseCurrency, walletColor, onSuccess, tags }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // Stato principale
        const [tx, setTx] = useState<Transaction | null>(null);
        const [isEditing, setIsEditing] = useState(false);
        const [loading, setLoading] = useState(false);

        // Stati del Form (Modifica)
        const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>('');
        const [name, setName] = useState('');
        const [amount, setAmount] = useState<string>('');
        const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
        const [exchangeRate, setExchangeRate] = useState<number | ''>(1);
        const [date, setDate] = useState('');
        const [notes, setNotes] = useState('');
        const [selectedTagName, setSelectedTagName] = useState<string>('');

        useImperativeHandle(ref, () => ({
            openModal: (transaction: Transaction) => {
                setTx(transaction);
                setIsEditing(false);
                dialogRef.current?.showModal();
            }
        }));


        // Inizializza il form quando si passa in modalità "Modifica"
        const handleStartEdit = () => {
            if (!tx) return;
            setType(tx.type);
            setName(tx.name);
            setAmount(tx.amount.toString());
            // Gestione valuta originale e tasso di cambio (se presenti nell'API, altrimenti base)
            setCurrency((tx as any).originalCurrency || baseCurrency);
            setExchangeRate((tx as any).exchangeValue || 1);
            setDate(tx.transactionDate.split('T')[0]);
            setSelectedTagName(tx.tag.name);
            setNotes(tx.notes || '');
            setIsEditing(true);
        };

        const handleUpdate = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!tx) return;
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

                await api.put(`/transactions/${walletId}/${tx.id}`, payload);
                triggerToast("Transaction updated successfully!", true);
                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error updating transaction", false);
            } finally {
                setLoading(false);
            }
        };

        const handleDelete = async () => {
            if (!tx) return;
            if (!window.confirm("Are you sure you want to delete this transaction?")) return;

            try {
                await api.delete(`/transactions/${walletId}/${tx.id}`);
                triggerToast("Transaction deleted", true);
                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err) {
                triggerToast("Error deleting transaction", false);
            }
        };

        if (!tx) return null;

        const isIncome = tx.type === 'INCOME';
        const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
        const canSave = amount !== '' && Number(amount) > 0 && selectedTagName !== '';

        return (
            <ModalDialog ref={dialogRef} className="max-w-[550px]">
                {!isEditing ? (
                    // ==========================================
                    // VIEW MODE (VISUALIZZAZIONE)
                    // ==========================================
                    <div className="text-center flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex w-full justify-end -mb-6">
                            <button onClick={() => dialogRef.current?.close()} className="text-white/30 hover:text-white transition-colors">
                                Close
                            </button>
                        </div>

                        {/* Header con Icona grande */}
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-4xl shadow-lg border border-white/10" style={{ color: tx.tag.colorHex }}>
                            <FontAwesomeIcon icon={ICONS[tx.tag.icon as IconKey] || faTag} />
                        </div>

                        {/* Nome e Importo */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">{tx.name}</h2>
                            <p className={`text-4xl font-app-mono font-bold ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                                {isIncome ? '+' : '-'}{tx.amount.toFixed(2)} {baseCurrency}
                            </p>

                            {/* Dettaglio Cambio Valuta se applicabile */}
                            {(tx as any).originalCurrency && (tx as any).originalCurrency !== baseCurrency && (
                                <p className="text-sm font-bold text-[#00bfff] mt-2 bg-[#00bfff]/10 inline-block px-3 py-1 rounded-full border border-[#00bfff]/20">
                                    <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
                                    {/* Assumendo che l'API ti torni l'importo originale, altrimenti ometti l'importo originale e lascia solo il rate */}
                                    Rate: 1 {(tx as any).originalCurrency} = {(tx as any).exchangeValue} {baseCurrency}
                                </p>
                            )}
                        </div>

                        {/* Griglia Dettagli */}
                        <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-left flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>Date</span>
                                <span className="text-white font-medium">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon icon={faTag} className="mr-2"/>Category</span>
                                <span className="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: `${tx.tag.colorHex}20`, color: tx.tag.colorHex, border: `1px solid ${tx.tag.colorHex}40` }}>
                                    {tx.tag.name}
                                </span>
                            </div>
                            {tx.notes && (
                                <div className="flex flex-col gap-2 border-b border-white/5 pb-3">
                                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon icon={faStickyNote} className="mr-2"/>Notes</span>
                                    <span className="text-white/80 text-sm bg-white/5 p-3 rounded-lg border border-white/5">{tx.notes}</span>
                                </div>
                            )}
                            {/* Mostra che è ricorrente senza farla modificare */}
                            {(tx as any).isRecurring && (
                                <div className="flex items-center gap-2 text-[#00bfff] text-sm font-bold pt-1">
                                    <FontAwesomeIcon icon={faRepeat} /> This is a recurring transaction
                                </div>
                            )}
                        </div>

                        {/* Bottoni Azione */}
                        <div className="flex w-full gap-4 mt-2">
                            <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-4 font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                <FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                            </button>
                            <button onClick={handleStartEdit} className="flex-1 rounded-xl py-4 font-bold text-black transition-all hover:-translate-y-1" style={{ backgroundColor: walletColor, boxShadow: `0 5px 15px -5px ${walletColor}66` }}>
                                <FontAwesomeIcon icon={faEdit} className="mr-2" /> Edit Details
                            </button>
                        </div>
                    </div>

                ) : (

                    // ==========================================
                    // EDIT MODE (MODIFICA)
                    // ==========================================
                    <div className="text-center animate-[fadeIn_0.2s_ease-out]">
                        <h3 className="mb-6 flex items-center justify-between text-xl font-semibold text-white/60">
                            <button type="button" onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <span>Edit Transaction</span>
                            <div className="w-5" /> {/* Spaziatore per centrare */}
                        </h3>

                        <form onSubmit={handleUpdate} className="text-left flex flex-col gap-6">
                            {/* Area Importo (Riciclata) */}
                            <div className="flex flex-col items-center justify-center py-4">
                                <AmountInput
                                    type={type}
                                    setType={setType}
                                    currencySymbol={currencySymbol}
                                    onAmountChange={(val) => setAmount(val)}
                                />
                                <div className="mt-4 flex rounded-xl bg-black/40 p-1 border border-white/10 w-full max-w-[250px]">
                                    <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'EXPENSE' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] shadow-sm' : 'text-white/40 hover:text-white'}`}>Expense</button>
                                    <button type="button" onClick={() => setType('INCOME')} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f] shadow-sm' : 'text-white/40 hover:text-white'}`}>Income</button>
                                </div>
                            </div>

                            {/* Tag e Data (Riciclata) */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <HierarchicalTagSelector tags={tags} selectedTagName={selectedTagName} onSelectTag={setSelectedTagName} />
                                </div>
                                <div>
                                    <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>Date</label>
                                    <input className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f] [color-scheme:dark]" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                </div>
                            </div>

                            {/* Nome e Note */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon icon={faTag} className="mr-2"/>Name</label>
                                    <input className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]" type="text" placeholder={selectedTagName || "e.g. Groceries"} value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50"><FontAwesomeIcon icon={faStickyNote} className="mr-2"/>Notes</label>
                                    <input className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]" type="text" placeholder="Any details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                            </div>

                            <hr className="my-2 border-white/10" />

                            {/* Exchange Rate (Riciclata) */}
                            <ExchangeRateSection
                                baseCurrency={baseCurrency}
                                selectedCurrency={currency}
                                onCurrencyChange={setCurrency}
                                exchangeRate={exchangeRate}
                                onExchangeRateChange={setExchangeRate}
                                amount={Number(amount)}
                            />

                            {/* Bottoni Salva/Annulla */}
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-xl bg-white/5 py-4 font-bold text-white transition-colors hover:bg-white/10">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!canSave} className="flex-1 rounded-xl py-4 font-bold text-black transition-all hover:-translate-y-1 disabled:opacity-50" style={{ backgroundColor: walletColor, boxShadow: !canSave ? 'none' : `0 10px 20px -5px ${walletColor}66` }}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </ModalDialog>
        );
    }
);