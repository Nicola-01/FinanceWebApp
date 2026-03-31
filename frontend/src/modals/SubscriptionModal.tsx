import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import api from '../api/axiosConfig.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat, faEdit, faCheck } from '@fortawesome/free-solid-svg-icons';
import { triggerToast } from '../components/ToastNotification.tsx';
import { CURRENCY_META, type CurrencyCode } from '../utils/currencies.ts';
import type { Tag, Wallet, Subscription } from "../utils/types.ts";

// Sub-components riutilizzati dalle transazioni!
import CustomDatePicker from '../components/DataPicker/CustomDatePicker.tsx';
import { ModalDialog } from "./ModalDialog.tsx";
import { AmountInput } from "../components/AmountInput.tsx";
import { TransactionTypeToggle } from "./TransactionModal/TransactionTypeToggle.tsx";
import { TagPicker } from "./TransactionModal/TagPicker/TagPicker.tsx";
import { ExchangeRateSection } from "./TransactionModal/ExchangeRateSection.tsx";

export interface SubscriptionModalHandle {
    openModal: (sub?: Subscription) => void;
}

interface Props {
    wallet: Wallet;
    tags: Tag[];
    baseCurrency: CurrencyCode;
    onSuccess: () => void;
}

export const SubscriptionModal = forwardRef<SubscriptionModalHandle, Props>(
    ({ wallet, tags, baseCurrency, onSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // --- States per Dati Generici ---
        const [editingSubId, setEditingSubId] = useState<string | null>(null);
        const [type, setType] = useState<'EXPENSE' | 'INCOME' | ''>('');
        const [name, setName] = useState('');
        const [amount, setAmount] = useState<string>('');
        const [convertedAmount, setConvertedAmount] = useState<string>('0');
        const [currency, setCurrency] = useState<CurrencyCode>(baseCurrency);
        const [exchangeRate, setExchangeRate] = useState<string>('1');
        const [startDate, setStartDate] = useState<Date>(new Date());
        const [notes, setNotes] = useState('');
        const [selectedTagName, setSelectedTagName] = useState<string>('');

        // --- States per Scheduling e Durata (Specifici per Subscription) ---
        const [frequencyInterval, setFrequencyInterval] = useState<number>(1);
        const [frequencyType, setFrequencyType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
        const [duration, setDuration] = useState<'FOREVER' | 'TIMES' | 'UNTIL'>('FOREVER');
        const [durationTimes, setDurationTimes] = useState<number>(1);
        const [durationUntil, setDurationUntil] = useState<Date | null>(null);
        const [status, setStatus] = useState<'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ACTIVE');

        const [loading, setLoading] = useState(false);
        const [resetKey, setResetKey] = useState(0);

        useImperativeHandle(ref, () => ({
            openModal: (sub?: Subscription) => {
                setResetKey(prev => prev + 1);

                if (sub) {
                    // --- EDIT MODE ---
                    setEditingSubId(sub.id);
                    setType(sub.type);
                    setName(sub.name || '');

                    const origCurrency = (sub as any).originalCurrency || baseCurrency;
                    setCurrency(origCurrency as CurrencyCode);

                    const origAmount = sub.originalAmount || sub.amount;
                    setAmount(origAmount.toString());

                    setConvertedAmount(sub.amount.toString());

                    const exRate = sub.exchangeValue || 1;
                    setExchangeRate(exRate.toString());

                    setStartDate(new Date(sub.startDate));
                    setSelectedTagName(sub.tag?.name || '');
                    setNotes(sub.notes || '');

                    // Campi Subscription
                    setFrequencyInterval(sub.frequencyInterval || 1);
                    setFrequencyType(sub.frequencyType || 'MONTHLY');
                    setDuration(sub.duration || 'FOREVER');
                    setDurationTimes(sub.durationTimes || 1);
                    setDurationUntil(sub.durationUntil ? new Date(sub.durationUntil) : null);
                    setStatus(sub.status || 'ACTIVE');
                } else {
                    // --- CREATE MODE ---
                    setEditingSubId(null);
                    setType('EXPENSE');
                    setName('');
                    setAmount('');
                    setConvertedAmount('0');
                    setCurrency(baseCurrency);
                    setExchangeRate('1');
                    setStartDate(new Date());
                    setSelectedTagName('');
                    setNotes('');

                    // Reset Campi Subscription
                    setFrequencyInterval(1);
                    setFrequencyType('MONTHLY');
                    setDuration('FOREVER');
                    setDurationTimes(1);
                    setDurationUntil(null);
                    setStatus('ACTIVE');
                }
                dialogRef.current?.showModal();
            }
        }));

        const handleSave = async () => {
            if (!amount || Number(amount) === 0) return triggerToast("Please enter a valid amount.", false);
            if (!selectedTagName) return triggerToast("Please select a category.", false);
            if (!type) return triggerToast("Please select income or expense.", false);

            setLoading(true);
            try {
                const finalName = name.trim().length > 0 ? name.trim() : selectedTagName;

                // Payload mappato su SubscriptionRequest.java
                const payload = {
                    name: finalName,
                    amount: Math.abs(Number(convertedAmount)),
                    originalAmount: Math.abs(Number(amount)),
                    type,
                    originalCurrency: currency,
                    exchangeValue: Number(exchangeRate) || 1,
                    autoExchangeRate: true,
                    tag: selectedTagName,
                    notes,
                    status,
                    startDate: startDate.toISOString().split('T')[0],
                    frequencyType,
                    frequencyInterval,
                    duration,
                    durationTimes: duration === 'TIMES' ? durationTimes : null,
                    durationUntil: duration === 'UNTIL' && durationUntil ? durationUntil.toISOString().split('T')[0] : null,
                };

                if (editingSubId) {
                    await api.put(`/subscription/${wallet.id}/${editingSubId}`, payload);
                    triggerToast("Subscription updated successfully!", true);
                } else {
                    await api.post(`/subscription/${wallet.id}`, payload);
                    triggerToast("Subscription created successfully!", true);
                }

                onSuccess();
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                const actionText = editingSubId ? "updating" : "creating";
                triggerToast(err.response?.data?.title || `Error ${actionText} subscription`, false);
            } finally {
                setLoading(false);
            }
        };

        const currencySymbol = CURRENCY_META[currency]?.symbol || currency;
        const canSave = amount !== '' && Number(amount) !== 0 && selectedTagName !== '' && type !== '';
        const isEditing = !!editingSubId;

        // Bottone di salvataggio in alto a destra nel modale
        const rightActions = [
            {
                icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                onClick: async () => {
                    if (canSave && !loading) await handleSave();
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
                title={<><FontAwesomeIcon icon={isEditing ? faEdit : faRepeat} color={wallet.color} /> {isEditing ? "Edit" : "New"} Subscription</>}
                rightActions={rightActions}
            >
                <div id="subscription-form" key={resetKey} className="text-left flex flex-col gap-6">

                    {/* 1. AMOUNT AREA */}
                    <div className="flex flex-col items-center justify-center py-2">
                        <AmountInput
                            value={amount}
                            type={type}
                            setType={setType as any} // Cast per sicurezza sui tipi
                            currencySymbol={currencySymbol}
                            onAmountChange={(val) => {
                                setAmount(val);
                                if (currency !== baseCurrency && exchangeRate)
                                    setConvertedAmount((Number(val) * Number(exchangeRate)).toFixed(2));
                                else
                                    setConvertedAmount(val);
                            }}
                        />
                        <TransactionTypeToggle type={type as any} setType={setType as any} />
                    </div>

                    {/* 2. TAGS & START DATE */}
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
                                Start Date
                            </label>
                            <CustomDatePicker
                                isRange={false}
                                color={wallet.color}
                                initialPreset="custom"
                                initialStartDate={startDate}
                                onChange={(val) => {
                                    if (val instanceof Date) setStartDate(val);
                                }}
                            />
                        </div>
                    </div>

                    {/* 3. SCHEDULING RULES (Frequenza e Durata) */}
                    <div className="bg-app-input/50 border border-app-border rounded-xl p-4 flex flex-col gap-4">
                        <h4 className="text-sm font-bold text-white">Scheduling Rules</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                                    Repeat Every
                                </label>
                                <div className="flex bg-app-surface border border-app-border rounded-lg overflow-hidden focus-within:border-white/30 transition-colors">
                                    <input
                                        type="number"
                                        min="1"
                                        value={frequencyInterval}
                                        onChange={e => setFrequencyInterval(Number(e.target.value) || 1)}
                                        className="w-16 bg-transparent px-3 py-2 text-white focus:outline-none text-center border-r border-app-border"
                                    />
                                    <select
                                        value={frequencyType}
                                        onChange={e => setFrequencyType(e.target.value as any)}
                                        className="flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-white focus:outline-none"
                                    >
                                        <option value="DAILY">Days</option>
                                        <option value="WEEKLY">Weeks</option>
                                        <option value="MONTHLY">Months</option>
                                        <option value="YEARLY">Years</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                                    Ends
                                </label>
                                <select
                                    value={duration}
                                    onChange={e => setDuration(e.target.value as any)}
                                    className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none"
                                >
                                    <option value="FOREVER">Never (Forever)</option>
                                    <option value="TIMES">After specific times</option>
                                    <option value="UNTIL">On a specific date</option>
                                </select>
                            </div>
                        </div>

                        {/* Campi condizionali in base alla Durata */}
                        {duration === 'TIMES' && (
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                                    Number of times
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={durationTimes}
                                    onChange={e => setDurationTimes(Number(e.target.value) || 1)}
                                    className="w-full bg-app-surface border border-app-border rounded-lg px-4 py-2 text-white focus:outline-none"
                                />
                            </div>
                        )}

                        {duration === 'UNTIL' && (
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                                    End Date
                                </label>
                                <CustomDatePicker
                                    isRange={false}
                                    color={wallet.color}
                                    initialPreset="custom"
                                    initialStartDate={durationUntil || new Date()}
                                    onChange={(val) => {
                                        if (val instanceof Date) setDurationUntil(val);
                                    }}
                                />
                            </div>
                        )}

                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as any)}
                                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="PAUSED">Paused</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* 4. NAME & NOTES */}
                    {/*<TransactionMetadataInputs*/}
                    {/*    name={name}*/}
                    {/*    setName={setName}*/}
                    {/*    notes={notes}*/}
                    {/*    setNotes={setNotes}*/}
                    {/*    selectedTagName={selectedTagName}*/}
                    {/*/>*/}

                    <hr className="my-2 border-app-border" />

                    {/* 5. EXCHANGE RATE */}
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

                </div>
            </ModalDialog>
        );
    }
);