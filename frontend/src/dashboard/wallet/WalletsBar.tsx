import React, { useRef, useState } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CreateWalletModal, type CreateWalletModalHandle } from "../../modals/CreateWalletModal.tsx";
import WalletCard, { WalletCardUI } from "./WalletCard.tsx"; // Importiamo anche la UI!
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
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 animate-pulse shrink-0 w-65 xl:w-full">
        <div className="h-12 w-12 rounded-full bg-white/10 shrink-0"></div>
        <div className="flex flex-1 flex-col min-w-0 gap-2">
            <div className="h-4 w-3/4 rounded bg-white/10"></div>
            <div className="h-5 w-10 rounded-md bg-white/10 mt-0.5"></div>
        </div>
    </div>
);

export const WalletsBar: React.FC<WalletsAreaProps> = ({
                                                           wallets, setWallets, loading, selectedWalletId, onSelectWallet, onRefreshAll
                                                       }) => {
    const walletModal = useRef<CreateWalletModalHandle>(null);

    // Stato per tracciare QUALE wallet stiamo trascinando
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        // Su PC (Mouse): il drag parte se ti muovi di 5 pixel
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        // Su Mobile (Touch): il drag parte SOLO se tieni premuto per 250 millisecondi
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5, // Permette un leggerissimo tremolio del dito mentre si tiene premuto
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null); // Resetta l'ID
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWallets((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Troviamo il wallet attivo per passarlo all'ologramma
    const activeWallet = activeId ? wallets.find(w => w.id === activeId) : null;

    return (
        // 1. DndContext ora avvolge TUTTO, diventando il padre principale
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
            autoScroll={false}
        >
            {/* 2. Il div della WalletsBar con il backdrop-blur è ora un figlio */}
            <div className="
                flex flex-row overflow-x-auto overflow-y-hidden w-full p-4 gap-4
                xl:flex-col xl:w-[320px] xl:shrink-0 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden xl:border-r xl:border-white/5 xl:p-6
                bg-white/2 backdrop-blur-md
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
                        className="cursor-pointer group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 transition-all hover:bg-white/10 hover:border-white/50 w-[260px] xl:w-[272px] shrink-0 text-left"
                    >
                        <div className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl text-white/40 group-hover:text-[#00ff7f] transition-colors shrink-0">
                            <FontAwesomeIcon icon={faPlus} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="m-0 text-sm font-medium text-white/40 group-hover:text-white transition-colors truncate">
                                Add New Wallet
                            </h4>
                        </div>
                    </button>
                )}

                <CreateWalletModal ref={walletModal} onSuccess={onRefreshAll} />
            </div>

            {/* 3. L'OLOGRAMMA È LIBERO! Ora è fuori dal div con il blur e si posizionerà perfettamente */}
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