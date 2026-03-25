import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { useClickAway } from 'react-use';

export interface ModalDialogRightActionProp {
    icon: React.ReactNode;
    color?: string;
    hoverColor?: string;
    hoverBg?: string;
    label?: string; // Text for the menu
    onClick?: () => void;
    disabled?: boolean;
}

interface ModalDialogRightActionProps {
    actions: ModalDialogRightActionProp[];
}

export const ModalDialogRightAction = ({ actions }: ModalDialogRightActionProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickAway(dropdownRef, () => {
        setIsOpen(false);
    });

    if (!actions || actions.length === 0) return null;

    if (actions.length === 1) {
        const action = actions[0];
        return (
            <button
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                //
                className={`flex h-10 w-10 px-2 items-center justify-center rounded-full transition-colors bg-white/5
                    ${action.disabled ? 'opacity-50 cursor-not-allowed text-white/40' : 
                        `${!action.color?.startsWith('#') ? (action.color || 'text-white/40') : ''} 
                        ${action.hoverColor || 'hover:text-white'} ${action.hoverBg || 'hover:bg-white/10'}`}`
                }
                style={action.color?.startsWith('#') && !action.disabled ? { color: action.color } : {}}
                title={action.label}
            >
                {action.icon}
            </button>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
                <FontAwesomeIcon icon={faEllipsisVertical} className="text-xl" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#333333] shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50">
                    <div className="flex flex-col py-2">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={action.disabled}
                                onClick={() => {
                                    setIsOpen(false);
                                    if (action.onClick) action.onClick();
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${action.disabled ? 'opacity-50 cursor-not-allowed text-white/50' : `${!action.color?.startsWith('#') ? (action.color || 'text-white/70') : ''} ${action.hoverColor || 'hover:text-white'} ${action.hoverBg || 'hover:bg-white/10'}`}`}
                                style={action.color?.startsWith('#') && !action.disabled ? { color: action.color } : {}}
                            >
                                <span className="flex w-5 items-center justify-center">
                                    {action.icon}
                                </span>
                                <span className="font-medium">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};