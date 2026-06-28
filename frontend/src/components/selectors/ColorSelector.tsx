import React, {useState} from 'react';
import {Wheel} from '@uiw/react-color'; // We removed 'Circle'

// 12 color presets in chromatic order (Rainbow)
const FLUO_PRESETS = [
    'var(--color-app-red)', // Red
    '#ff8c00', // Orange
    '#ffff00', // Yellow
    '#adff2f', // Yellow-Green
    'var(--color-app-green)', // Fluo Green
    '#00ffff', // Cyan
    'var(--color-app-sky)', // Light Blue
    '#1e90ff', // Blue (New)
    '#8a2be2', // Purple
    '#ff00ff', // Magenta
    '#ff1493', // Hot Pink (New)
    '#ff0055'  // Dark Pink/Red
];

interface ColorSelectorProps {
    value: string;
    onChange: (color: string) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({value, onChange}) => {
    const [showWheel, setShowWheel] = useState(false);

    return (
        <div className="flex w-full flex-col items-center gap-4">

            {/* Nuova Griglia Colori Custom */}
            {!showWheel &&
                <div className="grid grid-cols-6 gap-3">
                    {FLUO_PRESETS.map((color) => {
                        const isSelected = value === color;
                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => onChange(color)}
                                className="h-7 w-7 rounded-full transition-all duration-200 hover:scale-110"
                                style={{
                                    // If selected becomes black, otherwise takes the color
                                    backgroundColor: isSelected ? 'var(--color-app-card)' : color,
                                    // Colored border when selected
                                    border: isSelected ? `4px solid ${color}` : 'none',
                                    // Optional fluo \"Glow\" effect around the selected button
                                    boxShadow: isSelected ? `0 0 10px ${color}80` : 'none',
                                }}
                                title={color}
                            />
                        );
                    })}
                </div>
            }

            {/* Separatore Custom */}

            <div className="flex w-full items-center gap-3">
                <div className="h-[1px] flex-grow bg-app-surface"/>
                <button
                    type="button"
                    className="text-[0.7rem] font-medium uppercase tracking-wider text-app-muted transition-colors hover:theme-text-default"
                    onClick={() => setShowWheel(!showWheel)}
                >
                    {showWheel ? "Preset" : "Custom"}
                </button>
                <div className="h-[1px] flex-grow bg-app-surface"/>
            </div>

            {/* Ruota Colori Avanzata */}
            {showWheel && (
                <div className="animate-[fadeIn_0.2s_ease-out] pt-2">
                    <Wheel color={value} onChange={(c) => onChange(c.hex)} width={160} height={160}/>
                </div>
            )}
        </div>
    );
};