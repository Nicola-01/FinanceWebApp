import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {WALLET_ICONS, type WalletIconKey} from '../utils/walletIcons';
import {faShareNodes, faTrash} from "@fortawesome/free-solid-svg-icons";
import type {Wallet} from "../utils/types.ts";

interface WalletProps {
    wallet: Wallet
    onDelete: (wallet: Wallet) => void;
}

const WalletCard: React.FC<WalletProps> = ({wallet, onDelete}) => {
    return (
        <div className="flex w-full shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.6)] p-4 backdrop-blur-md transition-transform hover:-translate-y-1">

            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5 text-xl"
                style={{ color: wallet.color || '#00ff7f' }}
            >
                <FontAwesomeIcon icon={WALLET_ICONS[wallet.icon as WalletIconKey] || WALLET_ICONS['wallet']} />
            </div>

            {/* Testo centrale - Aggiunto 'flex-1' per espanderlo e spingere i bottoni a destra */}
            <div className="flex flex-1 flex-col min-w-0">
                <h4 className="m-0 truncate font-mono text-sm font-medium text-white/50">
                    {wallet.name}
                </h4>
            </div>


            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // onShare(wallet);
                    }}
                    className="group relative z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-white/5 text-white/40 transition-all duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    title="Share Wallet"
                >
                    <FontAwesomeIcon icon={faShareNodes} className="text-sm" />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(wallet);
                    }}
                    className="group relative z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-transparent bg-white/5 text-white/40 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    title="Delete Wallet"
                >
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
            </div>

        </div>
    );
};

export default WalletCard;