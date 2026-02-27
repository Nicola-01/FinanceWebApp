import React, {useEffect, useRef, useState} from 'react';
import {TransactionsTab} from '../transaction/TransactionsTab';
import {StatisticsTab} from '../statistics/StatisticsTab'; // <-- 1. IMPORTA LA NUOVA TAB
import type {Wallet, Transaction} from '../../utils/types';
import type {CurrencyCode} from '../../utils/currencies';
import {TagsTab} from "../tag/TagsTab.tsx";
import {Icon} from "../../components/Icon.tsx";
import api from "../../api/axiosConfig.ts";
import {triggerToast} from "../../components/ToastNotification.tsx";
import {WalletTabs} from "./WalletTabs.tsx";
import {WalletMenu} from "./WalletMenu.tsx";
import {ShareWalletModal, type ShareWalletModalHandle} from "../../modals/ShareWalletModal.tsx";

type TabType = 'transactions' | 'tags' | 'statistics' | 'budget';

interface WalletDashboardProps {
    _wallet: Wallet;
    onWalletDelete: () => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({_wallet, onWalletDelete}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [wallet, setWallet] = useState<Wallet>(_wallet)
    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const shareModalRef = useRef<ShareWalletModalHandle>(null);

    useEffect(() => {
        fetchData()
    }, [_wallet.id]);

    const fetchData = async () => {
        // 2. Usiamo _wallet.id invece di wallet.id (perché wallet è lo stato vecchio)
        if (!_wallet?.id) return;

        try {
            setIsLoading(true);

            const [wRes, txRes] = await Promise.all([
                api.get(`/wallets/${_wallet.id}`),
                api.get(`/transactions/${_wallet.id}`)
            ]);

            setWallet(wRes.data);
            setTransactions(txRes.data);

        } catch (err) {
            triggerToast(`Error loading data for ${_wallet.name}`, false);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex flex-col h-full w-full max-w-350 mx-auto p-4 lg:p-8 overflow-hidden">

            {/* INTESTAZIONE: Nome Wallet e Menu Azioni */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl flex items-center gap-3 font-bold text-white mb-1">
                        <Icon icon={wallet.icon} color={wallet.color}/>
                        {wallet.name}
                    </h1>
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white/50 uppercase">
                        Currency: {wallet.currency}
                    </span>
                </div>

                <WalletMenu
                    wallet={wallet}
                    isLoading={isLoading}
                    onWalletDelete={onWalletDelete}
                    onRefresh={fetchData}
                />
            </div>

            <WalletTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                walletColor={wallet.color}
            />

            <div className="flex-1 overflow-hidden">
                {activeTab === 'transactions' && (
                    <TransactionsTab
                        transactions={transactions}
                        wallet={wallet}
                        baseCurrency={wallet.currency as CurrencyCode}
                        onRefresh={fetchData}
                    />
                )}

                {activeTab === 'tags' && (<TagsTab walletId={wallet.id}/>)}

                {activeTab === 'statistics' && (
                    <StatisticsTab transactions={transactions}/>
                )}
            </div>

            <ShareWalletModal ref={shareModalRef} wallet={wallet}/>
        </div>
    );
};