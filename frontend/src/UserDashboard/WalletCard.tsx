import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {WALLET_ICONS, type WalletIconKey} from '../utils/walletIcons';
import type {Wallet} from "../utils/types.ts";

interface WalletProps {
    wallet: Wallet;
    isSelected: boolean;
    onClick: () => void;
}

const WalletCard: React.FC<WalletProps> = ({wallet, isSelected, onClick}) => {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md transition-all hover:-translate-y-1 shrink-0 w-[260px] xl:w-full
            ${isSelected ? 'border-[#00ff7f] bg-white/10 shadow-[0_0_15px_rgba(0,255,127,0.1)]' : 'border-white/10 bg-[rgba(20,20,20,0.6)]'}`}
        >
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5 text-xl"
                style={{color: wallet.color || '#00ff7f'}}
            >
                <FontAwesomeIcon icon={WALLET_ICONS[wallet.icon as WalletIconKey] || WALLET_ICONS['wallet']}/>
            </div>

            <div className="flex flex-1 flex-col min-w-0">
                <h4 className={`m-0 truncate font-mono text-sm font-extrabold transition-colors ${isSelected ? 'text-[#00ff7f]' : 'text-white/50'}`}>
                    {wallet.name}
                </h4>
                <p className="text-xs text-white/40 uppercase tracking-widest">{wallet.currency}</p>
            </div>
        </div>
    );
};

export default WalletCard;