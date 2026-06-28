import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faTags } from '@fortawesome/free-solid-svg-icons';
import type { Subscription } from '../../utils/types';
import { type IconKey, ICONS } from "../../utils/icons.ts";
import { TagBadge } from "../../components/ui/TagBadge.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import { differenceInMonths, differenceInYears } from 'date-fns';

interface SubscriptionCardProps {
    subscription: Subscription;
    date: string;
    onClick?: () => void;
}

// HELPER: Formatta la frequenza ultra-compatta (es. "mo", "yr", "2 wk")
const formatCompactFrequency = (interval: number, type: string) => {
    const i = interval && interval > 1 ? `${interval} ` : '';
    switch (type.toUpperCase()) {
        case 'MONTHLY':
            return `${i}mo`;
        case 'YEARLY':
            return `${i}yr`;
        case 'WEEKLY':
            return `${i}wk`;
        case 'DAILY':
            return `${i}d`;
        default:
            return `${i}${type.toLowerCase().replace('ly', '')}`; // Fallback di sicurezza
    }
};

// HELPER: Calcola i giorni rimanenti fino al prossimo pagamento
const getDaysLeft = (nextDateStr?: string | null) => {
    if (!nextDateStr) return null;
    const nextDate = new Date(nextDateStr);
    const today = new Date();

    // Resettiamo gli orari per calcolare solo i giorni netti
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// HELPER: Calcola il colore in base alla vicinanza della data
const getDaysLeftColor = (days: number, isIncome: boolean) => {
    if (days > 7) return "text-app-muted opacity-90";
    if (days < 0) return "text-app-muted opacity-60";

    if (!isIncome) {
        if (days >= 4) return "theme-text-warning";
        if (days >= 2) return "theme-text-warning";
        return "text-app-red";
    } else {
        if (days >= 4) return "text-app-green/40";
        if (days >= 2) return "text-app-green/70";
        return "text-app-green";
    }
};

const getDaysLeftText = (days: number, dateStr?: string | null) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';

    if (!dateStr) {
        return days > 1 ? `${days} days left` : `${Math.abs(days)} days ago`;
    }

    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const isPast = days < 0;
    const laterDate = isPast ? today : targetDate;
    const earlierDate = isPast ? targetDate : today;

    const months = differenceInMonths(laterDate, earlierDate);
    const years = differenceInYears(laterDate, earlierDate);

    const suffix = isPast ? 'ago' : 'left';

    if (months < 1) {
        return `${Math.abs(days)} days ${suffix}`;
    }

    if (years < 1) {
        return months === 1 ? `1 month ${suffix}` : `${months} months ${suffix}`;
    }

    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return years === 1 ? `1 year ${suffix}` : `${years} years ${suffix}`;
    }

    const yearText = years === 1 ? '1 year' : `${years} years`;
    const monthText = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`;
    return `${yearText} and ${monthText} ${suffix}`;
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, date, onClick }) => {
    const isIncome = subscription.type === 'INCOME';

    // Calcolo testi dinamici
    const frequencyText = formatCompactFrequency(subscription.frequencyInterval, subscription.frequencyType);
    const daysLeft = getDaysLeft(date);

    let cardBorder = "border theme-border-transparent hover:border-app-border";
    let statusBadge = null;
    let cardMargin = "";

    if (subscription.status === 'PAUSED') {
        cardBorder = "border theme-border-warning";
        cardMargin = "";
        statusBadge = (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-lg theme-bg-warning-transparent theme-text-warning text-[10px] font-bold uppercase tracking-wider border-b border-x theme-border-warning backdrop-blur-sm">
                Paused
            </div>
        );
    } else if (subscription.status === 'COMPLETED') {
        cardBorder = "border theme-border-success";
        cardMargin = "";
        statusBadge = (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-b-lg theme-bg-success-transparent theme-text-success text-[10px] font-bold uppercase tracking-wider border-b border-x theme-border-success backdrop-blur-sm">
                Completed
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`relative flex items-center justify-between p-4 bg-app-input cursor-pointer transition-all hover:bg-app-surface rounded-2xl ${cardBorder} ${cardMargin}`}
        >
            {statusBadge}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink max-w-[65%] lg:max-w-[75%]">
                <div
                    className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
                    style={{ color: subscription.tag?.colorHex || '#ffffff' }}
                >
                    <FontAwesomeIcon icon={ICONS[(subscription.tag?.icon as IconKey)] || faTags} />
                </div>

                <div className="flex flex-col md:items-center items-start gap-1.5 min-w-0 py-0.5">
                    {subscription.name != subscription.tag.name &&
                        <span className="text-base font-bold text-app-text truncate">{subscription.name}</span>
                    }

                    <div className="flex items-center gap-1.5 overflow-hidden shrink-0 flex-wrap">
                        {subscription.tag && <TagBadge tag={subscription.tag} showParent={false} />}
                    </div>
                </div>
            </div>

            {/* SPAZIO CENTRALE (Se volessi aggiungere le note in futuro, andrebbero qui) */}
            <div className="flex-1 min-w-0" />

            {/* 2. LATO DESTRO: Importo, Ricorrenza e Giorni Rimanenti */}
            <div className="flex flex-col items-end justify-center shrink-0 pl-3 min-w-25">

                {/* Riga 1: Importo + Valuta + Frequenza (es: -12.99 € / mo) */}
                <div
                    className={`text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${isIncome ? 'text-app-green' : 'text-app-red'}`}>
                    <span>{isIncome ? '+' : '-'}{subscription.amount.toFixed(2)}</span>
                    <span>{CURRENCY_META[subscription.originalCurrency as CurrencyCode]?.symbol}</span>

                    <span className="text-xs text-app-muted font-sans font-medium ml-0.5">
                        / {frequencyText}
                    </span>
                </div>

                {/* Riga 2: Giorni Rimanenti (Mostrato SOLO se l'abbonamento è ATTIVO e ha una data) */}
                {subscription.status === 'ACTIVE' && daysLeft !== null && (
                    <span
                        className={`text-xs font-medium mt-0.5 transition-colors duration-500 ${getDaysLeftColor(daysLeft, isIncome)}`}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                        {getDaysLeftText(daysLeft, date)}
                    </span>
                )}
            </div>
        </div>
    );
};