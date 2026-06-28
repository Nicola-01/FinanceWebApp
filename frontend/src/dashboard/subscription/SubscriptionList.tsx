import React, { useState } from 'react';
import type {Subscription} from '../../utils/types';
import {SubscriptionCard} from './SubscriptionCard';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRepeat, faChevronDown, faChevronUp} from '@fortawesome/free-solid-svg-icons';
import {useWalletContext} from "../wallet/WalletContext.tsx";

interface SubscriptionListProps {
    subscriptions: Subscription[];
    onEditSubscription?: (subscription: Subscription) => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({subscriptions, onEditSubscription}) => {

    const {wallet} = useWalletContext();
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

    if (subscriptions.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-input mb-4 text-app-muted">
                    <FontAwesomeIcon icon={faRepeat} className="text-2xl"/>
                </div>
                <h3 className="text-lg font-bold text-app-text mb-1">No subscriptions found</h3>
                <p className="text-sm text-app-muted max-w-sm">
                    You don't have any recurring transactions yet. Click "New Subscription" to add your first one.
                </p>
            </div>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDaysLeft = (dateStr: string) => {
        const nextDate = new Date(dateStr);
        nextDate.setHours(0, 0, 0, 0);
        return Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    // --- UPCOMING SUBSCRIPTIONS ---
    const within7Days = subscriptions.filter(s => getDaysLeft(s.nextExecutionDate) <= 7);
    const within31Days = subscriptions.filter(s => getDaysLeft(s.nextExecutionDate) > 7);

    within7Days.sort((a, b) => new Date(a.nextExecutionDate).getTime() - new Date(b.nextExecutionDate).getTime());
    within31Days.sort((a, b) => new Date(a.nextExecutionDate).getTime() - new Date(b.nextExecutionDate).getTime());

    // --- PAST SUBSCRIPTIONS ---
    const pastSubs = subscriptions.filter(sub => sub.lastExecutionDate);
    const groupedPastSubs: Record<string, Subscription[]> = {};
    pastSubs.forEach(sub => {
        const d = new Date(sub.lastExecutionDate!);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedPastSubs[monthKey]) groupedPastSubs[monthKey] = [];
        groupedPastSubs[monthKey].push(sub);
    });

    const sortedMonthKeys = Object.keys(groupedPastSubs).sort((a, b) => b.localeCompare(a));
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => ({ ...prev, [monthKey]: !isExpanded(monthKey) }));
    };

    const isExpanded = (monthKey: string) => {
        if (expandedMonths[monthKey] !== undefined) return expandedMonths[monthKey];
        return monthKey === currentMonthKey;
    };

    const formatMonthLabel = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    };

    const hasUpcoming = within7Days.length > 0 || within31Days.length > 0;
    const hasPast = pastSubs.length > 0;

    return (
        <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-6 pb-10">
            
            {/* SEZIONE 1 - TO PAY */}
            {hasUpcoming && (
                <div className="bg-[rgb(var(--bg-card-dark))] border border-app-border rounded-[2rem] p-5 sm:p-7 flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-app-text ml-1" style={{ color: wallet.color }}>To Pay</h3>
                    
                    {within7Days.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full theme-bg-warning-transparent theme-text-warning text-[10px] font-bold uppercase tracking-widest border theme-border-warning">
                                    Within 7 Days
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {within7Days.map(sub => (
                                    <SubscriptionCard
                                        key={`future-${sub.id}`}
                                        subscription={sub}
                                        date={sub.nextExecutionDate}
                                        onClick={() => onEditSubscription && onEditSubscription(sub)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {within31Days.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-app-surface text-app-muted text-[10px] font-bold uppercase tracking-widest border border-app-border">
                                    Within 31 Days
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {within31Days.map(sub => (
                                    <SubscriptionCard
                                        key={`future-${sub.id}`}
                                        subscription={sub}
                                        date={sub.nextExecutionDate}
                                        onClick={() => onEditSubscription && onEditSubscription(sub)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SEZIONE 2 - PAID */}
            {hasPast && (
                <div className="bg-[rgb(var(--bg-card-dark))] border border-app-border rounded-[2rem] p-5 sm:p-7 flex flex-col gap-8">
                    <h3 className="text-xl font-bold text-app-text ml-1" style={{ color: wallet.color }}>Paid</h3>
                    
                    {sortedMonthKeys.map(monthKey => {
                        const subs = groupedPastSubs[monthKey].sort((a, b) => b.amount - a.amount);
                        const expanded = isExpanded(monthKey);
                        const visibleSubs = expanded ? subs : subs.slice(0, 2);
                        const hiddenCount = subs.length - 2;

                        return (
                            <div key={monthKey} className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-app-text capitalize ml-1">
                                    {formatMonthLabel(monthKey)}
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {visibleSubs.map(sub => (
                                        <div key={`past-${sub.id}`} className="opacity-60 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300">
                                            <SubscriptionCard
                                                subscription={sub}
                                                date={sub.lastExecutionDate!}
                                                onClick={() => onEditSubscription && onEditSubscription(sub)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                
                                {hiddenCount > 0 && (
                                    <button 
                                        onClick={() => toggleMonth(monthKey)}
                                        className="self-center md:self-start mt-2 px-4 py-1.5 rounded-full bg-app-surface border border-app-border text-xs font-bold text-app-muted hover:text-app-text hover:bg-app-hover transition-colors flex items-center gap-2"
                                    >
                                        {expanded ? (
                                            <>
                                                Show less <FontAwesomeIcon icon={faChevronUp} />
                                            </>
                                        ) : (
                                            <>
                                                Show {hiddenCount} more <FontAwesomeIcon icon={faChevronDown} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
        </div>
    );
};