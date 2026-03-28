import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPlay, faPause, faCheck, faTag } from '@fortawesome/free-solid-svg-icons';
import type { Subscription } from '../../utils/types';
import {Icon} from "../../components/Icon.tsx";

interface SubscriptionCardProps {
    subscription: Subscription;
    onClick?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onClick }) => {
    // Helper per tradurre lo status in colori/icone
    const getStatusStyle = (status: Subscription['status']) => {
        switch (status) {
            case 'ACTIVE': return { bg: 'bg-[#00ff7f]/10', text: 'text-[#00ff7f]', icon: faPlay, label: 'Active' };
            case 'PAUSED': return { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: faPause, label: 'Paused' };
            case 'COMPLETED': return { bg: 'bg-white/10', text: 'text-white/50', icon: faCheck, label: 'Completed' };
            default: return { bg: 'bg-white/10', text: 'text-white', icon: faPlay, label: status };
        }
    };

    // Helper per formattare la frequenza (es. "Every 1 MONTHLY" -> "Monthly", "Every 2 WEEKLY" -> "Every 2 weeks")
    const formatFrequency = (interval: number, type: string) => {
        const typeStr = type.toLowerCase().replace('ly', ''); // monthly -> month, weekly -> week
        if (interval === 1) {
            return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(); // "Monthly", "Weekly"
        }
        return `Every ${interval} ${typeStr}s`; // "Every 2 weeks"
    };

    const statusStyle = getStatusStyle(subscription.status);
    const isIncome = subscription.type === 'INCOME';

    return (
        <div
            onClick={onClick}
            className="flex flex-col justify-between p-5 rounded-2xl bg-app-card border border-app-border hover:border-white/20 transition-all cursor-pointer group shadow-lg"
        >
            {/* Header: Tag & Status Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    {subscription.tag ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
                            <Icon icon={subscription.tag.icon || 'faTags'} color={subscription.tag.colorHex || '#fff'} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-white/40">
                            <FontAwesomeIcon icon={faTag} />
                        </div>
                    )}
                    <span className="text-sm font-medium text-app-muted truncate max-w-[120px]">
                        {subscription.tag?.name || 'No Tag'}
                    </span>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text}`}>
                    <FontAwesomeIcon icon={statusStyle.icon} />
                    {statusStyle.label}
                </div>
            </div>

            {/* Body: Name & Amount */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-app-text mb-1 group-hover:text-[#00bfff] transition-colors truncate">
                    {subscription.name}
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${isIncome ? 'text-[#00ff7f]' : 'text-white'}`}>
                        {isIncome ? '+' : '-'}{subscription.amount}
                    </span>
                    <span className="text-sm text-app-muted font-medium">
                        {subscription.originalCurrency}
                    </span>
                </div>
            </div>

            {/* Footer: Frequency & Next Date */}
            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-app-muted">Frequency:</span>
                    <span className="font-semibold text-app-text">
                        {formatFrequency(subscription.frequencyInterval, subscription.frequencyType)}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-app-muted">Next date:</span>
                    <span className={`font-semibold flex items-center gap-1.5 ${subscription.status === 'ACTIVE' ? 'text-amber-400' : 'text-app-muted'}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {subscription.nextExecutionDate ? new Date(subscription.nextExecutionDate).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
};