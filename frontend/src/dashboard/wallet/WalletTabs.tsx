import React from 'react';
import type { TabType } from "./WalletContext.tsx";
import { useWalletContext } from "./WalletContext.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faReceipt,
    faChartPie,
    faTags,
    faGear
} from '@fortawesome/free-solid-svg-icons';

export const WalletTabs: React.FC = () => {
    const { activeTab, setActiveTab, wallet } = useWalletContext();
    const walletColor = wallet.color;

    // Aggiunta la proprietà "icon" per ogni tab
    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'transactions', label: 'Transactions', icon: faReceipt },
        { id: 'statistics', label: 'Statistics', icon: faChartPie },
        { id: 'category', label: 'Categories', icon: faTags },
        { id: 'settings', label: 'Settings', icon: faGear }
    ];

    const getTabClass = (tabId: TabType) => {
        const isActive = activeTab === tabId;
        return `relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap min-w-max px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`;
    };

    return (
        // Aggiunto "w-full" al container principale
        <div className="flex w-full items-center gap-2 border-b border-white/10 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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