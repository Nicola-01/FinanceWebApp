import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCalendarAlt, faTags} from '@fortawesome/free-solid-svg-icons';
import type {Subscription} from '../../utils/types';
import {type IconKey, ICONS} from "../../utils/icons.ts";
import {TagBadge} from "../../components/TagBadge.tsx";
import {CURRENCY_META, type CurrencyCode} from "../../utils/currencies.ts";

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
    if (days > 7) return "text-app-muted opacity-70";

    if (!isIncome) {
        if (days >= 4) return "text-yellow-400";
        if (days >= 2) return "text-orange-400";
        return "text-[#ff4d4d]";
    } else {
        if (days >= 4) return "text-[#00ff7f]/40";
        if (days >= 2) return "text-[#00ff7f]/70";
        return "text-[#00ff7f]";
    }
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({subscription, date, onClick}) => {
    const isIncome = subscription.type === 'INCOME';

    // Calcolo testi dinamici
    const frequencyText = formatCompactFrequency(subscription.frequencyInterval, subscription.frequencyType);
    const daysLeft = getDaysLeft(date);

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-app-input cursor-pointer transition-all hover:bg-app-surface rounded-2xl border border-transparent hover:border-white/5"
        >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 shrink max-w-[65%] lg:max-w-[75%]">
                <div
                    className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-app-surface text-xl shadow-sm"
                    style={{color: subscription.tag?.colorHex || '#ffffff'}}
                >
                    <FontAwesomeIcon icon={ICONS[(subscription.tag?.icon as IconKey)] || faTags}/>
                </div>

                <div className="flex flex-col md:items-center items-start gap-1.5 min-w-0 py-0.5">
                    {subscription.name != subscription.tag.name &&
                        <span className="text-base font-bold text-app-text truncate">{subscription.name}</span>
                    }

                    <div className="flex items-center gap-1.5 overflow-hidden shrink-0 flex-wrap">
                        {subscription.tag && <TagBadge tag={subscription.tag} showParent={false}/>}

                        {/* Mostriamo un badge testuale per gli abbonamenti non attivi */}
                        {subscription.status === 'PAUSED' && (
                            <span
                                className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">Paused</span>
                        )}
                        {subscription.status === 'COMPLETED' && (
                            <span
                                className="px-2 py-0.5 rounded-md bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-wider border border-white/10">Completed</span>
                        )}
                    </div>
                </div>
            </div>

            {/* SPAZIO CENTRALE (Se volessi aggiungere le note in futuro, andrebbero qui) */}
            <div className="flex-1 min-w-0"/>

            {/* 2. LATO DESTRO: Importo, Ricorrenza e Giorni Rimanenti */}
            <div className="flex flex-col items-end justify-center shrink-0 pl-3 min-w-25">

                {/* Riga 1: Importo + Valuta + Frequenza (es: -12.99 € / mo) */}
                <div
                    className={`text-right text-lg font-bold font-app-mono inline-flex items-baseline justify-end gap-1 ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                    <span>{isIncome ? '+' : '-'}{subscription.amount.toFixed(2)}</span>
                    <span>{CURRENCY_META[subscription.originalCurrency as CurrencyCode]?.symbol}</span>

                    <span className="text-xs text-app-muted font-sans font-medium ml-0.5">
                        / {frequencyText}
                    </span>
                </div>

                {/* Riga 2: Giorni Rimanenti (Mostrato SOLO se l'abbonamento è ATTIVO e ha una data) */}
                {subscription.status === 'ACTIVE' && daysLeft !== null && (
                    <span
                        className={`text-xs font-medium mt-0.5 transition-colors duration-500 ${getDaysLeftColor(daysLeft, isIncome)}`}>
                        <FontAwesomeIcon icon={faCalendarAlt}/> {daysLeft === 0 ? 'Today' : `${daysLeft} days left`}
                    </span>
                )}
            </div>
        </div>
    );
};