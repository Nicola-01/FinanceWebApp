import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { CURRENCY_META, type CurrencyCode } from '../utils/currencies';

interface CurrencySelectorProps {
    value: CurrencyCode | string;
    onChange: (currency: CurrencyCode) => void;
    excludeCurrency?: CurrencyCode;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, excludeCurrency }) => {
    const [isOpen, setIsOpen] = useState(false);

    // 1. Assicurati che il codice sia sempre uppercase
    const safeCode = (value ? String(value).toUpperCase() : 'EUR') as CurrencyCode;

    // 2. Recupera i metadati in modo sicuro
    const meta = CURRENCY_META[safeCode];

    // 3. Filtra le valute (rimuovendo quella esclusa)
    const availableCurrencies = Object.entries(CURRENCY_META).filter(
        ([code]) => code !== excludeCurrency
    );

    return (
        <div className="relative w-full">
            {/* HO RIMOSSO LA LABEL INTERNA: Ora l'allineamento con il Rate sarà perfetto! */}

            <div
                className={`flex h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border bg-[#1a1a1a] px-4 text-white outline-none transition-all ${isOpen ? 'border-[#00ff7f]' : 'border-white/10 hover:border-white/30'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Aggiunto truncate per evitare che nomi troppo lunghi sballino il layout */}
                <span className="truncate pr-2">
                    {meta ? `${meta.symbol} - ${meta.name} (${safeCode})` : `Unknown (${safeCode})`}
                </span>

                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`shrink-0 text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ff7f]' : ''}`}
                />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    {/* Top aggiustato a 55px (visto che non c'è più la label) */}
                    <div className="absolute left-0 top-[55px] z-50 w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-2 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                        <div className="max-h-[200px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">

                            {/* ORA USIAMO availableCurrencies (la lista filtrata!) */}
                            {availableCurrencies.map(([code, data]: [string, any]) => (
                                <div
                                    key={code}
                                    className={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${safeCode === code ? 'border-l-2 border-[#00ff7f] bg-[#00ff7f]/10 text-[#00ff7f]' : 'border-l-2 border-transparent text-white/80'}`}
                                    onClick={() => {
                                        onChange(code as CurrencyCode);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="inline-block w-[30px] font-bold">{data.symbol}</span>
                                    {data.name} <span className="text-white/40">({code})</span>
                                </div>
                            ))}

                        </div>
                    </div>
                </>
            )}
        </div>
    );
};