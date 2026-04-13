import React from 'react';
import type { TabType } from "./WalletContext.tsx";
import { useWalletContext } from "./WalletContext.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faReceipt,
    faChartPie,
    faChartLine,
    faGear, faCalendarDays
} from '@fortawesome/free-solid-svg-icons';

export const WalletTabs: React.FC = () => {
    const { activeTab, setActiveTab, wallet } = useWalletContext();
    const walletColor = wallet.color;

    // Aggiunta la proprietà "icon" per ogni tab
    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'transactions', label: 'Transactions', icon: faReceipt },
        { id: 'subscription', label: 'Subscription', icon: faCalendarDays },
        { id: 'category', label: 'Categories', icon: faChartPie },
        { id: 'statistics', label: 'Statistics', icon: faChartLine },
        { id: 'settings', label: 'Settings', icon: faGear }
    ];

    const getTabClass = (tabId: TabType) => {
        const isActive = activeTab === tabId;
        return `relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap min-w-max px-2 md:px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-app-text' : 'text-app-muted hover:text-app-text'
            }`;
    };

    return (
        <div className="flex shrink-0 w-full items-center gap-2 border-b border-app-border mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sticky top-0 z-90 bg-app-bg/90 backdrop-blur-md px-4 lg:px-8 pt-4 pb-0">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={getTabClass(tab.id)}
                    style={{ color: activeTab === tab.id ? walletColor : '' }}
                >
                    {/* Render dell'icona */}
                    <FontAwesomeIcon
                        icon={tab.icon}
                        className={`text-lg ${activeTab === tab.id ? '' : 'opacity-60 group-hover:opacity-100'}`}
                    />

                    {tab.label}

                    {activeTab === tab.id && (
                        <span
                            className="absolute -bottom-px left-0 w-full h-0.5 transition-all duration-300"
                            style={{
                                backgroundColor: walletColor,
                                boxShadow: `0 0 10px ${walletColor}`
                            }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
};