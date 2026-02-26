import React, {forwardRef, useEffect, useState} from 'react';

interface AmountInputProps {
    currencySymbol: string;
    type: "EXPENSE" | "INCOME" | ""
    setType: (value: (((prevState: ("EXPENSE" | "INCOME" | "")) => ("EXPENSE" | "INCOME" | "")) | "EXPENSE" | "INCOME" | "")) => void
}


export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
    ({currencySymbol, type, setType}, ref) => {

        const [color, setColor] = useState<string>('')

        useEffect(() => {
            if (type === '')
                return;
            setColor(type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]')

            if (ref && typeof ref !== 'function' && ref.current) {
                const currentValue = ref.current.value;

                if (type === 'EXPENSE' && !currentValue.startsWith('-'))
                    ref.current.value = '-' + currentValue.replace('+', '');

                else if (type === 'INCOME' && currentValue.startsWith('-'))
                    ref.current.value = '+' + currentValue.replace('-', '');

            }
        }, [type, ref]);

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
            const isValid = /^[-+]?\d*\.?\d*$/.test(nextValue);

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
            if (val.length === 0) {
                setColor('text-white/10');
                setType('');
            }
        }

        return (
            <div className="flex items-center justify-center gap-2">
                {/* Indicatore visivo del segno decommentabile in futuro */}
                {/*<span className={`text-4xl font-mono pb-2 transition-colors ${type === 'EXPENSE' ? 'text-[#ff4d4d]' : 'text-[#00ff7f]'}`}>*/}
                {/* {type === 'EXPENSE' ? '-' : '+'}*/}
                {/*</span>*/}
                <input
                    ref={ref}
                    className={`w-50 bg-transparent text-6xl font-mono text-center outline-none placeholder-white/10 ${color}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    onKeyDown={handleOnKeyDown}
                    onKeyUp={handleOnKeyUp}
                    autoFocus
                    required
                />

                <span className="text-4xl text-white/30 font-mono pb-2">
                    {currencySymbol}
                </span>
            </div>
        );
    }
);