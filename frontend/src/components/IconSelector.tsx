import React from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {type IconKey, ICONS} from '../utils/icons.ts';

interface IconSelectorProps {
    value: IconKey;
    onChange: (icon: IconKey) => void;
    currentColor: string; // <-- Added to receive the updated color
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, currentColor }) => {
    return (
        <div className="w-full">
            <div className="custom-scrollbar grid max-h-[190px] grid-cols-6 gap-2 overflow-y-auto pr-1">
                {(Object.keys(ICONS) as IconKey[]).map((key) => {
                    const isActive = value === key;
                    return (
                        <div
                            key={key}
                            className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-lg transition-all hover:scale-110 ${isActive ? '' : 'text-app-muted hover:bg-app-surface'}`}
                            // Apply dynamic color inline
                            style={{
                                color: isActive ? currentColor : undefined,
                                backgroundColor: isActive ? `${currentColor}33` : undefined, // 33 is ~20% opacity in HEX
                            }}
                            onClick={() => onChange(key)}
                            title={key}
                        >
                            <FontAwesomeIcon icon={ICONS[key]} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};