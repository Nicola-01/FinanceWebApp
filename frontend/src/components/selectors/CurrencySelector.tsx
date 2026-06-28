import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';

interface CurrencySelectorProps {
    value: CurrencyCode | string;
    onChange: (currency: CurrencyCode) => void;
    excludeCurrency?: CurrencyCode;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, excludeCurrency }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const safeCode = (value ? String(value).toUpperCase() : 'EUR') as CurrencyCode;
    const meta = CURRENCY_META[safeCode];

    const availableCurrencies = Object.entries(CURRENCY_META).filter(
        ([code]) => code !== excludeCurrency
    );

    const toggleDropdown = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'absolute',
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleScroll = (e: Event) => {
            // IL FIX: Se l'utente sta scrollando dentro la tendina, non facciamo nulla!
            const target = e.target as HTMLElement;
            if (target && target.classList && target.classList.contains('currency-scroll-container')) {
                return;
            }
            // Se scrolla il modal dietro, chiudiamo la tendina per evitare che rimanga fluttuante in giro
            if (isOpen) setIsOpen(false);
        };

        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };

        if (isOpen) {
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);

            if (popoverRef.current) {
                try {
                    popoverRef.current.showPopover();
                } catch (e) {
                    console.warn("Popover API not supported by this browser");
                }
            }
        }

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);

            if (popoverRef.current) {
                try {
                    if (popoverRef.current.matches(':popover-open')) {
                        popoverRef.current.hidePopover();
                    }
                } catch (e) {}
            }
        };
    }, [isOpen]);

    return (
        <div className="relative w-full text-left">
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                Currency
            </label>

            <div
                ref={triggerRef}
                className={`flex h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border bg-app-input px-4 outline-none transition-all ${isOpen ? 'border-app-green' : 'border-app-border hover:border-white/30'}`}
                onClick={toggleDropdown}
            >
                {/* Nuova formattazione del testo identica agli elementi della tendina */}
                <div className="flex items-center flex-1 truncate text-sm text-white">
                    {meta ? (
                        <>
                            <span className="inline-block w-[30px] font-bold text-white">{meta.symbol}</span>
                            <span className="truncate text-white/90">{meta.name}</span>
                            <span className="ml-1 text-app-muted">({safeCode})</span>
                        </>
                    ) : (
                        <span className="truncate">Unknown ({safeCode})</span>
                    )}
                </div>

                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`shrink-0 text-app-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-app-green' : ''}`}
                />
            </div>

            {isOpen && (
                <div
                    ref={popoverRef}
                    popover="manual"
                    className="fixed inset-0 m-0 h-screen w-screen border-none bg-transparent p-0 z-[99999]"
                >
                    {/* Sfondo invisibile per chiudere cliccando fuori */}
                    <div className="absolute inset-0" onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }} />

                    <div
                        style={dropdownStyle}
                        className="absolute z-10 rounded-xl border border-app-border bg-app-card py-2 shadow-2xl animate-[fadeIn_0.2s_ease-out]"
                    >
                        {/* Aggiunta la classe vitale 'currency-scroll-container' */}
                        <div className="currency-scroll-container max-h-[200px] overflow-y-auto pointer-events-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
                            {availableCurrencies.map(([code, data]: [string, any]) => (
                                <div
                                    key={code}
                                    className={`cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-app-surface ${safeCode === code ? 'border-l-2 border-app-green bg-app-green/10 text-app-green' : 'border-l-2 border-transparent text-white/80'}`}
                                    // IL FIX: onMouseDown è istantaneo, a differenza di onClick che aspetta il rilascio del mouse
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange(code as CurrencyCode);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="inline-block w-[30px] font-bold">{data.symbol}</span>
                                    {data.name} <span className="text-app-muted">({code})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};