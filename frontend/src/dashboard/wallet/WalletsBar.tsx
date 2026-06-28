import React, { useRef, useState, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CreateWalletModal, type CreateWalletModalHandle } from "../../modals/wallet/CreateWalletModal.tsx";
import WalletCard, { WalletCardUI } from "./WalletCard.tsx";
import type { Wallet } from '../../utils/types.ts';

import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
    type DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

interface WalletsAreaProps {
    wallets: Wallet[];
    setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
    loading: boolean;
    selectedWalletId?: string;
    onSelectWallet: (id: string) => void;
    onRefreshAll: () => void;
}

const WalletSkeleton = () => (
    <div
        className="flex items-center gap-4 p-4 rounded-2xl border border-app-border bg-app-input animate-pulse shrink-0 w-65 xl:w-full">
        <div className="h-12 w-12 rounded-full bg-app-surface shrink-0"></div>
        <div className="flex flex-1 flex-col min-w-0 gap-2">
            <div className="h-4 w-3/4 rounded bg-app-surface"></div>
            <div className="h-5 w-10 rounded-md bg-app-surface mt-0.5"></div>
        </div>
    </div>
);

export const WalletsBar: React.FC<WalletsAreaProps> = ({
    wallets,
    setWallets,
    loading,
    selectedWalletId,
    onSelectWallet,
    onRefreshAll
}) => {
    const walletModal = useRef<CreateWalletModalHandle>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // --- 1. SINCRONIZZAZIONE ORDINE INIZIALE DA LOCAL STORAGE ---
    useEffect(() => {
        if (!loading && wallets.length > 0) {
            const savedOrderStr = localStorage.getItem('wallet_order');

            if (savedOrderStr) {
                try {
                    const savedOrder = JSON.parse(savedOrderStr) as string[];

                    // Riordiniamo i wallet basandoci sugli ID salvati nel localStorage
                    const sortedWallets = [...wallets].sort((a, b) => {
                        const indexA = savedOrder.indexOf(a.id);
                        const indexB = savedOrder.indexOf(b.id);

                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;

                        return indexA - indexB;
                    });

                    const currentIds = wallets.map(w => w.id).join(',');
                    const sortedIds = sortedWallets.map(w => w.id).join(',');

                    // Creiamo la nuova stringa pulita per il localStorage
                    const newOrderStr = JSON.stringify(sortedWallets.map(w => w.id));

                    // 1. Aggiorniamo la UI SOLO se l'ordine degli elementi è diverso
                    if (currentIds !== sortedIds) {
                        setWallets(sortedWallets);
                    }

                    // 2. Puliamo il Local Storage se ci sono disallineamenti
                    // (es. wallet eliminati o wallet nuovi aggiunti in coda)
                    if (newOrderStr !== savedOrderStr) {
                        localStorage.setItem('wallet_order', newOrderStr);
                    }
                } catch (e) {
                    console.error("Error parsing wallet_order from localStorage", e);
                }
            }
        }
    }, [wallets, loading, setWallets]);


    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // --- 2. SALVATAGGIO ORDINE AL TERMINE DEL DRAG ---
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWallets((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const newArray = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('wallet_order', JSON.stringify(newArray.map(w => w.id)));
                return newArray;
            });
        }
    };

    const handleCreate = (walletId: string) => {
        onRefreshAll()
        onSelectWallet(walletId)
    }

    const activeWallet = activeId ? wallets.find(w => w.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
        >
            <div className="
                flex flex-row overflow-x-auto overflow-y-hidden w-full p-4 gap-4
                xl:flex-col xl:w-[320px] xl:shrink-0 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden xl:border-r xl:border-app-border xl:p-6
                bg-app-bg/5 backdrop-blur-md
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            ">
                {loading && wallets.length === 0 ? (
                    <>
                        <WalletSkeleton />
                        <WalletSkeleton />
                        <WalletSkeleton />
                    </>
                ) : (
                    <SortableContext items={wallets.map(w => w.id)} strategy={rectSortingStrategy}>
                        {wallets.map((wallet) => (
                            <WalletCard
                                key={wallet.id}
                                wallet={wallet}
                                isSelected={wallet.id === selectedWalletId}
                                onClick={() => onSelectWallet(wallet.id)}
                            />
                        ))}
                    </SortableContext>
                )}

                {!loading && (
                    <button
                        onClick={() => walletModal.current?.openModal()}
                        className="cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-app-border bg-app-input transition-all hover:bg-app-border hover:border-app-green/50 w-[260px] xl:w-[272px] shrink-0 text-left"
                    >
                        <div
                            className="flex justify-center items-center w-12 h-12 rounded-full bg-app-surface text-xl text-app-muted group-hover:text-app-green transition-colors shrink-0">
                            <FontAwesomeIcon icon={faPlus} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="m-0 text-sm font-bold text-app-muted group-hover:text-app-text transition-colors truncate">
                                Add New Wallet
                            </h4>
                        </div>
                    </button>
                )}

                <CreateWalletModal ref={walletModal} onSuccess={handleCreate} />
            </div>

            <DragOverlay dropAnimation={{ duration: 250, easing: 'ease-out' }}>
                {activeWallet ? (
                    <WalletCardUI
                        wallet={activeWallet}
                        isSelected={activeWallet.id === selectedWalletId}
                        isOverlay={true}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};