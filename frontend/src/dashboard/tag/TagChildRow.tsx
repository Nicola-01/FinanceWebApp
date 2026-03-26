import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowTurnUp, faCheck, faPenToSquare, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types.ts";
import type { IconKey } from "../../utils/icons.ts";
import { IconPickerButton } from "../../components/IconPickerButton.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

interface TagChildRowProps {
    child: Tag;
    onUpdateTag: (oldName: string, updatedTag: Partial<Tag>) => Promise<boolean>;
    onDeleteTag: (tagName: string) => Promise<boolean>;
}

export const TagChildRow: React.FC<TagChildRowProps> = ({ child, onUpdateTag, onDeleteTag }) => {
    const { wallet } = useWalletContext();
    const [isEditing, setIsEditing] = useState(false);
    const [nameVal, setNameVal] = useState(child.name);

    const [showSelector, setShowSelector] = useState(false);
    const [iconVal, setIconVal] = useState<IconKey>(child.icon as IconKey);
    const [colorVal, setColorVal] = useState(child.colorHex);

    const handleSaveName = async () => {
        if (nameVal.trim() && nameVal !== child.name) {
            const success = await onUpdateTag(child.name, { ...child, name: nameVal.trim() });
            if (!success) setNameVal(child.name); // Revert form se fallisce
        }
        setIsEditing(false);
    };

    const handleCloseSelector = () => {
        setShowSelector(false);
        if (iconVal !== child.icon || colorVal !== child.colorHex) {
            onUpdateTag(child.name, { ...child, icon: iconVal, colorHex: colorVal });
        }
    };

    return (
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-app-input group/child">
            <FontAwesomeIcon icon={faArrowTurnUp} className="rotate-90 text-app-muted/30 text-xs shrink-0" />

            <IconPickerButton
                size="sm"
                icon={showSelector ? iconVal : (child.icon as IconKey)}
                color={showSelector ? colorVal : child.colorHex}
                onIconChange={setIconVal}
                onColorChange={setColorVal}
                isOpen={showSelector}
                onToggle={(open) => {
                    if (wallet.myRole === 'VIEWER') return;
                    if (open) {
                        setIconVal(child.icon as IconKey);
                        setColorVal(child.colorHex);
                        setShowSelector(true);
                    } else handleCloseSelector();
                }}
            />

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            className="bg-app-card/40 border border-[#00ff7f]/50 rounded px-2 py-0.5 text-app-text text-sm outline-none w-full"
                            value={nameVal}
                            onChange={(e) => setNameVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <button onClick={handleSaveName} className="text-[#00ff7f] hover:text-app-text transition-colors">
                            <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="text-app-muted hover:text-red-500 transition-colors">
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80 truncate pr-2">{child.name}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover/child:opacity-100 transition-opacity">
                            {wallet.myRole !== 'VIEWER' && (
                                <>
                                    <button
                                        onClick={() => { setNameVal(child.name); setIsEditing(true); }}
                                        className="text-white/30 hover:text-amber-400 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteTag(child.name)}
                                        className="text-white/30 hover:text-red-500 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};