import React, {useState} from "react";
import type {WalletIconKey} from "../utils/walletIcons.ts";
import {IconSelector} from "./IconSelector.tsx";
import {ColorSelector} from "./ColorSelector.tsx";

interface ColorSelectorPropsProps {
    ref?: React.Ref<HTMLDivElement>;
    iconValue: WalletIconKey;
    onChangeIcon: (icon: WalletIconKey) => void;
    colorValue: string;
    onChangeColor: (color: string) => void;
}

export const IconColorSelector =
    ({
         ref,
         iconValue,
         onChangeIcon,
         colorValue,
         onChangeColor
     }: ColorSelectorPropsProps) => {
        // Stato per gestire il tab attivo
        const [activeTab, setActiveTab] = useState<'icons' | 'colors'>('icons');

        return (
            <div
                ref={ref}
                className="absolute left-1/2 top-[75px] z-50 w-full max-w-[260px] -translate-x-1/2 mx-auto flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 shadow-2xl animate-[fadeIn_0.2s_ease-out]">

                {/* Selettore Tabs: ICONS | COLORS */}
                <div className="flex w-full rounded-lg bg-white/5 p-1">
                    <button
                        type="button"
                        className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'icons' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                        onClick={() => setActiveTab('icons')}
                    >
                        Icons
                    </button>
                    <button
                        type="button"
                        className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'colors' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                        onClick={() => setActiveTab('colors')}
                    >
                        Colors
                    </button>
                </div>

                {/* Contenuto Dinamico */}
                <div className="flex w-full justify-center">
                    {activeTab === 'icons' ? (
                        // Passiamo il colorValue all'IconSelector!
                        <IconSelector value={iconValue} onChange={onChangeIcon} currentColor={colorValue}/>
                    ) : (
                        <ColorSelector value={colorValue} onChange={onChangeColor}/>
                    )}
                </div>
            </div>
        );
    }