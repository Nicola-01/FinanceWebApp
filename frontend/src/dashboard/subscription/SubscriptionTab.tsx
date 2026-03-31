import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faCalendarDays, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { SubscriptionModal, type SubscriptionModalHandle } from "../../modals/SubscriptionModal.tsx";
import { SubscriptionDetailsModal, type SubscriptionDetailsModalHandle } from "../../modals/SubscriptionDetailsModal.tsx";
import type { CurrencyCode } from "../../utils/currencies.ts";
import { SubscriptionCalendar } from "./SubscriptionCalendar.tsx";
import { SubscriptionList } from "./SubscriptionList.tsx";

type ViewMode = 'list' | 'calendar';

export const SubscriptionTab = () => {

    const { subscriptions, fetchData, isLoading } = useWalletContext();
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const { wallet, tags } = useWalletContext();

    const modalRef = useRef<SubscriptionModalHandle>(null);
    const detailsModalRef = useRef<SubscriptionDetailsModalHandle>(null);

    return (
        <div className="flex flex-col flex-1 h-full animate-[fadeIn_0.3s_ease-out]">

            {/* Header: Titolo, Toggle Viste, Bottone Aggiungi */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">

                {/* Toggle View */}
                <div
                    className="flex items-center rounded-lg bg-app-input border border-app-border p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-app-surface text-app-text shadow-sm' : 'text-app-muted hover:text-app-text'
                            }`}
                    >
                        <FontAwesomeIcon icon={faList} />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-app-surface text-[#00bfff] shadow-sm' : 'text-app-muted hover:text-[#00bfff]'
                            }`}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} />
                        Calendar
                    </button>
                </div>

                {/* Pulsante Nuova Subscription */}
                <button
                    onClick={() => modalRef.current?.openModal()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00bfff] to-[#00ff7f] text-black font-bold text-sm hover:opacity-90 transition-opacity w-full sm:w-auto shadow-lg shadow-[#00bfff]/20"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    New Subscription
                </button>
            </div>

            {/* Container Dinamico delle Viste */}
            <div className="flex-1 overflow-hidden relative">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-app-muted">
                        Loading subscriptions...
                    </div>
                ) : (
                    viewMode === 'list'
                        ? <SubscriptionList subscriptions={subscriptions} onEditSubscription={(sub) => detailsModalRef.current?.openModal(sub)} />
                        : <SubscriptionCalendar subscriptions={subscriptions} onEditSubscription={(sub) => detailsModalRef.current?.openModal(sub)} />
                )}
            </div>

            <SubscriptionModal
                ref={modalRef}
                wallet={wallet}
                tags={tags}
                baseCurrency={wallet.currency as CurrencyCode}
                onSuccess={fetchData}
            />
            
            <SubscriptionDetailsModal
                ref={detailsModalRef}
                wallet={wallet}
                onDeleteSuccess={() => fetchData()}
                onEditRequest={(sub) => modalRef.current?.openModal(sub)}
            />
        </div>
    );
};