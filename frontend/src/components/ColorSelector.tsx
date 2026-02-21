import React, {useState} from 'react';
import {Wheel} from '@uiw/react-color'; // Abbiamo rimosso 'Circle'

// 12 preset di colori in ordine cromatico (Arcobaleno)
const FLUO_PRESETS = [
    '#ff4d4d', // Rosso
    '#ff8c00', // Arancione
    '#ffff00', // Giallo
    '#adff2f', // Verde-Giallo
    '#00ff7f', // Verde Fluo
    '#00ffff', // Ciano
    '#00bfff', // Azzurro
    '#1e90ff', // Blu (Nuovo)
    '#8a2be2', // Viola
    '#ff00ff', // Magenta
    '#ff1493', // Rosa Shocking (Nuovo)
    '#ff0055'  // Rosa/Rosso scuro
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
                                    // Se selezionato diventa nero, altrimenti prende il colore
                                    backgroundColor: isSelected ? '#1a1a1a' : color,
                                    // Bordo colorato quando selezionato
                                    border: isSelected ? `4px solid ${color}` : 'none',
                                    // Effetto "Glow" fluo opzionale intorno al bottone selezionato
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
                <div className="h-[1px] flex-grow bg-white/10"/>
                <button
                    type="button"
                    className="text-[0.7rem] font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white"
                    onClick={() => setShowWheel(!showWheel)}
                >
                    {showWheel ? "Preset" : "Custom"}
                </button>
                <div className="h-[1px] flex-grow bg-white/10"/>
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