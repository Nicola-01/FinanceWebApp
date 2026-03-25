import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMoneyBillTransfer, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from '../ModalDialog';
import { triggerToast } from '../../components/ToastNotification';
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';
import type { Tag, Wallet, Transaction } from "../../utils/types.ts";

// Sub-components
import { TagPicker } from './TagPicker/TagPicker.tsx';
import { AmountInput } from "./AmountInput.tsx";
import { ExchangeRateSection } from "./ExchangeRateSection.tsx";
import { TransactionTypeToggle } from './TransactionTypeToggle.tsx';
import { TransactionMetadataInputs } from './TransactionMetadataInputs.tsx';
import { RecurringPaymentToggle } from './RecurringPaymentToggle.tsx';

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
        const dialogRef = useRef<HTMLDialogElement>(null);

        // --- Form States ---
        const [editingTxId, setEditingTxId] = useState<number | string | null>(null);
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
        const [resetKey, setResetKey] = useState(0);

        useImperativeHandle(ref, () => ({
            openModal: (tx?: Transaction) => {
                setResetKey(prev => prev + 1);

                if (tx) {
                    // --- EDIT MODE ---
                    setEditingTxId(tx.id);
                    setType(tx.type);
                    setName(tx.name || '');

                    const origCurrency = (tx as any).originalCurrency || baseCurrency;
                    setCurrency(origCurrency);

                    const origAmount = (tx as any).originalAmount || tx.amount;
                    setAmount(origAmount.toString());

                    setConvertedAmount(tx.amount.toString());

                    const exRate = (tx as any).exchangeValue || 1;
                    setExchangeRate(exRate.toString());

                    setDate(tx.transactionDate.split('T')[0]);
                    setSelectedTagName(tx.tag.name);
                    setNotes(tx.notes || '');
                    setIsRecurring(false);
                } else {
                    // --- CREATE MODE ---
                    setEditingTxId(null);
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
                }
                dialogRef.current?.showModal();
            }
        }));

        const handleSave = async () => {
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

                if (editingTxId) {
                    await api.put(`/transactions/${wallet.id}/${editingTxId}`, payload);
                    triggerToast("Transaction updated successfully!", true);
                } else {
                    await api.post(`/transactions/${wallet.id}`, payload);
                    triggerToast("Transaction added successfully!", true);
                }

                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                const actionText = editingTxId ? "updating" : "creating";
                triggerToast(err.response?.data?.title || `Error ${actionText} transaction`, false);
            } finally {
                setLoading(false);
            }
        };

        const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
        const canSave = amount !== '' && Number(amount) !== 0 && selectedTagName !== '';
        const isEditing = !!editingTxId;

        const rightActions = [
            {
                icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                onClick: async () => {
                    if (canSave && !loading)
                        await handleSave();
                },
                color: canSave ? wallet.color : undefined,
                hoverColor: 'hover:text-white',
                disabled: !canSave || loading
            }
        ];

        return (
            <ModalDialog
                ref={dialogRef}
                className="max-w-160 p-6"
                title={<><FontAwesomeIcon icon={isEditing ? faEdit : faMoneyBillTransfer} color={wallet.color} /> {isEditing ? "Edit" : "New"} Transaction</>}
                rightActions={rightActions}
            >
                <div id="transaction-form" key={resetKey} className="text-left flex flex-col gap-6">

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
                            <TagPicker
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

                    {/* 3. NAME & NOTES */}
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

                    {/* 5. RECURRING TOGGLE */}
                    {!isEditing && (
                        <RecurringPaymentToggle
                            isRecurring={isRecurring}
                            setIsRecurring={setIsRecurring}
                        />
                    )}
                </div>
            </ModalDialog>
        );
    }
);