import React, {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowRightArrowLeft, faCoins} from '@fortawesome/free-solid-svg-icons';
import {CurrencySelector} from '../../components/CurrencySelector';
import type {CurrencyCode} from '../../utils/currencies';
import {triggerToast} from '../../components/ToastNotification';

interface ExchangeRateSectionProps {
    baseCurrency: CurrencyCode;
    selectedCurrency: CurrencyCode;
    onCurrencyChange: (currency: CurrencyCode) => void;
    exchangeRate: number | '';
    onExchangeRateChange: (rate: number | '') => void;
    amount: number | '';
    onConvertedAmountChange: (amount: number) => void; // <-- NUOVA PROP: Invia il totale calcolato al padre
}

export const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({
                                                                            baseCurrency,
                                                                            selectedCurrency,
                                                                            onCurrencyChange,
                                                                            onExchangeRateChange,
                                                                            amount,
                                                                            onConvertedAmountChange
                                                                        }) => {
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [loadingRate, setLoadingRate] = useState(false);

    const [fetchedRate, setFetchedRate] = useState<number | null>(null);
    const [rateInput, setRateInput] = useState<string>('');
    const [totalInput, setTotalInput] = useState<string>('');

    // 1. Reset e Fallback se la modalità valuta estera viene spenta
    useEffect(() => {
        if (!isForeignCurrency) {
            onCurrencyChange(baseCurrency);
            onExchangeRateChange(1);
            setFetchedRate(null);
            setRateInput('');
            setTotalInput('');
            onConvertedAmountChange(Number(amount) || 0); // Torna l'importo base
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isForeignCurrency]);

    // 2. Fetch del Rate dalle API
    useEffect(() => {
        const fetchExchangeRate = async () => {
            if (selectedCurrency === baseCurrency || !isForeignCurrency) return;

            setLoadingRate(true);
            try {
                const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${selectedCurrency}&symbols=${baseCurrency}`);
                const data = await response.json();

                if (data?.rates?.[baseCurrency]) {
                    const rate = data.rates[baseCurrency];
                    setFetchedRate(rate);
                    setRateInput('');
                    onExchangeRateChange(rate);

                    // Calcola il totale iniziale
                    const newTotal = (Number(amount) * rate).toFixed(2);
                    setTotalInput(newTotal);
                    onConvertedAmountChange(Number(newTotal));
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
    }, [selectedCurrency, isForeignCurrency]);

    // 3. Reagisce ai cambiamenti dell'importo "Gigante" iniziale in tempo reale
    useEffect(() => {
        if (isForeignCurrency) {
            const currentRate = rateInput !== '' ? Number(rateInput) : (fetchedRate || 1);
            const newTotal = (Number(amount) * currentRate).toFixed(2);
            if (totalInput !== newTotal) {
                setTotalInput(newTotal);
                onConvertedAmountChange(Number(newTotal));
            }
        } else {
            onConvertedAmountChange(Number(amount) || 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount]);

    // 4. Modifica manuale del Rate (ricalcola il Totale)
    const handleRateChange = (val: string) => {
        setRateInput(val);
        const rateToApply = val !== '' ? Number(val) : (fetchedRate || 1);
        onExchangeRateChange(rateToApply);

        const newTotal = (Number(amount) * rateToApply).toFixed(2);
        setTotalInput(newTotal);
        onConvertedAmountChange(Number(newTotal));
    };

    // 5. Modifica manuale del Totale (ricalcola inversamente il Rate)
    const handleTotalChange = (val: string) => {
        setTotalInput(val);
        const totalToApply = val !== '' ? Number(val) : 0;
        onConvertedAmountChange(totalToApply);

        if (Number(amount) != 0) {
            const newRate = totalToApply / Number(amount);
            setRateInput(newRate.toFixed(6).replace(/\.?0+$/, ''));
            onExchangeRateChange(newRate);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-all">
            {/* Toggle Header */}
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsForeignCurrency(!isForeignCurrency)}>
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isForeignCurrency ? 'bg-[#00bfff]/20 text-[#00bfff]' : 'bg-white/5 text-white/40'}`}>
                        <FontAwesomeIcon icon={faCoins} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Foreign Currency</h4>
                        <p className="text-xs text-white/50">Transaction in a different currency?</p>
                    </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${isForeignCurrency ? 'bg-[#00bfff]' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isForeignCurrency ? 'translate-x-6' : ''}`} />
                </div>
            </div>

            {/* Contenuto Espanso */}
            {isForeignCurrency && (
                <div className="mt-4 pt-4 border-t border-white/5 animate-[fadeIn_0.2s_ease-out] space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.5fr_1fr] items-end">
                        <div className="w-full">
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-[#00bfff]">Select Currency</label>
                            <CurrencySelector value={selectedCurrency} onChange={onCurrencyChange} excludeCurrency={baseCurrency}/>
                        </div>

                        <div className="w-full">
                            <label className="mb-2 ml-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[#00bfff]">
                                <span><FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2" /> 1 {selectedCurrency} = {fetchedRate || '?'} {baseCurrency}</span>
                                {loadingRate && <span className="text-[10px] animate-pulse">Fetching...</span>}
                            </label>

                            <div className="relative">
                                <input
                                    className="h-[48px] w-full rounded-xl border border-[#00bfff]/30 bg-[#00bfff]/5 px-4 pr-14 text-white outline-none transition-all focus:border-[#00bfff] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder-[#00bfff]/30"
                                    type="number" step="0.000001" min="0"
                                    placeholder={fetchedRate ? fetchedRate.toString() : '...'}
                                    value={rateInput}
                                    onChange={(e) => handleRateChange(e.target.value)}
                                    required={!fetchedRate}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00bfff]/50 pointer-events-none">{baseCurrency}</span>
                            </div>
                        </div>
                    </div>

                    {/* L'area TOTAL è ora interattiva! */}
                    <div className="flex items-center justify-between rounded-lg bg-[#00bfff]/5 p-3 mt-2 border border-[#00bfff]/20 focus-within:border-[#00bfff]/60 transition-colors shadow-inner">
                        <span className="text-xs font-bold text-[#00bfff]/70 uppercase tracking-wider shrink-0 mr-4">Total</span>
                        <div className="flex items-center flex-1 justify-end">
                            <input
                                className="w-full bg-transparent text-right text-lg font-bold text-[#00bfff] font-app-mono outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder-[#00bfff]/30"
                                type="number" step="0.01" placeholder="0.00"
                                value={totalInput}
                                onChange={(e) => handleTotalChange(e.target.value)}
                            />
                            <span className="ml-2 text-lg font-bold text-[#00bfff] font-app-mono">{baseCurrency}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};