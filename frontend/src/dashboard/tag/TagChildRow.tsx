import React, {useState} from "react";
import api from '../../api/axiosConfig.ts';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowTurnUp, faCheck, faXmark, faPenToSquare, faTrash} from "@fortawesome/free-solid-svg-icons";
import type {Tag} from "../../utils/types.ts";
import type {IconKey} from "../../utils/icons.ts";
import {triggerToast} from '../../components/ToastNotification.tsx';
import {IconPickerButton} from "../../components/IconPickerButton.tsx";

interface TagChildRowProps {
    child: Tag,
    walletId: string,
    onSuccess: () => void,
}

export const TagChildRow: React.FC<TagChildRowProps> = ({child, walletId, onSuccess}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nameVal, setNameVal] = useState(child.name);

    const [showSelector, setShowSelector] = useState(false);
    const [iconVal, setIconVal] = useState<IconKey>(child.icon as IconKey);
    const [colorVal, setColorVal] = useState(child.colorHex);

    const updateTag = async (oldName: string, updatedTag: Partial<Tag>) => {
        try {
            await api.put(`/tags/${walletId}/${encodeURIComponent(oldName)}`, updatedTag);
            onSuccess();
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating tag", false);
        }
    };

    const deleteTag = async (tagName: string) => {
        try {
            console.log((walletId))
            await api.delete(`/tags/${walletId}/${encodeURIComponent(tagName)}`);
            onSuccess();
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error updating tag", false);
        }
    };

    const handleSaveName = () => {
        if (nameVal.trim() && nameVal !== child.name) {
            updateTag(child.name, {...child, name: nameVal.trim()});
        }
        setIsEditing(false);
    };

    const handleCloseSelector = () => {
        setShowSelector(false);
        if (iconVal !== child.icon || colorVal !== child.colorHex) {
            updateTag(child.name, {...child, icon: iconVal, colorHex: colorVal});
        }
    };

    return (
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 group/child">
            <FontAwesomeIcon icon={faArrowTurnUp} className="rotate-90 text-white/20 text-xs shrink-0"/>

            {/* Clean Child Component (with size="sm" parameter) */}
            <IconPickerButton
                size="sm"
                icon={showSelector ? iconVal : (child.icon as IconKey)}
                color={showSelector ? colorVal : child.colorHex}
                onIconChange={setIconVal}
                onColorChange={setColorVal}
                isOpen={showSelector}
                onToggle={(open) => {
                    if (open) {
                        setIconVal(child.icon as IconKey);
                        setColorVal(child.colorHex);
                        setShowSelector(true);
                    } else {
                        handleCloseSelector();
                    }
                }}
            />

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            className="bg-black/40 border border-[#00ff7f]/50 rounded px-2 py-0.5 text-white text-sm outline-none w-full"
                            value={nameVal}
                            onChange={(e) => setNameVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') setIsEditing(false);
                            }}
                        />
                        <button onClick={handleSaveName} className="text-[#00ff7f] hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faCheck}/>
                        </button>
                        <button onClick={() => setIsEditing(false)}
                                className="text-white/40 hover:text-red-500 transition-colors">
                            <FontAwesomeIcon icon={faXmark}/>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/80 truncate pr-2">{child.name}</span>
                        <div
                            className="flex items-center gap-2 opacity-0 group-hover/child:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setNameVal(child.name);
                                    setIsEditing(true);
                                }}
                                className="text-white/30 hover:text-amber-400 transition-colors"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} className="text-xs"/>
                            </button>
                            <button
                                onClick={() => deleteTag(child.name)}
                                className="text-white/30 hover:text-red-500 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-xs"/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
