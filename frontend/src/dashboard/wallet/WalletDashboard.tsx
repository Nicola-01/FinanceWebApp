import React, {useEffect, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEllipsisVertical, faPenToSquare, faRotateRight, faTrash} from '@fortawesome/free-solid-svg-icons';
import {TransactionsTab} from '../transaction/TransactionsTab';
import {StatisticsTab} from '../statistics/StatisticsTab'; // <-- 1. IMPORTA LA NUOVA TAB
import type {Wallet, Transaction} from '../../utils/types';
import type {CurrencyCode} from '../../utils/currencies';
import {TagsTab} from "../tag/TagsTab.tsx";
import {Icon} from "../../components/Icon.tsx";
import api from "../../api/axiosConfig.ts";
import {triggerToast} from "../../components/ToastNotification.tsx";

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


    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getTabClass = (tabName: TabType) => {
        const isActive = activeTab === tabName;
        return `relative px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-[#00ff7f]' : 'text-white/40 hover:text-white/70'}`;
    };

    useEffect(() => {
        fetchData()
    }, []);

    const fetchData = async () => {
        // Controllo di sicurezza: se non c'è l'id, non facciamo le chiamate
        if (!wallet?.id) return;

        try {
            setIsLoading(true);

            // Eseguiamo le chiamate in parallelo per la massima velocità!
            const [wRes, txRes] = await Promise.all([
                api.get(`/wallets/${wallet.id}`),
                api.get(`/transactions/${wallet.id}`)
            ]);

            // Aggiorniamo gli stati del componente con i dati ricevuti
            setWallet(wRes.data);
            setTransactions(txRes.data);

        } catch (err) {
            triggerToast(`Error loading data for ${wallet.name}`, false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    return (
        <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-4 lg:p-8 overflow-hidden">

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

                {/* Contenitore Relativo per il Menu a Discesa */}
                <div className="relative" ref={menuRef}>

                    {/* Pulsante Tre Pallini */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${showMenu ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                        title="Wallet Options"
                    >
                        <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg"/>
                    </button>

                    {/* Menu a discesa */}
                    {showMenu && (
                        <div
                            className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.1s_ease-out]">

                            <button
                                onClick={() => {
                                    setShowMenu(false); /* TODO: Logica Edit */
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-amber-400/20 hover:text-amber-400"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} className="w-4"/>
                                Edit Wallet
                            </button>

                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    fetchData();
                                }}
                                disabled={isLoading}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faRotateRight}
                                                 className={`w-4 ${isLoading ? "animate-spin text-[#00ff7f]" : ""}`}/>
                                Refresh Data
                            </button>

                            {/* Divisore */}
                            <div className="my-1 h-px w-full bg-white/5"/>

                            <button
                                onClick={() => {
                                    setShowMenu(false); /* TODO: Logica Delete */
                                    onWalletDelete();
                                }}
                                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-[#ff4d4d]/70 transition-colors hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d]"
                            >
                                <FontAwesomeIcon icon={faTrash} className="w-4"/>
                                Delete Wallet
                            </button>

                        </div>
                    )}
                </div>
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
                        onRefresh={fetchData}
                    />
                )}

                {activeTab === 'tags' && (<TagsTab walletId={wallet.id}/>)}

                {activeTab === 'statistics' && (
                    <StatisticsTab transactions={transactions}/>
                )}
            </div>
        </div>
    );
};