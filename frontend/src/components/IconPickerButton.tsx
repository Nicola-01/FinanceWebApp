import React, {useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {type IconKey, ICONS} from "../utils/icons.ts";
import {faTags} from "@fortawesome/free-solid-svg-icons";
import {IconColorSelector} from "./IconColorSelector";

interface IconPickerButtonProps {
    icon: IconKey;
    color: string;
    onIconChange: (icon: IconKey) => void;
    onColorChange: (color: string) => void;
    size?: "sm" | "md";
    isOpen: boolean;
    onToggle: (open: boolean) => void;
}

export const IconPickerButton: React.FC<IconPickerButtonProps> = ({
                                                                      icon,
                                                                      color,
                                                                      onIconChange,
                                                                      onColorChange,
                                                                      size = "md",
                                                                      isOpen,
                                                                      onToggle
                                                                  }) => {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({top: 0, left: 0});

    const sizeClasses = size === "sm" ? "h-6 w-6 rounded-md text-xs" : "h-10 w-10 rounded-lg text-lg";

    // Calcola le coordinate esatte ogni volta che si apre
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();

            // Sicurezza: Evita che il menu esca dallo schermo se cliccato troppo a destra
            let leftPos = rect.left;
            if (leftPos + 280 > window.innerWidth) {
                leftPos = window.innerWidth - 280;
            }

            setCoords({
                top: rect.bottom + 8, // 8 pixel di margine sotto il bottone
                left: leftPos,
            });
        }
    }, [isOpen]);

    return (
        <>
            <div
                ref={buttonRef}
                onClick={() => onToggle(!isOpen)}
                className={`shrink-0 flex items-center justify-center bg-white/10 shadow-sm cursor-pointer hover:scale-110 transition-transform ${sizeClasses}`}
                style={{color}}
                title="Change Icon & Color">
                <FontAwesomeIcon icon={ICONS[icon] || faTags}/>
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => onToggle(false)}/>
                        <div
                            className="fixed z-[110]"
                            style={{top: coords.top, left: coords.left}}
                        >
                        <IconColorSelector
                            iconValue={icon}
                            onChangeIcon={onIconChange}
                            colorValue={color}
                            onChangeColor={onColorChange}
                        />
                    </div>
                </>,
                document.body
            )}
        </>
    );
};