import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { WALLET_ICONS, type WalletIconKey } from '../utils/walletIcons';

interface IconSelectorProps {
    value: WalletIconKey;
    onChange: (icon: WalletIconKey) => void;
    currentColor: string; // <-- Aggiunto per ricevere il colore aggiornato
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, currentColor }) => {
    return (
        <div className="w-full">
            <div className="custom-scrollbar grid max-h-[190px] grid-cols-6 gap-2 overflow-y-auto pr-1">
                {(Object.keys(WALLET_ICONS) as WalletIconKey[]).map((key) => {
                    const isActive = value === key;
                    return (
                        <div
                            key={key}
                            className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-lg transition-all hover:scale-110 ${isActive ? '' : 'text-white/60 hover:bg-white/10'}`}
                            // Applichiamo il colore dinamico inline
                            style={{
                                color: isActive ? currentColor : undefined,
                                backgroundColor: isActive ? `${currentColor}33` : undefined, // 33 è ~20% di opacità in HEX
                            }}
                            onClick={() => onChange(key)}
                            title={key}
                        >
                            <FontAwesomeIcon icon={WALLET_ICONS[key]} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};