import React, {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faEllipsisVertical,
    faPenToSquare,
    faRotateRight,
    faShareNodes,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import {ShareWalletModal, type ShareWalletModalHandle} from "../../modals/ShareWalletModal.tsx";
import type {Wallet} from "../../utils/types.ts";

interface WalletMenuProps {
    wallet: Wallet;
    isLoading: boolean;
    onRefresh: () => Promise<void>;
    onWalletDelete: () => void;
}

export const WalletMenu: React.FC<WalletMenuProps> = ({wallet, isLoading, onWalletDelete, onRefresh}) => {

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const shareModalRef = useRef<ShareWalletModalHandle>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
                // RIMOSSO: shareModalRef.current?.openModal();
                // Non vuoi aprire il modale ogni volta che clicchi fuori dal menu!
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    return (
        <>
            <div className="relative" ref={menuRef}>

                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${showMenu ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                    title="Wallet Options"
                >
                    <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg"/>
                </button>

                {showMenu && (
                    <div
                        className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.1s_ease-out]">

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                            onClick={() => {
                                setShowMenu(false);
                                // 3. APRI IL MODALE QUI!
                                shareModalRef.current?.openModal();
                            }}
                        >
                            <FontAwesomeIcon icon={faShareNodes} className="w-4"/>
                            Share Wallet
                        </button>

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                            onClick={() => {
                                setShowMenu(false);
                                onRefresh();
                            }}
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faRotateRight}
                                             className={`w-4 ${isLoading ? "animate-spin text-[#00ff7f]" : ""}`}/>
                            Refresh Data
                        </button>

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-white/70 transition-colors hover:bg-amber-400/20 hover:text-amber-400"
                            onClick={() => setShowMenu(false)}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-4"/>
                            Edit Wallet
                        </button>

                        <div className="my-1 h-px w-full bg-white/5"/>

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-[#ff4d4d]/70 transition-colors hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d]"
                            onClick={() => {
                                setShowMenu(false);
                                onWalletDelete();
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} className="w-4"/>
                            Delete Wallet
                        </button>

                    </div>
                )}
            </div>

            <ShareWalletModal ref={shareModalRef} wallet={wallet}/>
        </>
    );
}