import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { WALLET_ICONS, type WalletIconKey } from '../utils/walletIcons';

interface IconSelectorProps {
    value: WalletIconKey;
    onChange: (icon: WalletIconKey) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Icon</label>

            <div
                className={`flex h-[48px] w-full cursor-pointer items-center justify-between rounded-xl border bg-[#1a1a1a] px-4 text-white outline-none transition-all ${isOpen ? 'border-[#00ff7f]' : 'border-white/10 hover:border-white/30'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={WALLET_ICONS[value]} className="text-lg text-white/80" />
                    <span className="text-sm capitalize">{value.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ff7f]' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-[75px] z-50 w-[240px] rounded-xl border border-white/10 bg-[#1a1a1a] p-3 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                        <div className="grid grid-cols-5 gap-2">
                            {(Object.keys(WALLET_ICONS) as WalletIconKey[]).map((key) => (
                                <div
                                    key={key}
                                    className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-lg transition-all hover:scale-110 hover:bg-white/10 ${value === key ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'text-white/60'}`}
                                    onClick={() => {
                                        onChange(key);
                                        setIsOpen(false);
                                    }}
                                    title={key}
                                >
                                    <FontAwesomeIcon icon={WALLET_ICONS[key]} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};