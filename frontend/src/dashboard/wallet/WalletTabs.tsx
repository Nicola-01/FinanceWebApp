import React from 'react';
import type { TabType } from "./WalletContext.tsx";
import { useWalletContext } from "./WalletContext.tsx";

export const WalletTabs: React.FC = () => {
    const { activeTab, setActiveTab, wallet } = useWalletContext();
    const walletColor = wallet.color;

    const tabs: { id: TabType; label: string }[] = [
        { id: 'transactions', label: 'Transactions' },
        { id: 'statistics', label: 'Statistics' },
        { id: 'category', label: 'Categories' },
        { id: 'share', label: 'Share' },
        { id: 'settings', label: 'Settings' }
    ];

    const getTabClass = (tabId: TabType) => {
        const isActive = activeTab === tabId;
        return `relative shrink-0 whitespace-nowrap px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`;
    };

    return (
        <div className="flex items-center gap-2 border-b border-white/10 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={getTabClass(tab.id)}
                    style={{ color: activeTab === tab.id ? walletColor : '' }}
                >
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