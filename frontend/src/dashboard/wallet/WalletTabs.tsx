import React from 'react';
import type { TabType } from "./WalletContext.tsx";
import { useWalletContext } from "./WalletContext.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faReceipt,
    faChartPie,
    faChartLine,
    faGear
} from '@fortawesome/free-solid-svg-icons';

export const WalletTabs: React.FC = () => {
    const { activeTab, setActiveTab, wallet } = useWalletContext();
    const walletColor = wallet.color;

    // Aggiunta la proprietà "icon" per ogni tab
    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'transactions', label: 'Transactions', icon: faReceipt },
        { id: 'category', label: 'Categories', icon: faChartPie },
        { id: 'statistics', label: 'Statistics', icon: faChartLine },
        { id: 'settings', label: 'Settings', icon: faGear }
    ];

    const getTabClass = (tabId: TabType) => {
        const isActive = activeTab === tabId;
        return `relative flex-1 flex items-center justify-center gap-2 whitespace-nowrap min-w-max px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`;
    };

    return (
        <div className="flex w-full items-center gap-2 border-b border-white/10 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] xl:sticky xl:top-0 xl:z-[90] xl:bg-[#0d0d12]/90 xl:backdrop-blur-md xl:-mx-8 xl:px-8 xl:w-[calc(100%+4rem)] xl:pt-6 xl:pb-0">
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