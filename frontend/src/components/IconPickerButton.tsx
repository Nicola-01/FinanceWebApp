import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WALLET_ICONS, type WalletIconKey } from "../utils/walletIcons";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { IconColorSelector } from "./IconColorSelector";

interface IconPickerButtonProps {
    icon: WalletIconKey;
    color: string;
    onIconChange: (icon: WalletIconKey) => void;
    onColorChange: (color: string) => void;
    size?: "sm" | "md";
    isOpen: boolean;
    onToggle: (open: boolean) => void;
}

export const IconPickerButton: React.FC<IconPickerButtonProps> = ({
                                                                      icon, color, onIconChange, onColorChange, size = "md", isOpen, onToggle
                                                                  }) => {
    // Adatta dimensioni e posizione in base a se è un tag padre (md) o figlio (sm)
    const sizeClasses = size === "sm" ? "h-6 w-6 rounded-md text-xs" : "h-10 w-10 rounded-lg text-lg";
    const popupTop = size === "sm" ? "top-8" : "top-12";

    return (
        <div className="relative shrink-0">
            <div
                onClick={() => onToggle(!isOpen)}
                className={`flex items-center justify-center bg-white/10 shadow-sm cursor-pointer hover:scale-110 transition-transform ${sizeClasses}`}
                style={{ color }}
                title="Change Icon & Color">
                <FontAwesomeIcon icon={WALLET_ICONS[icon] || faTags} />
            </div>

            {isOpen && (
                <>
                    {/* Sfondo invisibile per chiudere cliccando fuori */}
                    <div className="fixed inset-0 z-40" onClick={() => onToggle(false)} />

                    {/* Il popup vero e proprio */}
                    <div className={`absolute ${popupTop} left-0 z-50`}>
                        <IconColorSelector
                            iconValue={icon}
                            onChangeIcon={onIconChange}
                            colorValue={color}
                            onChangeColor={onColorChange}
                        />
                    </div>
                </>
            )}
        </div>
    );
};