import React, { useState } from 'react';
import { TransactionsTab } from './TransactionsTab';
// import { StatisticsTab } from './StatisticsTab'; // Da sviluppare in futuro
// import { BudgetTab } from './BudgetTab'; // Da sviluppare in futuro

type TabType = 'transactions' | 'statistics' | 'budget' | 'periodical';

export const WalletDashboard: React.FC = () => {
    // Stato per tracciare il tab attivo (default: transazioni)
    const [activeTab, setActiveTab] = useState<TabType>('transactions');

    // Funzione helper per le classi dei pulsanti tab
    const getTabClass = (tabName: TabType) => {
        const isActive = activeTab === tabName;
        return `
            relative px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300
            ${isActive ? 'text-[#00ff7f]' : 'text-white/40 hover:text-white/70'}
        `;
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-4 lg:p-8 overflow-hidden">

            {/* Header del Dashboard Selezionato (I Tab) */}
            <div className="flex items-center gap-2 border-b border-white/10 mb-6">
                <button onClick={() => setActiveTab('transactions')} className={getTabClass('transactions')}>
                    Transactions
                    {activeTab === 'transactions' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>
                    )}
                </button>

                <button onClick={() => setActiveTab('statistics')} className={getTabClass('statistics')}>
                    Statistics
                    {activeTab === 'statistics' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>
                    )}
                </button>

                <button onClick={() => setActiveTab('budget')} className={getTabClass('budget')}>
                    Budget
                    {activeTab === 'budget' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>
                    )}
                </button>


                <button onClick={() => setActiveTab('periodical')} className={getTabClass('periodical')}>
                    Periodical
                    {activeTab === 'periodical' && (
                        <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00ff7f] shadow-[0_0_10px_#00ff7f]"></span>
                    )}
                </button>
            </div>

            {/* Contenuto del Tab Attivo */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'transactions' && <TransactionsTab />}
                {activeTab === 'statistics' && <div className="text-white/50 p-8 text-center border border-dashed border-white/10 rounded-xl">Area Statistiche (Coming Soon)</div>}
                {activeTab === 'budget' && <div className="text-white/50 p-8 text-center border border-dashed border-white/10 rounded-xl">Area Budget (Coming Soon)</div>}
                {activeTab === 'periodical' && <div className="text-white/50 p-8 text-center border border-dashed border-white/10 rounded-xl">Area Periodical (Coming Soon)</div>}
            </div>

        </div>
    );
};