import React from 'react';
import type { Subscription } from '../../utils/types';
import { SubscriptionCard } from './SubscriptionCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';

interface SubscriptionListProps {
    subscriptions: Subscription[];
    onEditSubscription?: (subscription: Subscription) => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onEditSubscription }) => {

    if (subscriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 text-app-muted">
                    <FontAwesomeIcon icon={faRepeat} className="text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-app-text mb-1">No subscriptions found</h3>
                <p className="text-sm text-app-muted max-w-sm">
                    You don't have any recurring transactions yet. Click "New Subscription" to add your first one.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10 overflow-y-auto custom-scrollbar h-full pr-2 animate-[fadeIn_0.3s_ease-out]">
            {subscriptions.map(sub => (
                <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onClick={() => onEditSubscription && onEditSubscription(sub)}
                />
            ))}
        </div>
    );
};