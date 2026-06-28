import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faList } from '@fortawesome/free-solid-svg-icons';
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { SubscriptionModal, type SubscriptionModalHandle } from "../../modals/subscription/SubscriptionModal.tsx";
import { SubscriptionDetailsModal, type SubscriptionDetailsModalHandle } from "../../modals/subscription/SubscriptionDetailsModal.tsx";
import type { CurrencyCode } from "../../utils/currencies.ts";
import { SubscriptionCalendar } from "./SubscriptionCalendar.tsx";
import { SubscriptionList } from "./SubscriptionList.tsx";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton.tsx";

type ViewMode = 'list' | 'calendar';

export const SubscriptionTab = () => {

    const { subscriptions, fetchData, isLoading } = useWalletContext();
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const { wallet, tags } = useWalletContext();

    const modalRef = useRef<SubscriptionModalHandle>(null);
    const detailsModalRef = useRef<SubscriptionDetailsModalHandle>(null);

    return (
        <div className="flex flex-col flex-1 animate-[fadeIn_0.3s_ease-out]">

            {/* Header: Titolo, Toggle Viste, Bottone Aggiungi */}
            <div className="flex items-center justify-end gap-4 mb-6">

                {/* Toggle View */}
                <div
                    className="grid grid-cols-2 rounded-lg bg-app-input border border-app-border p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 px-8 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-app-surface shadow-sm' : 'text-app-muted'
                            }`}
                        style={viewMode === 'list' ? { color: wallet.color } : undefined}
                        onMouseEnter={(e) => {
                            if (viewMode !== 'list') e.currentTarget.style.color = wallet.color;
                        }}
                        onMouseLeave={(e) => {
                            if (viewMode !== 'list') e.currentTarget.style.color = '';
                        }}
                    >
                        <FontAwesomeIcon icon={faList} />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex-1 flex items-center justify-center gap-2 px-8 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-app-surface shadow-sm' : 'text-app-muted'
                            }`}
                        style={viewMode === 'calendar' ? { color: wallet.color } : undefined}
                        onMouseEnter={(e) => {
                            if (viewMode !== 'calendar') e.currentTarget.style.color = wallet.color;
                        }}
                        onMouseLeave={(e) => {
                            if (viewMode !== 'calendar') e.currentTarget.style.color = '';
                        }}
                    >
                        <FontAwesomeIcon icon={faCalendarDays} />
                        Calendar
                    </button>
                </div>

                {/* Pulsante Nuova Subscription */}
                {/*<button*/}
                {/*    onClick={() => modalRef.current?.openModal()}*/}
                {/*    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-app-sky to-[#00ff7f] text-black font-bold text-sm hover:opacity-90 transition-opacity w-full sm:w-auto shadow-lg shadow-app-sky/20"*/}
                {/*>*/}
                {/*    <FontAwesomeIcon icon={faPlus} />*/}
                {/*    New Subscription*/}
                {/*</button>*/}


            </div>

            {/* Container Dinamico delle Viste */}
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i}
                                    className="flex items-center justify-between p-4 bg-app-input rounded-2xl animate-pulse">
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                        <div className="h-12 w-12 rounded-xl bg-app-surface shrink-0" />
                                        <div className="flex flex-col gap-2">
                                            <div className="h-4 w-24 bg-app-surface rounded-md" />
                                            <div className="h-3 w-16 bg-app-surface/60 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 pl-3">
                                        <div className="h-5 w-20 bg-app-surface rounded-md" />
                                        <div className="h-3 w-14 bg-app-surface/40 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    viewMode === 'list'
                        ? <SubscriptionList subscriptions={subscriptions}
                            onEditSubscription={(sub) => detailsModalRef.current?.openModal(sub)} />
                        : <SubscriptionCalendar
                            subscriptions={subscriptions}
                            onEditSubscription={(sub, date) => detailsModalRef.current?.openModal(sub, date)}
                            onAddSubscription={(date) => modalRef.current?.openModal(undefined, date)}
                        />
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

            {
                (viewMode === 'list') &&
                <FloatingActionButton
                    wallet={wallet}
                    onClick={() => modalRef.current?.openModal()}
                    label="New Subscription" />
            }
        </div>
    );
};