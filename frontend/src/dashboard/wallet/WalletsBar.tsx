import React, {useRef} from 'react';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {CreateWalletModal, type CreateWalletModalHandle} from "../../modals/CreateWalletModal.tsx";
import WalletCard from "./WalletCard.tsx";
import type {Wallet} from '../../utils/types.ts';

interface WalletsAreaProps {
    wallets: Wallet[];
    setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
    loading: boolean;
    selectedWalletId?: string;
    onSelectWallet: (id: string) => void;
    onRefreshAll: () => void;
}

// --- COMPONENTE SKELETON INTERNO ---
const WalletSkeleton = () => (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse shrink-0 w-65 xl:w-full">
        {/* Skeleton Icona */}
        <div className="h-12 w-12 rounded-full bg-white/10 shrink-0"></div>

        {/* Skeleton Testi */}
        <div className="flex flex-1 flex-col min-w-0 gap-2">
            <div className="h-4 w-3/4 rounded bg-white/10"></div>
            {/* Simula il badge della valuta (es. EUR) */}
            <div className="h-5 w-10 rounded-md bg-white/10 mt-0.5"></div>
        </div>
    </div>
);

export const WalletsBar: React.FC<WalletsAreaProps> =
    ({
         wallets,
         loading,
         selectedWalletId,
         onSelectWallet,
         onRefreshAll
     }) => {
        const walletModal = useRef<CreateWalletModalHandle>(null);

        return (
            <div
                className="
                    flex flex-row overflow-x-auto w-full p-4 gap-4
                    xl:flex-col xl:w-[320px] xl:h-screen xl:overflow-y-auto xl:overflow-x-hidden
                    xl:border-r xl:border-white/5 xl:p-6
                    bg-white/2 backdrop-blur-md
                    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                {/* 1. SE IN CARICAMENTO INIZIALE: Mostra solo gli Skeleton */}
                {loading && wallets.length === 0 ? (
                    <>
                        <WalletSkeleton />
                        <WalletSkeleton />
                        <WalletSkeleton />
                    </>
                ) : (
                    <>
                        {/* 2. LISTA WALLET REALI */}
                        {wallets.map((wallet) => (
                            <WalletCard
                                key={wallet.id}
                                wallet={wallet}
                                isSelected={wallet.id === selectedWalletId}
                                onClick={() => onSelectWallet(wallet.id)}
                            />
                        ))}

                        {/* 3. PULSANTE ADD (Mostrato solo quando i dati sono caricati) */}
                        <button
                            onClick={() => walletModal.current?.openModal()}
                            className="cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/50 w-65 xl:w-full shrink-0 text-left"
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
                    </>
                )}

                <CreateWalletModal ref={walletModal} onSuccess={onRefreshAll}/>
            </div>
        );
    };