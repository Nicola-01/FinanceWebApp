import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { WALLET_ICONS, type WalletIconKey } from '../utils/walletIcons';

interface WalletProps {
    title: string;
    icon: string | IconDefinition; // Supporta sia stringhe (emoji/lettere) che oggetti FA
    color?: string;
}

const Wallet: React.FC<WalletProps> = ({ title, icon, color }) => {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-transform hover:-translate-y-1 w-full shrink-0">
            <div
                className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl shrink-0 overflow-hidden"
                style={{ color: color || '#00ff7f' }}
            >
                <FontAwesomeIcon icon={WALLET_ICONS[icon as WalletIconKey] || WALLET_ICONS['wallet']} />
            </div>
            <div className="flex flex-col min-w-0">
                <h4 className="m-0 text-sm font-medium text-white/50 truncate font-mono">
                    {title}
                </h4>
            </div>

        </div>
    );
};

export default Wallet;