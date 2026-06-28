import React from 'react';
import type {Subscription} from '../../utils/types';
import {SubscriptionCard} from './SubscriptionCard';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRepeat} from '@fortawesome/free-solid-svg-icons';
import {useWalletContext} from "../wallet/WalletContext.tsx";

interface SubscriptionListProps {
    subscriptions: Subscription[];
    onEditSubscription?: (subscription: Subscription) => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({subscriptions, onEditSubscription}) => {

    const {wallet} = useWalletContext();

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

    return (
        // Rimosso: h-full, overflow-y-auto, e custom-scrollbar
        <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {subscriptions
                    .filter(sub => sub.lastExecutionDate)
                    .sort((a, b) => new Date(a.lastExecutionDate || 0).getTime() - new Date(b.lastExecutionDate || 0).getTime())
                    .map(sub => (
                        <SubscriptionCard
                            key={sub.id}
                            subscription={sub}
                            date={sub.lastExecutionDate!}
                            onClick={() => onEditSubscription && onEditSubscription(sub)}
                        />
                    ))}
            </div>

            <div
                className="flex items-center w-full gap-3 my-6 text-xs font-bold uppercase tracking-widest"
                style={{ color: wallet.color }}
            >
                {/* SINISTRA: Due triangolini + Linea che si allunga */}
                <div className="flex items-center gap-1 shrink-0 opacity-80">
                    <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current"><polygon points="0,0 10,5 0,10" /></svg>
                    <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current"><polygon points="0,0 10,5 0,10" /></svg>
                </div>
                <div className="h-px flex-1 bg-current opacity-30"></div>

                {/* CENTRO: Testo */}
                <span className="shrink-0 px-1">Today</span>

                {/* DESTRA: Linea che si allunga + Due triangolini */}
                <div className="h-px flex-1 bg-current opacity-30"></div>
                <div className="flex items-center gap-1 shrink-0 opacity-80">
                    <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current"><polygon points="10,0 0,5 10,10" /></svg>
                    <svg viewBox="0 0 10 10" className="w-2 h-2 fill-current"><polygon points="10,0 0,5 10,10" /></svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {subscriptions.sort((a, b) => new Date(a.nextExecutionDate).getTime() - new Date(b.nextExecutionDate).getTime()).map(sub => (
                    <SubscriptionCard
                        key={sub.id}
                        subscription={sub}
                        date={sub.nextExecutionDate}
                        onClick={() => onEditSubscription && onEditSubscription(sub)}
                    />
                ))}
            </div>
        </div>
    );
};