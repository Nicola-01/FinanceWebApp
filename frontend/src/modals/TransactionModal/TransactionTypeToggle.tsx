import React from 'react';

interface Props {
    type: 'EXPENSE' | 'INCOME' | '';
    setType: (type: 'EXPENSE' | 'INCOME') => void;
}

export const TransactionTypeToggle: React.FC<Props> = ({ type, setType }) => {
    return (
        <div className="mt-4 flex rounded-xl bg-black/40 p-1 border border-white/10 w-full max-w-[250px]">
            <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                    type === 'EXPENSE' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] shadow-sm' : 'text-white/40 hover:text-white'
                }`}
            >
                Expense
            </button>
            <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                    type === 'INCOME' ? 'bg-[#00ff7f]/20 text-[#00ff7f] shadow-sm' : 'text-white/40 hover:text-white'
                }`}
            >
                Income
            </button>
        </div>
    );
};