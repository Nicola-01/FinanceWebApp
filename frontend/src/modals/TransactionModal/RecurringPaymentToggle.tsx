import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';

interface Props {
    isRecurring: boolean;
    setIsRecurring: (val: boolean) => void;
}

export const RecurringPaymentToggle: React.FC<Props> = ({ isRecurring, setIsRecurring }) => {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 transition-all">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsRecurring(!isRecurring)}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isRecurring ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-white/5 text-white/40'}`}>
                        <FontAwesomeIcon icon={faRepeat} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Recurring Payment</h4>
                        <p className="text-xs text-white/50">Automate this transaction</p>
                    </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${isRecurring ? 'bg-[#00ff7f]' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`} />
                </div>
            </div>
            {isRecurring && (
                <div className="mt-4 rounded-lg border border-dashed border-[#00bfff]/30 bg-[#00bfff]/10 p-4 text-center animate-[fadeIn_0.2s_ease-out]">
                    <span className="text-sm font-bold text-[#00bfff]">🚀 Recurring Payments feature is coming soon!</span>
                </div>
            )}
        </div>
    );
};