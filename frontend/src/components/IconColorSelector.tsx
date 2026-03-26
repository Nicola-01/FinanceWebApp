import React, {useState} from "react";
import type {IconKey} from "../utils/icons.ts";
import {IconSelector} from "./IconSelector.tsx";
import {ColorSelector} from "./ColorSelector.tsx";

interface ColorSelectorPropsProps {
    ref?: React.Ref<HTMLDivElement>;
    iconValue: IconKey;
    onChangeIcon: (icon: IconKey) => void;
    colorValue: string;
    onChangeColor: (color: string) => void;
}

export const IconColorSelector = ({
                                      ref, iconValue, onChangeIcon, colorValue, onChangeColor
                                  }: ColorSelectorPropsProps) => {
    const [activeTab, setActiveTab] = useState<'icons' | 'colors'>('icons');

    return (
        <div
            ref={ref}
            // RIMOSSI TUTTI GLI ABSOLUTE. Ora è un blocco pulito.
            className="w-[260px] flex flex-col items-center gap-4 rounded-xl border border-app-border bg-[#1a1a1a] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.2s_ease-out]">

            <div className="flex w-full rounded-lg bg-app-input p-1">
                <button
                    type="button"
                    className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'icons' ? 'bg-app-surface text-white shadow-sm' : 'text-app-muted hover:text-white'}`}
                    onClick={() => setActiveTab('icons')}
                >
                    Icons
                </button>
                <button
                    type="button"
                    className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'colors' ? 'bg-app-surface text-white shadow-sm' : 'text-app-muted hover:text-white'}`}
                    onClick={() => setActiveTab('colors')}
                >
                    Colors
                </button>
            </div>

            <div className="flex w-full justify-center">
                {activeTab === 'icons' ? (
                    <IconSelector value={iconValue} onChange={onChangeIcon} currentColor={colorValue}/>
                ) : (
                    <ColorSelector value={colorValue} onChange={onChangeColor}/>
                )}
            </div>
        </div>
    );
}