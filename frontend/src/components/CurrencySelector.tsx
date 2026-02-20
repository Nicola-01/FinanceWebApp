import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { CURRENCY_META, type CurrencyCode } from '../utils/currencies';

interface CurrencySelectorProps {
    value: CurrencyCode;
    onChange: (currency: CurrencyCode) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Currency</label>

            <div
                className={`flex h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border bg-[#1a1a1a] px-4 text-white outline-none transition-all ${isOpen ? 'border-[#00ff7f]' : 'border-white/10 hover:border-white/30'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{CURRENCY_META[value].symbol} - {CURRENCY_META[value].name} ({value})</span>
                <FontAwesomeIcon icon={faChevronDown} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ff7f]' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-[55px] z-50 w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-2 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                        <div className="max-h-[200px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                            {(Object.entries(CURRENCY_META) as [CurrencyCode, any][]).map(([code, meta]) => (
                                <div
                                    key={code}
                                    className={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-white/10 ${value === code ? 'border-l-2 border-[#00ff7f] bg-[#00ff7f]/10 text-[#00ff7f]' : 'border-l-2 border-transparent text-white/80'}`}
                                    onClick={() => {
                                        onChange(code);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="inline-block w-[30px] font-bold">{meta.symbol}</span>
                                    {meta.name} <span className="text-white/40">({code})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};