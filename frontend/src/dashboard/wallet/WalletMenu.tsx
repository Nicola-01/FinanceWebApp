import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEllipsisVertical,
    faPenToSquare,
    faRotateRight,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import { useWalletContext } from "./WalletContext.tsx";

export const WalletMenu: React.FC = () => {
    const { isLoading, fetchData, setActiveTab, onWalletDelete } = useWalletContext();
    const onRefresh = () => fetchData();

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // const shareModalRef = useRef<ShareWalletModalHandle>(null);

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
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${showMenu ? 'bg-app-surface theme-border-default theme-text-default' : 'bg-app-input border-app-border text-app-muted hover:bg-app-surface hover:theme-text-default'}`}
                    title="Wallet Options"
                >
                    <FontAwesomeIcon icon={faEllipsisVertical} className="text-lg" />
                </button>

                {showMenu && (
                    <div
                        className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-app-border bg-app-card p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.1s_ease-out]">

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:bg-app-surface hover:theme-text-default disabled:opacity-50"
                            onClick={() => {
                                setShowMenu(false);
                                onRefresh();
                            }}
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faRotateRight}
                                className={`w-4 ${isLoading ? "animate-spin text-app-green" : ""}`} />
                            Refresh Data
                        </button>

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-muted transition-colors hover:theme-bg-warning-light hover:theme-text-warning"
                            onClick={() => {
                                setShowMenu(false);
                                setActiveTab('settings');
                            }}
                        >
                            <FontAwesomeIcon icon={faPenToSquare} className="w-4" />
                            Edit Wallet
                        </button>

                        <div className="my-1 h-px w-full bg-app-input" />

                        <button
                            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm font-semibold text-app-red/70 transition-colors hover:bg-app-red/20 hover:text-app-red"
                            onClick={() => {
                                setShowMenu(false);
                                onWalletDelete();
                            }}
                        >
                            <FontAwesomeIcon icon={faTrash} className="w-4" />
                            Delete Wallet
                        </button>

                    </div>
                )}
            </div>

            {/*<ShareWalletModal ref={shareModalRef} wallet={wallet}/>*/}
        </>
    );
}