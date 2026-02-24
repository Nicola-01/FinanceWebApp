import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {ICONS, type IconKey} from '../../utils/icons.ts';
import type {Wallet} from "../../utils/types.ts";

interface WalletProps {
    wallet: Wallet;
    isSelected: boolean;
    onClick: () => void;
}

const WalletCard: React.FC<WalletProps> = ({wallet, isSelected, onClick}) => {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md transition-all hover:-translate-y-1 shrink-0 w-65 xl:w-full
            ${isSelected ? 'bg-white/10' : 'border-white/10 bg-[rgba(20,20,20,0.6)]'}`}
            style={{
                borderColor: isSelected ? wallet.color : 'transparent',
                boxShadow: isSelected
                    ? `0 0 20px ${wallet.color}26` // '26' in esadecimale è circa il 15% di opacità
                    : 'none'
            }}
        >
            <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5 text-xl"
                style={{color: wallet.color || '#00ff7f'}}
            >
                <FontAwesomeIcon icon={ICONS[wallet.icon as IconKey] || ICONS['wallet']}/>
            </div>

            <div className="flex flex-1 flex-col min-w-0">
                <h4 className={'m-0 truncate font-mono text-sm font-extrabold transition-colors'}
                    style={{
                        color: isSelected ? wallet.color : 'rgba(255, 255, 255, 0.5)'
                    }}
                >
                    {wallet.name}
                </h4>
                <p className="text-xs text-white/40 uppercase tracking-widest">{wallet.currency}</p>
            </div>
        </div>
    );
};

export default WalletCard;