import React, {useEffect, useRef, useState} from 'react';
import {TransactionsTab} from '../transaction/TransactionsTab';
import {StatisticsTab} from '../statistics/StatisticsTab';
import type {Wallet, Transaction, Tag} from '../../utils/types';
import type {CurrencyCode} from '../../utils/currencies';
import {Icon} from "../../components/Icon.tsx";
import api from "../../api/axiosConfig.ts";
import {triggerToast} from "../../components/ToastNotification.tsx";
import {WalletTabs} from "./WalletTabs.tsx";
import {WalletMenu} from "./WalletMenu.tsx";
import {ShareWalletModal, type ShareWalletModalHandle} from "../../modals/ShareWalletModal.tsx";
import {TagsTab} from "../tag/TagsTab.tsx";

type TabType = 'transactions' | 'tags' | 'statistics' | 'budget';

interface WalletDashboardProps {
    _wallet: Wallet;
    onWalletDelete: () => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({_wallet, onWalletDelete}) => {
    const [wallet, setWallet] = useState<Wallet>(_wallet)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const shareModalRef = useRef<ShareWalletModalHandle>(null);

    useEffect(() => {
        const controller = new AbortController();

        setWallet(_wallet);
        setTransactions([]);
        setTags([]);

        fetchData(controller.signal);

        return () => {
            controller.abort();
        };
    }, [_wallet.id]);

    const fetchData = async (signal?: AbortSignal) => {
        if (!_wallet?.id) return;
        try {
            setIsLoading(true);

            const [walletRes, transactionRes, tagRes] = await Promise.all([
                api.get(`/wallets/${_wallet.id}`, { signal }),
                api.get(`/transactions/${_wallet.id}`, { signal }),
                api.get(`/tags/${_wallet.id}`, { signal })
            ]);

            setWallet(walletRes.data);
            setTransactions(transactionRes.data);
            setTags(tagRes.data);
        } catch (err: any) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') {
                console.log("Fetch aborted: wallet changed");
                return;
            }
            triggerToast(`Error loading data for ${_wallet.name}`, false);
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    };

    // --- NUOVE FUNZIONI CENTRALIZZATE PER I TAGS ---

    const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
        try {
            const response = await api.post(`/tags/${wallet.id}`, newTag);
            // Aggiunge il tag allo stato locale senza ricaricare la pagina
            setTags(prev => [...prev, response.data]);
            triggerToast("Tag created successfully!", true);
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error creating tag", false);
            return false;
        }
    };

    const handleUpdateTag = async (oldName: string, updatedTag: Partial<Tag>): Promise<boolean> => {
        try {
            await api.put(`/tags/${wallet.id}/${encodeURIComponent(oldName)}`, updatedTag);

            setTags(prev => prev.map(tag => {
                // Aggiorna il tag stesso
                if (tag.name === oldName) {
                    return {...tag, ...updatedTag} as Tag;
                }
                // Se abbiamo rinominato un "genitore", aggiorniamo anche il "parentName" dei suoi figli!
                if (tag.parentName === oldName && updatedTag.name && updatedTag.name !== oldName) {
                    return {...tag, parentName: updatedTag.name};
                }
                return tag;
            }));

            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating tag", false);
            return false;
        }
    };

    const handleDeleteTag = async (tagName: string): Promise<boolean> => {
        try {
            await api.delete(`/tags/${wallet.id}/${encodeURIComponent(tagName)}`);
            // Rimuove il tag e tutti i suoi diretti figli dallo stato locale
            setTags(prev => prev.filter(tag => tag.name !== tagName && tag.parentName !== tagName));
            triggerToast("Tag deleted!", true);
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error deleting tag", false);
            return false;
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-350 mx-auto p-4 lg:p-8 overflow-hidden">
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
                <WalletMenu wallet={wallet} isLoading={isLoading} onWalletDelete={onWalletDelete}
                            onRefresh={fetchData}/>
            </div>

            <WalletTabs activeTab={activeTab} setActiveTab={setActiveTab} walletColor={wallet.color}/>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'transactions' && (
                    <TransactionsTab transactions={transactions} wallet={wallet}
                                     baseCurrency={wallet.currency as CurrencyCode} onRefresh={fetchData} isLoading={isLoading}/>
                )}

                {activeTab === 'tags' && (
                    <TagsTab
                        tags={tags}
                        onAddTag={handleAddTag}
                        onUpdateTag={handleUpdateTag}
                        onDeleteTag={handleDeleteTag}
                        isLoading={isLoading}
                    />
                )}

                {activeTab === 'statistics' && (<StatisticsTab transactions={transactions}/>)}
            </div>

            <ShareWalletModal ref={shareModalRef} wallet={wallet}/>
        </div>
    );
};