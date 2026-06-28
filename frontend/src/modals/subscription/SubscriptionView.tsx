import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faStickyNote,
    faTag,
    faRepeat,
    faClock,
    faPlay,
    faPause,
    faCheckDouble
} from '@fortawesome/free-solid-svg-icons';
import type { Subscription, Wallet } from "../../utils/types";
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';
import { ExchangeRateSection } from '../TransactionModal/ExchangeRateSection';
import { TagBadge } from "../../components/ui/TagBadge.tsx";

interface SubscriptionViewProps {
    sub: Subscription;
    wallet: Wallet;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ sub, wallet }) => {
    const isIncome = sub.type === 'INCOME';

    const displayExchangeRate = (sub as any).exchangeValue
        ? Number((sub as any).exchangeValue).toFixed(6).replace(/\.?0+$/, '')
        : '1';

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-UK', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getFrequencyText = () => {
        const interval = sub.frequencyInterval || 1;
        const typeStr = sub.frequencyType.toLowerCase();
        if (interval === 1) return `Every ${typeStr.replace('ly', '').replace('i', 'y')}`;
        return `Every ${interval} ${typeStr}s`;
    };

    const getStatusIcon = () => {
        if (sub.status === 'ACTIVE') return <FontAwesomeIcon icon={faPlay} className="text-app-green" />;
        if (sub.status === 'PAUSED') return <FontAwesomeIcon icon={faPause} className="text-orange-400" />;
        return <FontAwesomeIcon icon={faCheckDouble} className="text-app-muted" />;
    };

    return (
        <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
            {/* 1. AMOUNT */}
            <div className="text-center mt-2 flex flex-col items-center">
                <p className={`text-6xl font-app-mono ${isIncome ? 'text-app-green' : 'text-app-red'}`}>
                    {isIncome ? '+' : '-'}{sub.amount.toFixed(2)} <span
                        className="text-3xl">{CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}</span>
                </p>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-app-input border border-app-border text-xs font-bold tracking-wider uppercase">
                    {getStatusIcon()}
                    <span className="text-white/80">{sub.status}</span>
                </div>
            </div>

            {/* CATEGORY */}
            <div className="flex items-center gap-2 -mt-2">
                <TagBadge tag={sub.tag} forceShowParent={true} />
            </div>

            {/* DETAILS */}
            <div className="w-full bg-black/20 border border-app-border rounded-2xl text-left flex flex-col divide-y divide-white/10">

                {/* Name */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5">
                    <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        <FontAwesomeIcon icon={faTag} className="w-5 text-center mr-2" />Name
                    </span>
                    <span className="text-white font-medium sm:text-right truncate">{sub.name}</span>
                </div>

                {/* Frequency */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5 bg-app-input">
                    <span className="text-app-sky text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        <FontAwesomeIcon icon={faRepeat} className="w-5 text-center mr-2" />Frequency
                    </span>
                    <div className="flex flex-col sm:items-end">
                        <span className="text-white font-medium">{getFrequencyText()}</span>
                        {sub.duration === 'TIMES' && (
                            <span className="text-app-muted text-xs">Runs {sub.durationTimes} times (Done: {sub.executedTimes || 0})</span>
                        )}
                        {sub.duration === 'UNTIL' && (
                            <span className="text-app-muted text-xs">Until {formatDate(sub.durationUntil)}</span>
                        )}
                        {sub.duration === 'FOREVER' && (
                            <span className="text-app-muted text-xs">Forever</span>
                        )}
                    </div>
                </div>

                {/* Next Date */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5">
                    <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        <FontAwesomeIcon icon={faClock} className="w-5 text-center mr-2" />Next Run
                    </span>
                    <span className="text-white font-medium">{formatDate(sub.nextExecutionDate)}</span>
                </div>

                {/* Start Date */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5">
                    <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-5 text-center mr-2" />Started On
                    </span>
                    <span className="text-white font-medium">{formatDate(sub.startDate)}</span>
                </div>

                {/* Notes (Only if present) */}
                {sub.notes && (
                    <div className="flex flex-col gap-3 p-5">
                        <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center">
                            <FontAwesomeIcon icon={faStickyNote} className="w-5 text-center mr-2" />Notes
                        </span>
                        <span className="text-white/80 text-sm bg-app-input p-3 rounded-lg border border-app-border">
                            {sub.notes}
                        </span>
                    </div>
                )}

                {/* Exchange Rate Box (Only if applicable) */}
                {(sub as any).originalCurrency && (sub as any).originalCurrency !== wallet.currency && (
                    <div className="p-4 sm:p-5">
                        <ExchangeRateSection
                            mode="view"
                            baseCurrency={wallet.currency as CurrencyCode}
                            selectedCurrency={(sub as any).originalCurrency as CurrencyCode}
                            originalAmount={(sub as any).originalAmount || 0}
                            exchangeRate={displayExchangeRate}
                            convertedAmount={sub.amount}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
