import React, {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowRight, faCoins, faEdit, faExchangeAlt} from '@fortawesome/free-solid-svg-icons';
import {CurrencySelector} from '../../components/selectors/CurrencySelector';
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';
import {triggerToast} from '../../components/ui/ToastNotification.tsx';

export interface UnifiedExchangeRateProps {
    mode: 'view' | 'edit' | 'create';
    baseCurrency: CurrencyCode;
    selectedCurrency: CurrencyCode;
    onCurrencyChange?: (currency: CurrencyCode) => void;

    originalAmount: number | string;
    onOriginalAmountChange?: (amount: string) => void;

    exchangeRate: number | string;
    onExchangeRateChange?: (rate: string) => void;

    convertedAmount: number | string;
    onConvertedAmountChange?: (amount: string) => void;
}

export const ExchangeRateSection: React.FC<UnifiedExchangeRateProps> = ({
                                                                            mode,
                                                                            baseCurrency,
                                                                            selectedCurrency,
                                                                            onCurrencyChange,
                                                                            originalAmount,
                                                                            onOriginalAmountChange,
                                                                            exchangeRate,
                                                                            onExchangeRateChange,
                                                                            convertedAmount,
                                                                            onConvertedAmountChange
                                                                        }) => {
    const isViewOnly = mode === 'view';

    // Inizializza il toggle aperto se siamo in edit con valuta diversa
    const [isForeignCurrency, setIsForeignCurrency] = useState(
        mode === 'create' ? false : selectedCurrency !== baseCurrency
    );
    const [loadingRate, setLoadingRate] = useState(false);

    // Fetching del tasso di cambio automatico
    useEffect(() => {
        const fetchExchangeRate = async () => {
            if (isViewOnly || selectedCurrency === baseCurrency || !isForeignCurrency) return;

            setLoadingRate(true);
            try {
                const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${selectedCurrency}&symbols=${baseCurrency}`);
                const data = await response.json();

                if (data?.rates?.[baseCurrency]) {
                    const rate = data.rates[baseCurrency];
                    onExchangeRateChange?.(rate.toString());

                    // Se c'è già un importo originale, ricalcola il convertito
                    if (originalAmount) {
                        const newTotal = (Number(originalAmount) * rate).toFixed(2);
                        onConvertedAmountChange?.(newTotal);
                    }
                } else {
                    triggerToast("Could not retrieve exchange rate.", false);
                }
            } catch (error) {
                console.error("Frankfurter API Error:", error);
                triggerToast("Error fetching exchange rate.", false);
            } finally {
                setLoadingRate(false);
            }
        };

        fetchExchangeRate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCurrency, isForeignCurrency, isViewOnly]);

    // Gestione del Toggle "Foreign Currency"
    const handleToggle = () => {
        if (isViewOnly) return;
        const newValue = !isForeignCurrency;
        setIsForeignCurrency(newValue);

        // Se spengo il toggle, resetto tutto alla valuta base
        if (!newValue) {
            onCurrencyChange?.(baseCurrency);
            onExchangeRateChange?.('1');
            onOriginalAmountChange?.(convertedAmount.toString());
        }
    };

    // --- FUNZIONI DI CALCOLO A 3 VIE ---
    const handleOriginalChange = (val: string) => {
        onOriginalAmountChange?.(val);
        if (val && exchangeRate) {
            onConvertedAmountChange?.((Number(val) * Number(exchangeRate)).toFixed(2));
        }
    };

    const handleRateChange = (val: string) => {
        onExchangeRateChange?.(val);
        if (val && originalAmount) {
            onConvertedAmountChange?.((Number(originalAmount) * Number(val)).toFixed(2));
        }
    };

    const handleConvertedChange = (val: string) => {
        onConvertedAmountChange?.(val);
        if (val && originalAmount && Number(originalAmount) > 0) {
            const newRate = Number(val) / Number(originalAmount);
            onExchangeRateChange?.(newRate.toFixed(6).replace(/\.?0+$/, ''));
        }
    };

    // Se siamo in modalità view e non c'è cambio valuta, il componente scompare
    if (isViewOnly && selectedCurrency === baseCurrency) {
        return null;
    }

    const hideArrowsClass = "[-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

    // Il cuore del componente: Il box a 3 colonne (AGGIORNATO - RESPONSIVE)
    const exchangeBoxContent = (
        <div className="flex flex-col gap-3 mt-2 animate-[fadeIn_0.2s_ease-out] w-full">
            {isViewOnly && (
                <span className="text-app-sky/70 text-xs font-bold uppercase tracking-wider">
                    <FontAwesomeIcon icon={faExchangeAlt} className="mr-2"/>
                    Currency Exchange
                </span>
            )}
            {/* Rimosso p-5 fisso, inserito p-3 responsive e gap per gestire meglio lo spazio */}
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-app-sky)]/5 p-3 sm:p-4 border border-[var(--color-app-sky)]/20 overflow-hidden w-full gap-1 sm:gap-2">

                {/* SINISTRA: Importo Originale */}
                <div className="flex justify-center flex-1 min-w-0 group">
                    <div className={`flex items-center justify-center gap-1 sm:gap-2 border-b w-full max-w-[120px] ${!isViewOnly ? 'border-transparent focus-within:border-[var(--color-app-sky)]/50 transition-colors pb-1' : 'border-transparent'}`}>
                        {isViewOnly ? (
                            <span className="text-lg sm:text-xl font-bold font-app-mono text-app-text truncate">
                                {Number(originalAmount).toFixed(2)}
                            </span>
                        ) : (
                            <input
                                type="number" step="0.01" min="0"
                                className={`w-full min-w-[40px] bg-transparent text-right text-lg sm:text-xl font-bold font-app-mono text-app-text outline-none placeholder-app-muted opacity-50 focus:opacity-100 ${hideArrowsClass}`}
                                placeholder="0.00"
                                value={originalAmount}
                                onChange={(e) => handleOriginalChange(e.target.value)}
                            />
                        )}
                        <span className="text-sm sm:text-lg text-app-sky/70 font-bold uppercase tracking-wider shrink-0">
                            {CURRENCY_META[selectedCurrency as CurrencyCode]?.symbol || selectedCurrency}
                        </span>
                        {!isViewOnly && <FontAwesomeIcon icon={faEdit} className="text-app-sky/30 text-[10px] shrink-0 opacity-0 group-focus-within:opacity-100" />}
                    </div>
                </div>

                {/* CENTRO: Tasso di Cambio */}
                <div className="flex flex-col items-center justify-center flex-[1.4] min-w-0 group px-1">
                    <div className={`flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-app-sky/70 whitespace-nowrap border-b w-full ${!isViewOnly ? 'border-transparent focus-within:border-[var(--color-app-sky)]/50 transition-colors pb-1' : 'border-transparent'}`}>
                        <span className="shrink-0">1 {selectedCurrency} = </span>
                        {isViewOnly ? (
                            <span className="text-app-text mx-1 tracking-tight">
                                {Number(exchangeRate).toFixed(6).replace(/\.?0+$/, '')}
                            </span>
                            ) : (
                            <input
                            type="number" step="0.000001" min="0"
                         className={`w-full min-w-[60px] max-w-[80px] bg-transparent text-center outline-none text-app-text placeholder-app-muted opacity-50 focus:opacity-100 tracking-tight ${hideArrowsClass}`}
                         placeholder="1.00"
                         value={exchangeRate}
                         onChange={(e) => handleRateChange(e.target.value)}
                    />
                    )}
                    <span className="shrink-0">{baseCurrency}</span>
                    {!isViewOnly && <FontAwesomeIcon icon={faEdit} className="text-app-sky/30 text-[10px] shrink-0 opacity-0 group-focus-within:opacity-100" />}
                </div>
                <div className="flex w-full items-center">
                    <div className="h-[2px] flex-1 bg-[var(--color-app-sky)]/30 rounded-full"></div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-app-sky/50 px-2 text-[10px] sm:text-sm shrink-0" />
                    <div className="h-[2px] flex-1 bg-[var(--color-app-sky)]/30 rounded-full"></div>
                </div>
            </div>

                {/* DESTRA: Importo Convertito */}
                <div className="flex justify-center flex-1 min-w-0 group">
                    <div className={`flex items-center justify-center gap-1 sm:gap-2 border-b w-full max-w-[120px] ${!isViewOnly ? 'border-transparent focus-within:border-[var(--color-app-sky)]/50 transition-colors pb-1' : 'border-transparent'}`}>
                        {isViewOnly ? (
                            <span className="text-lg sm:text-xl font-bold font-app-mono text-app-sky truncate">
                                {Number(convertedAmount).toFixed(2)}
                            </span>
                        ) : (
                            <input
                                type="number" step="0.01" min="0"
                                className={`w-full min-w-[40px] bg-transparent text-right text-lg sm:text-xl font-bold font-app-mono text-app-sky outline-none placeholder-[var(--color-app-sky)]/50 ${hideArrowsClass}`}
                                placeholder="0.00"
                                value={convertedAmount}
                                onChange={(e) => handleConvertedChange(e.target.value)}
                            />
                        )}
                        <span className="text-sm sm:text-lg text-app-sky/70 font-bold uppercase tracking-wider shrink-0">
                            {CURRENCY_META[baseCurrency as CurrencyCode]?.symbol || baseCurrency}
                        </span>
                        {!isViewOnly && <FontAwesomeIcon icon={faEdit} className="text-app-sky/30 text-[10px] shrink-0 opacity-0 group-focus-within:opacity-100" />}
                    </div>
                </div>
            </div>
        </div>
    );

    // Se è solo in View, stampa direttamente la riga a 3 colonne (senza l'involucro grande)
    if (isViewOnly) {
        return exchangeBoxContent;
    }

    // Altrimenti stampa la versione Edit/Create con Toggle e Selettore
    return (
        <div className="rounded-xl border border-app-border bg-app-input p-4 transition-all">
            <div className="flex items-center justify-between cursor-pointer" onClick={handleToggle}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isForeignCurrency ? 'bg-[var(--color-app-sky)]/20 text-app-sky' : 'bg-app-input text-app-muted'}`}>
                        <FontAwesomeIcon icon={faCoins}/>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-app-text">Foreign Currency</h4>
                        <p className="text-xs text-app-muted">Transaction in a different currency?</p>
                    </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${isForeignCurrency ? 'bg-[var(--color-app-sky)]' : 'bg-app-surface'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isForeignCurrency ? 'translate-x-6' : ''}`}/>
                </div>
            </div>

            {isForeignCurrency && (
                <div className="mt-4 pt-4 border-t border-app-border animate-[fadeIn_0.2s_ease-out] space-y-4">
                    <div className="w-full">
                        <label className="mb-2 ml-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-app-sky">
                            Select Currency
                            {loadingRate && <span className="text-[10px] animate-pulse">Fetching rate...</span>}
                        </label>
                        <CurrencySelector value={selectedCurrency} onChange={(val: CurrencyCode) => onCurrencyChange?.(val)} excludeCurrency={baseCurrency}/>
                    </div>
                    {/* Inseriamo la costante aggiornata */}
                    {exchangeBoxContent}
                </div>
            )}
        </div>
    );
};