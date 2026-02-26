import React, {useEffect, useRef, useState} from 'react';

interface AmountInputProps {
    currencySymbol: string;
    type: "EXPENSE" | "INCOME" | ""
    setType: (type: "EXPENSE" | "INCOME" | "") => void;
    onAmountChange: (value: string) => void;
}


export const AmountInput = ({ currencySymbol, type, setType, onAmountChange }: AmountInputProps) => {
    const internalRef = useRef<HTMLInputElement>(null);

    const [color, setColor] = useState<string>('')
    const [textSize, setTextSize] = useState<'text-6xl' | 'text-5xl' | 'text-4xl'>('text-6xl');

    useEffect(() => {
        if (type === '')
            return;
        setColor(type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]')

        if (internalRef && typeof internalRef !== 'function' && internalRef.current) {
            const currentValue = internalRef.current.value;

            if (type === 'EXPENSE' && !currentValue.startsWith('-'))
                internalRef.current.value = '-' + currentValue.replace('+', '');

            else if (type === 'INCOME' && currentValue.startsWith('-'))
                internalRef.current.value = '+' + currentValue.replace('-', '');

        }
    }, [type, internalRef]);

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
        if (e.key.length > 1 || e.ctrlKey || e.metaKey)
            return;

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

        const nextValue = currentValue.slice(0, start) + e.key + currentValue.slice(end);
        const isValid = /^[-+]?\d*[.,]?\d{0,2}$/.test(nextValue);

        if (!isValid) {
            e.preventDefault();
            return;
        }
        e.preventDefault();

        let newCursorPos = start + 1;
        if (/^[+-]/.test(currentValue))
            input.value = nextValue;
        else {
            input.value = '+' + nextValue;
            newCursorPos += 1
        }

        input.setSelectionRange(newCursorPos, newCursorPos);
        setType(nextValue.startsWith('-') ? 'EXPENSE' : 'INCOME');
    };

    const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const val = e.currentTarget.value;
        adjustTextSize(val);
        onAmountChange(val)
        if (val.length === 0 || val === '+' || val === '-') {
            setColor('text-white/10');
            setType('');
        }
    }

    return (
        <div className="flex items-center justify-center gap-2 h-18.75">
            {/* Indicatore visivo del segno decommentabile in futuro */}
            {/*<span className={`text-4xl font-app-mono pb-2 transition-colors ${type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]'}`}>*/}
            {/* {type === 'EXPENSE' ? '-' : '+'}*/}
            {/*</span>*/}
            <input
                ref={internalRef}
                className={`w-[200px] bg-transparent font-amount font-app-mono text-center outline-none placeholder-white/10 transition-all duration-200 ${textSize} ${color || 'text-white/10'}`}
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                onKeyDown={handleOnKeyDown}
                onKeyUp={handleOnKeyUp}
                autoFocus
                required
            />

            <span className="text-4xl text-white/30 font-app-mono pb-2">
                    {currencySymbol}
                </span>
        </div>
    );
};