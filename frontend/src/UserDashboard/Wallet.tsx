import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface WalletProps {
    title: string;
    icon: IconDefinition;
    color?: string;
}

const Wallet: React.FC<WalletProps> = ({ title, icon, color }) => {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.6)] backdrop-blur-md transition-transform hover:-translate-y-1 w-full">
            <div
                className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl shrink-0"
                style={{ color: color || '#00ff7f' }}
            >
                <FontAwesomeIcon icon={icon} />
            </div>
            <div className="flex flex-col min-w-0"> {/* min-w-0 serve per troncare il testo se troppo lungo */}
                <h4 className="m-0 text-sm font-medium text-white/50 truncate">
                    {title}
                </h4>
            </div>
        </div>
    );
};

export default Wallet;