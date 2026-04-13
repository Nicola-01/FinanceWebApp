import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Tag } from "../../utils/types.ts";
import type { IconKey } from "../../utils/icons.ts";
import {
    faArrowTurnUp,
    faCheck,
    faPenToSquare,
    faPlus,
    faSpinner,
    faTrash,
    faXmark
} from "@fortawesome/free-solid-svg-icons";
import { IconPickerButton } from "../../components/IconPickerButton.tsx";
import { TagChildRow } from "./TagChildRow.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";

interface TagCardProps {
    parent: Tag;
    children: Tag[];
    onAddTag: (tag: Partial<Tag>) => Promise<boolean>;
    onUpdateTag: (oldName: string, updatedTag: Partial<Tag>) => Promise<boolean>;
    onDeleteTag: (tagName: string) => Promise<boolean>;
}

const TagCard: React.FC<TagCardProps> = ({ parent, children, onAddTag, onUpdateTag, onDeleteTag }) => {
    const { wallet } = useWalletContext();

    const [isAddingChild, setIsAddingChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingParentName, setEditingParentName] = useState(false);
    const [parentNameVal, setParentNameVal] = useState(parent.name);

    const [showParentSelector, setShowParentSelector] = useState(false);
    const [parentIcon, setParentIcon] = useState<IconKey>(parent.icon as IconKey);
    const [parentColor, setParentColor] = useState(parent.colorHex);

    const handleDeleteParent = async (tagName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${tagName}"?`)) return;
        await onDeleteTag(tagName);
    };

    const handleSaveParentName = async () => {
        if (parentNameVal.trim() && parentNameVal !== parent.name) {
            const success = await onUpdateTag(parent.name, { ...parent, name: parentNameVal.trim() });
            if (!success) setParentNameVal(parent.name); // Revert on failure
        }
        setEditingParentName(false);
    };

    const handleCloseParentSelector = () => {
        setShowParentSelector(false);
        if (parentIcon !== parent.icon || parentColor !== parent.colorHex) {
            onUpdateTag(parent.name, { ...parent, icon: parentIcon, colorHex: parentColor });
        }
    };

    const handleAddChild = async () => {
        if (!newChildName.trim()) {
            setIsAddingChild(false);
            return;
        }
        setLoading(true);
        const success = await onAddTag({
            name: newChildName.trim(),
            icon: parent.icon,
            colorHex: parent.colorHex,
            parentName: parent.name
        });

        if (success) {
            setNewChildName("");
            setIsAddingChild(false);
        }
        setLoading(false);
    };

    return (
        <div className="rounded-xl border border-app-border bg-app-input p-4 flex flex-col gap-3 transition-all">

            {/* HEADER DEL PADRE */}
            <div className="flex items-center gap-3 group/header">
                <IconPickerButton
                    icon={showParentSelector ? parentIcon : (parent.icon as IconKey)}
                    color={showParentSelector ? parentColor : parent.colorHex}
                    onIconChange={setParentIcon}
                    onColorChange={setParentColor}
                    isOpen={showParentSelector}
                    onToggle={(open) => {
                        if (wallet.myRole === 'VIEWER') return;
                        if (open) {
                            setParentIcon(parent.icon as IconKey);
                            setParentColor(parent.colorHex);
                            setShowParentSelector(true);
                        } else handleCloseParentSelector();
                    }}
                />

                <div className="flex-1 min-w-0">
                    {editingParentName ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                className="bg-app-card/40 border border-[#00ff7f]/50 rounded px-2 py-1 text-app-text outline-none w-full font-bold"
                                value={parentNameVal} onChange={e => setParentNameVal(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveParentName();
                                    if (e.key === 'Escape') {
                                        setEditingParentName(false);
                                        setParentNameVal(parent.name);
                                    }
                                }}
                            />
                            <button onClick={handleSaveParentName} className="text-[#00ff7f] hover:text-app-text transition-colors"><FontAwesomeIcon icon={faCheck} /></button>
                            <button onClick={() => { setEditingParentName(false); setParentNameVal(parent.name); }} className="text-app-muted hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faXmark} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="min-w-0"><h1 className="font-bold text-app-text text-2xl truncate">{parent.name}</h1></div>
                            <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                {wallet.myRole !== 'VIEWER' && (
                                    <>
                                        <button onClick={() => { setParentNameVal(parent.name); setEditingParentName(true); }} className="text-app-muted/40 hover:text-amber-400 transition-colors"><FontAwesomeIcon icon={faPenToSquare} className="text-sm" /></button>
                                        <button onClick={() => handleDeleteParent(parent.name)} className="text-app-muted/40 hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faTrash} className="text-sm" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LISTA DEI FIGLI */}
            <div className="mt-2 flex flex-col gap-2 pl-4 border-l-2 border-app-border">
                {isAddingChild ? (
                    <div className="flex items-center gap-2 rounded-lg p-2 bg-app-card/40 border border-[#00ff7f]/30">
                        <FontAwesomeIcon icon={faArrowTurnUp} className="rotate-90 text-[#00ff7f] text-xs shrink-0" />
                        <input
                            autoFocus
                            className="bg-transparent text-sm font-medium text-app-text outline-none w-full placeholder-app-muted/30"
                            placeholder="Name..." value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAddChild();
                                if (e.key === 'Escape') setIsAddingChild(false);
                            }} disabled={loading}
                        />
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] text-xs shrink-0" /> : (
                            <>
                                <button onClick={handleAddChild} className="text-[#00ff7f] hover:text-app-text transition-colors shrink-0"><FontAwesomeIcon icon={faCheck} /></button>
                                <button onClick={() => setIsAddingChild(false)} className="text-app-muted hover:text-red-500 transition-colors shrink-0"><FontAwesomeIcon icon={faXmark} /></button>
                            </>
                        )}
                    </div>
                ) : (
                    wallet.myRole !== 'VIEWER' && (
                        <button onClick={() => setIsAddingChild(true)} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-app-input text-left group cursor-pointer">
                            <FontAwesomeIcon icon={faPlus} className="text-app-muted/20 group-hover:text-[#00ff7f] text-xs transition-colors" />
                            <span className="text-sm font-medium text-app-muted group-hover:text-[#00ff7f] transition-colors">Add sub-category</span>
                        </button>
                    )
                )}

                {children.map(child => (
                    <TagChildRow
                        key={child.name}
                        child={child}
                        onUpdateTag={onUpdateTag}
                        onDeleteTag={onDeleteTag}
                    />
                ))}
            </div>
        </div>
    );
}

export default TagCard;