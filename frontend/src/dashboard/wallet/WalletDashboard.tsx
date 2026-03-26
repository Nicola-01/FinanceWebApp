import React from 'react';
import { TransactionsTab } from '../transaction/TransactionsTab';
import { StatisticsTab } from '../statistics/StatisticsTab';
import type { Wallet } from '../../utils/types';
import { Icon } from "../../components/Icon.tsx";
import { WalletTabs } from "./WalletTabs.tsx";
// import { WalletMenu } from "./WalletMenu.tsx";
import { TagsTab } from "../tag/TagsTab.tsx";
import { SettingsTab } from "../settings/SettingsTab.tsx";
import { WalletProvider, useWalletContext } from './WalletContext.tsx';
import { TransactionsFilter } from '../transaction/TransactionsFilter.tsx';

interface WalletDashboardProps {
    _wallet: Wallet;
    onWalletDelete: () => void;
    onWalletUpdate: () => void;
}

const WalletDashboardContent: React.FC = () => {
    const { wallet, activeTab } = useWalletContext();

    return (
        <div className="flex flex-col h-full w-full max-w-350 mx-auto p-4 lg:p-8 xl:overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl flex items-center gap-3 font-bold text-white mb-1">
                        <Icon icon={wallet.icon} color={wallet.color} />
                        {wallet.name}
                    </h1>
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white/50 uppercase">
                        Currency: {wallet.currency}
                    </span>
                </div>
                {/*<WalletMenu />*/}
            </div>

            <WalletTabs />

            {(activeTab === 'transactions' || activeTab === 'statistics') &&
                <TransactionsFilter />
            }

            <div className="flex-1 overflow-hidden">
                {activeTab === 'transactions' && <TransactionsTab />}
                {activeTab === 'category' && <TagsTab />}
                {activeTab === 'statistics' && <StatisticsTab />}
                {activeTab === 'settings' && <SettingsTab />}
            </div>

        </div>
    );
};

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ _wallet, onWalletDelete, onWalletUpdate }) => {
    return (
        <WalletProvider _wallet={_wallet} onWalletDelete={onWalletDelete} onWalletUpdate={onWalletUpdate}>
            <WalletDashboardContent />
        </WalletProvider>
    );
};