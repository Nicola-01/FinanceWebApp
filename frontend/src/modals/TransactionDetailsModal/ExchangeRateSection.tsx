import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { CurrencySelector } from '../../components/CurrencySelector';
import type { CurrencyCode } from '../../utils/currencies';
import { triggerToast } from '../../components/ToastNotification';

interface ExchangeRateSectionProps {
    baseCurrency: CurrencyCode;
    selectedCurrency: CurrencyCode;
    onCurrencyChange: (currency: CurrencyCode) => void;
    exchangeRate: number | '';
    onExchangeRateChange: (rate: number | '') => void;
    amount: number | '';
}

export const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({
                                                                            baseCurrency,
                                                                            selectedCurrency,
                                                                            onCurrencyChange,
                                                                            onExchangeRateChange,
                                                                            amount
                                                                        }) => {
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [loadingRate, setLoadingRate] = useState(false);

    // Gestione separata tra il valore API e il valore scritto dall'utente
    const [fetchedRate, setFetchedRate] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState<string>('');

    // Reset quando si chiude il toggle
    useEffect(() => {
        if (!isForeignCurrency) {
            onCurrencyChange(baseCurrency);
            onExchangeRateChange(1);
            setFetchedRate(null);
            setInputValue('');
        }
    }, [isForeignCurrency, baseCurrency, onCurrencyChange, onExchangeRateChange]);

    // Fetch del Rate dalle API
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
                    setInputValue(''); // Svuota l'input per mostrare il placeholder
                    onExchangeRateChange(rate); // Comunica al form il valore di base
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
    }, [selectedCurrency, baseCurrency, isForeignCurrency]);
    // ^ Rimosso onExchangeRateChange dalle dipendenze per evitare loop

    // Gestione della digitazione dell'utente
    const handleInputChange = (val: string) => {
        setInputValue(val);
        // Se l'utente cancella tutto, passiamo al genitore il fetchedRate come fallback
        const rateToApply = val !== '' ? Number(val) : (fetchedRate || 1);
        onExchangeRateChange(rateToApply);
    };

    // Calcolo in tempo reale (usa il valore inserito, altrimenti usa l'API, altrimenti 1)
    const effectiveRate = inputValue !== '' ? Number(inputValue) : (fetchedRate || 1);
    const convertedAmount = amount && effectiveRate ? (Number(amount) * effectiveRate).toFixed(2) : '0.00';

    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-all">
            {/* The Toggle Header */}
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsForeignCurrency(!isForeignCurrency)}
            >
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

            {/* The Expanded Content */}
            {isForeignCurrency && (
                <div className="mt-4 pt-4 border-t border-white/5 animate-[fadeIn_0.2s_ease-out] space-y-4">

                    {/* GRIGLIA ALLINEATA IN BASSO E DIMENSIONATA DIVERSAMENTE */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.5fr_1fr] items-end">

                        {/* Area Currency (Allargata a 1.5fr) */}
                        <div className="w-full">
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-[#00bfff]">
                                Select Currency
                            </label>
                            <CurrencySelector value={selectedCurrency} onChange={onCurrencyChange} excludeCurrency={baseCurrency}/>
                        </div>

                        {/* Area Rate (Allineata perfettamente grazie a items-end) */}
                        <div className="w-full">
                            <label className="mb-2 ml-1 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[#00bfff]">
                                <span><FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2" /> 1 {selectedCurrency} = {fetchedRate || '?'} {baseCurrency}</span>
                                {loadingRate && <span className="text-[10px] animate-pulse">Fetching...</span>}
                            </label>

                            <div className="relative">
                                <input
                                    // Aggiunte classi per nascondere le frecce (appearance-none ...) e margin a destra (pr-14)
                                    className="h-[48px] w-full rounded-xl border border-[#00bfff]/30 bg-[#00bfff]/5 px-4 pr-14 text-white outline-none transition-all focus:border-[#00bfff] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none placeholder-[#00bfff]/30"
                                    type="number"
                                    step="0.000001"
                                    min="0.000001"
                                    placeholder={fetchedRate ? fetchedRate.toString() : '...'}
                                    value={inputValue}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    required={!fetchedRate} // È required solo se non abbiamo un rate scaricato dalle API
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#00bfff]/50 pointer-events-none">
                                    {baseCurrency}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Total Converted Display */}
                    <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 mt-2 border border-white/5">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Total in Wallet ({baseCurrency})</span>
                        <span className="text-lg font-bold text-[#00bfff] font-mono">{convertedAmount} {baseCurrency}</span>
                    </div>
                </div>
            )}
        </div>
    );
};