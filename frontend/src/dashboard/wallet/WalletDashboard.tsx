import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faRotateRight} from '@fortawesome/free-solid-svg-icons';
import {TransactionsTab} from '../transaction/TransactionsTab';
import {StatisticsTab} from '../statistics/StatisticsTab'; // <-- 1. IMPORTA LA NUOVA TAB
import type {Wallet, Transaction} from '../../utils/types';
import type {CurrencyCode} from '../../utils/currencies';
import {TagsTab} from "../tag/TagsTab.tsx";

interface WalletDashboardProps {
    wallet: Wallet;
    transactions: Transaction[];
    onRefresh: () => void;
    isRefreshing: boolean;
}

type TabType = 'transactions' | 'tags' | 'statistics' | 'budget';

export const WalletDashboard: React.FC<WalletDashboardProps> = ({wallet, transactions, onRefresh, isRefreshing}) => {
    const [activeTab, setActiveTab] = useState<TabType>('transactions');

    const getTabClass = (tabName: TabType) => {
        const isActive = activeTab === tabName;
        return `relative px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-[#00ff7f]' : 'text-white/40 hover:text-white/70'}`;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-4 lg:p-8 overflow-hidden">

            {/* INTESTAZIONE: Nome Wallet e Bottone Refresh */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{wallet.name} Dashboard</h1>
                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white/50 uppercase">
                        Currency: {wallet.currency}
                    </span>
                </div>

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                    title="Refresh Data"
                >
                    <FontAwesomeIcon icon={faRotateRight}
                                     className={isRefreshing ? "animate-spin text-[#00ff7f]" : ""}/>
                </button>
            </div>

            <div className="flex items-center gap-2 border-b border-white/10 mb-6">
                <button onClick={() => setActiveTab('transactions')} className={getTabClass('transactions')}>
                    Transactions {activeTab === 'transactions' && <span
                    className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>}
                </button>
                <button onClick={() => setActiveTab('tags')} className={getTabClass('tags')}>
                    Tags {activeTab === 'tags' && <span
                    className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>}
                </button>
                <button onClick={() => setActiveTab('statistics')} className={getTabClass('statistics')}>
                    Statistics {activeTab === 'statistics' && <span
                    className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>}
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'transactions' && (
                    <TransactionsTab
                        transactions={transactions}
                        walletId={wallet.id}
                        baseCurrency={wallet.currency as CurrencyCode}
                        onRefresh={onRefresh}
                    />
                )}

                {activeTab === 'tags' && (<TagsTab walletId={wallet.id}/>)}

                {activeTab === 'statistics' && (
                    <StatisticsTab transactions={transactions} />
                )}
            </div>
        </div>
    );
};