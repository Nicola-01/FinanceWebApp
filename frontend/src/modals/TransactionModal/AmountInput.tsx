import React, {useEffect, useRef, useState} from 'react';

interface AmountInputProps {
    value?: string;
    placeholder?: string;
    currencySymbol: string;
    type: "EXPENSE" | "INCOME" | ""
    setType: (type: "EXPENSE" | "INCOME" | "") => void;
    onAmountChange: (value: string) => void;
    autoFocus?: boolean; // <-- 1. AGGIUNTO QUI
}

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

    const [color, setColor] = useState<string>('')
    const [textSize, setTextSize] = useState<'text-6xl' | 'text-5xl' | 'text-4xl'>('text-6xl');

    // Sincronizza il valore iniziale (o i reset) con l'input fisico
    useEffect(() => {
        if (internalRef.current && value !== undefined) {
            // Se riceviamo un reset ("")
            if (value === '') {
                internalRef.current.value = '';
                setColor('text-white/10');
                setTextSize('text-6xl');
            }
            // Se l'input è vuoto ma abbiamo un valore (es. apriamo Edit)
            else if (internalRef.current.value === '') {
                internalRef.current.value = value;
                adjustTextSize(value);
            }
        }
    }, [value]);

    useEffect(() => {
        if (type === '') {
            setColor('text-white/10');
            return;
        }
        setColor(type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]')

        if (internalRef.current) {
            let currentValue = internalRef.current.value;
            if (!currentValue) return;

            currentValue = currentValue.replace(/^[+-]/, '')
            internalRef.current.value = (type === 'EXPENSE' ? '-' : '+') + currentValue;
        }
    }, [type]);

    const adjustTextSize = (text: string) => {
        const length = text.length;
        if (length > 7)
            setTextSize('text-4xl');
        else if (length > 4)
            setTextSize('text-5xl');
        else
            setTextSize('text-6xl');
    };

    const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key.length > 1 || e.ctrlKey || e.metaKey) return;

        const input = e.currentTarget;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value;

        if (['-', '+'].includes(e.key)) {
            e.preventDefault();
            const hadSign = /^[+-]/.test(currentValue);
            input.value = e.key + currentValue.replace(/[+-]/g, '');
            const newCursorPos = hadSign ? start : start + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
            setType(e.key === '-' ? 'EXPENSE' : 'INCOME');
            return;
        }

        let nextValue = currentValue.slice(0, start) + e.key + currentValue.slice(end);
        const isValid = /^[-+]?\d*[.,]?\d{0,2}$/.test(nextValue);

        if (!isValid) {
            e.preventDefault();
            return;
        }
        e.preventDefault();

        let newCursorPos = start + 1;
        if (!/^[+-]/.test(currentValue)) {
            nextValue = '-' + nextValue
            newCursorPos += 1
        }
        input.value = nextValue;
        input.setSelectionRange(newCursorPos, newCursorPos);
        setType(nextValue.startsWith('-') ? 'EXPENSE' : 'INCOME');
    };

    const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value;
        adjustTextSize(val);
        onAmountChange(val.replace(/^[+-]/, ''));
        if (val.length === 0 || val === '+' || val === '-') {
            setColor('text-white/10');
            setType('');
        }
    }

    return (
        <div className="flex items-center justify-center gap-2 h-18.75">
            <input
                ref={internalRef}
                className={`w-[200px] bg-transparent font-amount font-app-mono text-center outline-none placeholder-white/20 transition-all duration-200 ${textSize} ${color || 'text-white/10'}`}
                type="text"
                inputMode="decimal"
                placeholder={placeholder || "0.00"} // <-- AGGIUNTO IL PLACEHOLDER
                onKeyDown={handleOnKeyDown}
                onKeyUp={handleOnKeyUp}
                autoFocus={autoFocus}
                required
            />
            <span className="text-4xl text-white/30 font-app-mono pb-2">
                {currencySymbol}
            </span>
        </div>
    );
};