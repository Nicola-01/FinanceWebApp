import React, { useState } from 'react';
import { Wheel, Circle } from '@uiw/react-color';

// 10 preset di colori Fluo/Neon
const FLUO_PRESETS = [
    '#00ff7f', '#00ffff', '#ff00ff', '#ff0055', '#ffff00',
    '#ff4d4d', '#8a2be2', '#00bfff', '#ff8c00', '#adff2f'
];

interface ColorSelectorProps {
    value: string;
    onChange: (color: string) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showWheel, setShowWheel] = useState(false);

    return (
        <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Theme Color</label>
            <div className="relative flex h-[48px] items-center rounded-xl border border-white/10 bg-white/5 p-2">
                <div
                    className="h-full w-full cursor-pointer rounded-lg border border-white/20 shadow-sm transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: value }}
                    onClick={() => setIsOpen(!isOpen)}
                />

                {isOpen && (
                    <div className="absolute left-0 top-[55px] z-50">
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="relative z-50 flex w-[230px] flex-col items-center gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 shadow-2xl">
                            <Circle
                                colors={FLUO_PRESETS}
                                color={value}
                                onChange={(c) => {
                                    onChange(c.hex);
                                    setIsOpen(false);
                                }}
                            />
                            <div className="mt-1 flex w-full items-center gap-3">
                                <div className="h-[1px] flex-grow bg-white/10" />
                                <button
                                    type="button"
                                    className="text-[0.7rem] font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white"
                                    onClick={() => setShowWheel(!showWheel)}
                                >
                                    {showWheel ? "Less" : "Custom"}
                                </button>
                                <div className="h-[1px] flex-grow bg-white/10" />
                            </div>
                            {showWheel && (
                                <div className="animate-[fadeIn_0.2s_ease-out] pt-2">
                                    <Wheel color={value} onChange={(c) => onChange(c.hex)} width={160} height={160} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};