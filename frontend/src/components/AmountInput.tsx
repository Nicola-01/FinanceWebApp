import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileMath } from '../hooks/useMobileMath';
import { evaluateMathExpression } from '../utils/mathEvaluator';

interface AmountInputProps {
    value?: string;
    placeholder?: string;
    currencySymbol: string;
    type: "EXPENSE" | "INCOME" | "";
    setType: (type: "EXPENSE" | "INCOME" | "") => void;
    onAmountChange: (value: string) => void;
    autoFocus?: boolean;
}

// ============================================================================
// METODI DI SUPPORTO ED EVALUATION
// ============================================================================
const hasOperators = (val: string): boolean => {
    const withoutSign = val.replace(/^[+-]/, '');
    return /[\+\-\*/%()]/.test(withoutSign);
};

const formatAmountString = (rawValue: string, defaultSign: '-' | '+'): string => {
    // 1. Sostituisce la virgola con il punto
    let val = rawValue.replace(/,/g, '.');

    // 2. Rimuove tutto ciò che non è consentito (numeri, punti, parentesi e operatori matematici)
    val = val.replace(/[^0-9.+-/*%()]/g, '');

    // 3. Aggiunge il segno di default se manca e c'è del testo
    if (val.length > 0 && !/^[+-]/.test(val)) {
        val = defaultSign + val;
    }

    // 4. Se NON è una formula matematica complessa, applichiamo la formattazione standard
    if (!hasOperators(val)) {
        const sign = val.startsWith('-') ? '-' : val.startsWith('+') ? '+' : '';
        let numPart = val.replace(/^[+-]/, '');

        // Evita i punti multipli (tiene solo il primo)
        const dotParts = numPart.split('.');
        if (dotParts.length > 2) {
            numPart = dotParts[0] + '.' + dotParts.slice(1).join('');
        }

        // Limita a due cifre decimali
        if (numPart.includes('.')) {
            const [intPart, decPart] = numPart.split('.');
            numPart = intPart + '.' + decPart.slice(0, 2);
        }

        val = sign + numPart;
    }

    return val;
};

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================
export const AmountInput = ({
    value,
    placeholder,
    currencySymbol,
    type,
    setType,
    onAmountChange,
    autoFocus = true
}: AmountInputProps) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const { isMobile, keyboardHeight } = useMobileMath();

    const [color, setColor] = useState<string>('');
    const [textSize, setTextSize] = useState<'text-6xl' | 'text-5xl' | 'text-4xl'>('text-6xl');
    const [liveResult, setLiveResult] = useState<number | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sincronizza il valore iniziale (o i reset) con l'input fisico
    useEffect(() => {
        if (internalRef.current && value !== undefined) {
            if (value === '') {
                internalRef.current.value = '';
                setColor('text-white/10');
                setTextSize('text-6xl');
                setLiveResult(null);
            } else if (internalRef.current.value === '') {
                internalRef.current.value = value;
                adjustTextSize(value);
            }
        }
    }, [value]);

    // Gestione colori e cambio segno programmatico
    useEffect(() => {
        if (type === '') {
            setColor('text-white/10');
            return;
        }
        setColor(type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]');

        if (internalRef.current) {
            let currentValue = internalRef.current.value;
            if (!currentValue) return;

            currentValue = currentValue.replace(/^[+-]/, '');
            internalRef.current.value = (type === 'EXPENSE' ? '-' : '+') + currentValue;
        }
    }, [type]);

    const adjustTextSize = (text: string) => {
        const length = text.length;
        if (length > 12) setTextSize('text-4xl');
        else if (length > 8) setTextSize('text-5xl');
        else setTextSize('text-6xl');
    };

    // Centralizziamo gli aggiornamenti di stato
    const updateAmountState = (rawVal: string, selectionStart?: number) => {
        const input = internalRef.current;
        if (!input) return;

        const defaultSign = type === 'INCOME' ? '+' : '-';
        const cleanedValue = formatAmountString(rawVal, defaultSign);

        const originalValue = input.value;
        if (originalValue !== cleanedValue) {
            input.value = cleanedValue;
            if (selectionStart !== undefined) {
                const newCursorPos = Math.max(0, selectionStart + (cleanedValue.length - originalValue.length));
                input.setSelectionRange(newCursorPos, newCursorPos);
            }
        }

        const isNegative = cleanedValue.startsWith('-');
        const isPositive = cleanedValue.startsWith('+');
        const currentSignType = isNegative ? 'EXPENSE' : isPositive ? 'INCOME' : '';
        setType(currentSignType);
        adjustTextSize(cleanedValue);

        if (cleanedValue.length === 0 || cleanedValue === '+' || cleanedValue === '-') {
            setColor('text-white/10');
            setLiveResult(null);
        } else {
            setColor(currentSignType === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]');

            // Calcolo Live Preview se contiene operatori matematici
            if (hasOperators(cleanedValue)) {
                const res = evaluateMathExpression(cleanedValue);
                setLiveResult(res);
            } else {
                setLiveResult(null);
            }
        }

        const magnitude = cleanedValue.replace(/^[+-]/, '');
        onAmountChange(magnitude);
    };

    // Risoluzione dell'espressione matematica
    const handleResolve = () => {
        const input = internalRef.current;
        if (!input) return;

        const val = input.value;
        const result = evaluateMathExpression(val);
        if (result !== null) {
            const formattedResult = Math.abs(result).toFixed(2);
            const newSign = result < 0 ? '-' : '+';
            const newVal = newSign + formattedResult;

            updateAmountState(newVal, newVal.length);
        }
    };

    // Gestione tasti speciali e blocco lettere
    const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key.length > 1 || e.ctrlKey || e.metaKey || e.key === 'Unidentified') {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleResolve();
            }
            return;
        }

        // Scambio rapido del segno solo all'inizio
        if (['-', '+'].includes(e.key)) {
            const input = e.currentTarget;
            const start = input.selectionStart || 0;

            if (start === 0) {
                e.preventDefault();
                const currentValue = input.value;
                const hadSign = /^[+-]/.test(currentValue);
                const newVal = e.key + currentValue.replace(/^[+-]/, '');

                updateAmountState(newVal, hadSign ? 1 : 1);
                setType(e.key === '-' ? 'EXPENSE' : 'INCOME');
                return;
            }
        }

        // Se preme '=', risolve
        if (e.key === '=') {
            e.preventDefault();
            handleResolve();
            return;
        }

        // Blocca caratteri non ammessi
        if (!/[0-9.,+\-*/%()]/.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateAmountState(e.target.value, e.target.selectionStart || 0);
    };

    const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // Don't close if clicking on toolbar buttons
        if (toolbarRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsFocused(false);
        handleResolve();
    };

    const handleOnFocus = () => {
        setIsFocused(true);
    };

    const handleToolbarPress = (char: string) => {
        const input = internalRef.current;
        if (!input) return;

        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const val = input.value;

        const newVal = val.substring(0, start) + char + val.substring(end);
        updateAmountState(newVal, start + char.length);
        input.focus();
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full">
            {/* Live Preview Bubble */}
            <AnimatePresence>
                {liveResult !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1f2c]/95 backdrop-blur-md border border-white/10 rounded-full px-4 py-1 text-sm font-app-mono shadow-2xl flex items-center gap-1.5 z-50 whitespace-nowrap"
                    >
                        <span className="text-white/40 text-xs">Preview:</span>
                        <span className={`${liveResult < 0 ? 'text-[#ff4d4d]' : 'text-[#00ff7f]'} font-semibold`}>
                            {liveResult < 0 ? '-' : '+'}{Math.abs(liveResult).toFixed(2)} {currencySymbol}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex h-18.75 items-center justify-center gap-2">
                <input
                    ref={internalRef}
                    className={`font-amount font-app-mono w-[280px] bg-transparent text-center outline-none transition-all duration-200 placeholder:text-white/20 ${textSize} ${color || 'text-white/10'}`}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder || "0.00"}
                    onKeyDown={handleOnKeyDown}
                    onChange={handleOnChange}
                    onFocus={handleOnFocus}
                    onBlur={handleOnBlur}
                    onDrop={(e) => e.preventDefault()}
                    autoFocus={autoFocus}
                    required
                />
                <span className="font-app-mono pb-2 text-4xl text-white/30">
                    {currencySymbol}
                </span>
            </div>

            {/* Toolbar Matematica Fluttuante — Solo Mobile */}
            <AnimatePresence>
                {isMobile && isFocused && (
                    <motion.div
                        ref={toolbarRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            left: 0,
                            right: 0,
                            bottom: `${keyboardHeight}px`,
                            zIndex: 9999,
                        }}
                        className="bg-[#0f121d] backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-between gap-1"
                    >
                        {['(', ')', '/', '*', '-', '+', '%'].map((char) => (
                            <button
                                key={char}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onTouchStart={(e) => e.preventDefault()}
                                onClick={() => handleToolbarPress(char)}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-app-mono font-medium text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                            >
                                {char}
                            </button>
                        ))}
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onClick={handleResolve}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border border-emerald-400/20 text-white font-bold font-app-mono text-base rounded-lg h-10 flex-1 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            =
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};