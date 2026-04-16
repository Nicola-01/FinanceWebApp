import React from 'react';
import {TransactionsTab} from '../transaction/TransactionsTab';
import {StatisticsTab} from '../statistics/StatisticsTab';
import {SubscriptionTab} from '../subscription/SubscriptionTab';
import type {Wallet} from '../../utils/types';
import {Icon} from "../../components/Icon.tsx";
import {WalletTabs} from "./WalletTabs.tsx";
// import { WalletMenu } from "./WalletMenu.tsx";
import {TagsTab} from "../tag/TagsTab.tsx";
import {SettingsTab} from "../settings/SettingsTab.tsx";
import {WalletProvider, useWalletContext} from './WalletContext.tsx';
import {TransactionsFilter} from "../transaction/TransactionsFilter.tsx";

interface WalletDashboardProps {
    _wallet: Wallet;
    onWalletDelete: () => void;
    onWalletUpdate: () => void;
}

const WalletHeader: React.FC = () => {
    const {wallet, activeTab} = useWalletContext();

    return (
        <>
            <div className="px-4 lg:px-8 pt-4 lg:pt-8 flex-col shrink-0 items-center justify-between mb-2 md:mb-4">
                <h1 className="text-3xl flex items-center gap-3 font-bold text-app-text mb-1">
                    <Icon icon={wallet.icon} color={wallet.color}/>
                    {wallet.name}
                </h1>
                <span className="text-xs font-bold px-2 py-1 bg-app-input rounded-md text-app-muted uppercase">
                    Currency: {wallet.currency}
                </span>
            </div>

            <WalletTabs/>

            {(activeTab === 'transactions' || activeTab === 'category') &&
                <TransactionsFilter/>
            }
        </>
    );
};

const WalletBody: React.FC = () => {
    const {activeTab} = useWalletContext();

    return (
        <div
            className="flex flex-col flex-1 min-h-full w-full max-w-350 mx-auto relative px-2 sm:px-4 lg:px-8 pb-4 lg:pb-8">
            {activeTab === 'transactions' && <TransactionsTab/>}
            {activeTab === 'subscription' && <SubscriptionTab/>}
            {activeTab === 'category' && <TagsTab/>}
            {activeTab === 'statistics' && <StatisticsTab/>}
            {activeTab === 'settings' && <SettingsTab/>}
        </div>
    );
};

export const WalletDashboard: React.FC<WalletDashboardProps> = ({_wallet, onWalletDelete, onWalletUpdate}) => {
    return (
        <WalletProvider _wallet={_wallet} onWalletDelete={onWalletDelete} onWalletUpdate={onWalletUpdate}>
            <WalletHeader/>
            <WalletBody/>
        </WalletProvider>
    );
};