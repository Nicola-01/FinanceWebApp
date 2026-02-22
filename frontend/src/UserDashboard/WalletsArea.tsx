import React, {useRef} from 'react';
import api from '../api/axiosConfig';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {triggerToast} from '../components/ToastNotification';
import {CreateWalletModal, type CreateWalletModalHandle} from "../modals/CreateWalletModal.tsx";
import type {DeleteModalHandle} from "../modals/DeleteConfirmationModal.tsx";
import WalletCard from "./WalletCard.tsx";
import type {Wallet} from '../utils/types.ts';

interface WalletsAreaProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>;
    wallets: Wallet[];
    setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
    loading: boolean;
    selectedWalletId?: string;
    onSelectWallet: (id: string) => void;
    onRefreshAll: () => void;
}

export const WalletsArea: React.FC<WalletsAreaProps> =
    ({
         // @ts-ignore
         deleteModalRef,
         wallets,
         setWallets,
         loading,
         selectedWalletId,
         onSelectWallet,
         onRefreshAll
     }) => {
        const walletModal = useRef<CreateWalletModalHandle>(null);

        // @ts-ignore
        const handleConfirmDelete = async (walletId: string) => {
            try {
                await api.delete(`/wallets/${walletId}`);
                setWallets(prev => prev.filter(w => w.id !== walletId));
                triggerToast("Deleted!", true);
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error deleting.", false);
            }
        };

        return (
            <div
                className="flex flex-row overflow-x-auto w-full p-4 gap-4 xl:flex-col xl:w-[320px] xl:h-screen xl:overflow-y-auto xl:overflow-x-hidden xl:border-r xl:border-white/10 xl:p-6">

                {wallets.map((wallet) => (
                    <WalletCard
                        key={wallet.id}
                        wallet={wallet}
                        isSelected={wallet.id === selectedWalletId}
                        onClick={() => onSelectWallet(wallet.id)}

                    />
                ))}

                <button
                    onClick={() => walletModal.current?.openModal()}
                    className="cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/50 w-[260px] shrink-0 text-left"
                >
                    <div
                        className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl text-white/40 group-hover:text-[#00ff7f] transition-colors shrink-0">
                        <FontAwesomeIcon icon={faPlus}/>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="m-0 text-sm font-medium text-white/40 group-hover:text-white transition-colors truncate">
                            Add New Wallet
                        </h4>
                    </div>
                </button>

                {loading && wallets.length === 0 && (
                    <div className="text-white/20 animate-pulse mt-4">Loading wallets...</div>
                )}

                <CreateWalletModal ref={walletModal} onSuccess={onRefreshAll}/>
            </div>
        );
    };