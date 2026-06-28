import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';

interface Props {
    isRecurring: boolean;
    setIsRecurring: (val: boolean) => void;
}

export const RecurringPaymentToggle: React.FC<Props> = ({ isRecurring, setIsRecurring }) => {
    return (
        <div className="rounded-xl border border-app-border bg-app-input p-4 transition-all">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsRecurring(!isRecurring)}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isRecurring ? 'bg-app-green/20 text-app-green' : 'bg-app-input text-app-muted'}`}>
                        <FontAwesomeIcon icon={faRepeat} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-app-text">Recurring Payment</h4>
                        <p className="text-xs text-app-muted">Automate this transaction</p>
                    </div>
                </div>
                <div className={`relative w-12 h-6 rounded-full transition-colors ${isRecurring ? 'bg-app-green' : 'bg-app-surface'}`}>
                    <div className={`absolute top-1 left-1 theme-bg-inverse w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : ''}`} />
                </div>
            </div>
            {isRecurring && (
                <div className="mt-4 rounded-lg border border-dashed border-[var(--color-app-sky)]/30 bg-[var(--color-app-sky)]/10 p-4 text-center animate-[fadeIn_0.2s_ease-out]">
                    <span className="text-sm font-bold text-app-sky">🚀 Recurring Payments feature is coming soon!</span>
                </div>
            )}
        </div>
    );
};