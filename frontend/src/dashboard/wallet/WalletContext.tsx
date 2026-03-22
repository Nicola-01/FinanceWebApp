import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Tag, Transaction, Wallet } from '../../utils/types';
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ToastNotification";

export type TabType = 'transactions' | 'category' | 'statistics' | 'budget' | 'share' | 'settings';

interface WalletContextType {
    wallet: Wallet;
    transactions: Transaction[];
    tags: Tag[];
    isLoading: boolean;
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    fetchData: (signal?: AbortSignal) => Promise<void>;
    handleAddTag: (newTag: Partial<Tag>) => Promise<boolean>;
    handleUpdateTag: (oldName: string, updatedTag: Partial<Tag>) => Promise<boolean>;
    handleDeleteTag: (tagName: string) => Promise<boolean>;
    handleUpdateWallet: (updatedWallet: Partial<Wallet>) => Promise<boolean>;
    onWalletDelete: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }
    return context;
};

interface WalletProviderProps {
    _wallet: Wallet;
    onWalletDelete: () => void;
    onWalletUpdate: () => void;
    children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ _wallet, onWalletDelete, onWalletUpdate, children }) => {
    const [wallet, setWallet] = useState<Wallet>(_wallet);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const validTabs: TabType[] = ['transactions', 'category', 'statistics', 'budget', 'share', 'settings'];
    const urlTab = searchParams.get('tab') as TabType;
    const activeTab: TabType = validTabs.includes(urlTab) ? urlTab : 'transactions';

    useEffect(() => {
        if (!urlTab || !validTabs.includes(urlTab)) {
            setSearchParams({ tab: 'transactions' }, { replace: true });
        }
    }, [urlTab, setSearchParams]);

    const setActiveTab = (newTab: TabType) => {
        setSearchParams({ tab: newTab });
    };

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
                return;
            }
            triggerToast(`Error loading data for ${_wallet.name}`, false);
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    };

    const handleAddTag = async (newTag: Partial<Tag>): Promise<boolean> => {
        try {
            const response = await api.post(`/tags/${wallet.id}`, newTag);
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
                if (tag.name === oldName) {
                    return { ...tag, ...updatedTag } as Tag;
                }
                if (tag.parentName === oldName && updatedTag.name && updatedTag.name !== oldName) {
                    return { ...tag, parentName: updatedTag.name };
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
            setTags(prev => prev.filter(tag => tag.name !== tagName && tag.parentName !== tagName));
            triggerToast("Tag deleted!", true);
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error deleting tag", false);
            return false;
        }
    };

    const handleUpdateWallet = async (updatedInfo: Partial<Wallet>): Promise<boolean> => {
        try {
            const res = await api.put(`/wallets/${wallet.id}`, updatedInfo);
            setWallet(res.data);
            triggerToast("Wallet updated successfully!", true);
            onWalletUpdate();
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating wallet", false);
            return false;
        }
    };

    return (
        <WalletContext.Provider value={{
            wallet, transactions, tags, isLoading, activeTab, setActiveTab, fetchData, handleAddTag, handleUpdateTag, handleDeleteTag, handleUpdateWallet, onWalletDelete
        }}>
            {children}
        </WalletContext.Provider>
    );
};
