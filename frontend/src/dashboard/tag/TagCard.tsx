import React, { useState } from "react";
import api from '../../api/axiosConfig.ts';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Tag } from "../../utils/types.ts";
import type { WalletIconKey } from "../../utils/walletIcons.ts";
import { faArrowTurnUp, faPlus, faSpinner, faCheck, faXmark, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from '../../components/ToastNotification.tsx';
import { IconPickerButton } from "../../components/IconPickerButton.tsx";
import { TagChildRow } from "./TagChildRow.tsx";

interface TagCardProps {
    parent: Tag;
    children: Tag[];
    walletId: string;
    onSuccess: () => void;
}

const TagCard: React.FC<TagCardProps> = ({ parent, children, walletId, onSuccess }) => {

    const [isAddingChild, setIsAddingChild] = useState(false);
    const [newChildName, setNewChildName] = useState("");
    const [loading, setLoading] = useState(false);

    const [editingParentName, setEditingParentName] = useState(false);
    const [parentNameVal, setParentNameVal] = useState(parent.name);

    const [showParentSelector, setShowParentSelector] = useState(false);
    const [parentIcon, setParentIcon] = useState<WalletIconKey>(parent.icon as WalletIconKey);
    const [parentColor, setParentColor] = useState(parent.colorHex);

    const updateTag = async (oldName: string, updatedTag: Partial<Tag>) => {
        try { await api.put(`/tags/${walletId}/${encodeURIComponent(oldName)}`, updatedTag); onSuccess(); }
        catch (err: any) { triggerToast(err.response?.data?.title || "Error updating tag", false); }
    };

    const handleDeleteTag = async (tagName: string) => {
        if (!window.confirm(`Are you sure you want to delete "${tagName}"?`)) return;
        try { await api.delete(`/tags/${walletId}/${encodeURIComponent(tagName)}`); triggerToast("Tag deleted!", true); onSuccess(); }
        catch (err: any) { triggerToast(err.response?.data?.title || "Error deleting tag", false); }
    };

    const handleSaveParentName = () => {
        if (parentNameVal.trim() && parentNameVal !== parent.name) updateTag(parent.name, { ...parent, name: parentNameVal.trim() });
        setEditingParentName(false);
    };

    const handleCloseParentSelector = () => {
        setShowParentSelector(false);
        if (parentIcon !== parent.icon || parentColor !== parent.colorHex) updateTag(parent.name, { ...parent, icon: parentIcon, colorHex: parentColor });
    };

    const handleAddChild = async () => {
        if (!newChildName.trim()) { setIsAddingChild(false); return; }
        setLoading(true);
        try {
            await api.post(`/tags/${walletId}`, { name: newChildName.trim(), icon: parent.icon, colorHex: parent.colorHex, parentName: parent.name });
            setNewChildName(""); setIsAddingChild(false); onSuccess();
        } catch (err: any) { triggerToast(err.response?.data?.title || "Error", false); } finally { setLoading(false); }
    };


    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 transition-all">

            {/* HEADER DEL PADRE */}
            <div className="flex items-center gap-3 group/header">

                {/* Componente Pulito Padre: Ripristinato IconPickerButton */}
                <IconPickerButton
                    icon={showParentSelector ? parentIcon : (parent.icon as WalletIconKey)}
                    color={showParentSelector ? parentColor : parent.colorHex}
                    onIconChange={setParentIcon}
                    onColorChange={setParentColor}
                    isOpen={showParentSelector}
                    onToggle={(open) => {
                        if (open) {
                            setParentIcon(parent.icon as WalletIconKey);
                            setParentColor(parent.colorHex);
                            setShowParentSelector(true);
                        }
                        else {
                            handleCloseParentSelector();
                        }
                    }}
                />

                <div className="flex-1 min-w-0">
                    {editingParentName ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus className="bg-black/40 border border-[#00ff7f]/50 rounded px-2 py-1 text-white outline-none w-full font-bold"
                                value={parentNameVal} onChange={e => setParentNameVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveParentName(); if (e.key === 'Escape') { setEditingParentName(false); setParentNameVal(parent.name); } }}
                            />
                            <button onClick={handleSaveParentName} className="text-[#00ff7f] hover:text-white transition-colors"><FontAwesomeIcon icon={faCheck} /></button>
                            <button onClick={() => { setEditingParentName(false); setParentNameVal(parent.name); }} className="text-white/40 hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faXmark} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <h1 className="font-bold text-white text-2xl truncate pr-2">{parent.name}</h1>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <button onClick={() => { setParentNameVal(parent.name); setEditingParentName(true); }} className="text-white/30 hover:text-amber-400 transition-colors"><FontAwesomeIcon icon={faPenToSquare} className="text-sm" /></button>
                                <button onClick={() => handleDeleteTag(parent.name)} className="text-white/30 hover:text-red-500 transition-colors"><FontAwesomeIcon icon={faTrash} className="text-sm" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* LISTA DEI FIGLI */}
            <div className="mt-2 flex flex-col gap-2 pl-4 border-l-2 border-white/10">

                {isAddingChild ? (
                    <div className="flex items-center gap-2 rounded-lg p-2 bg-black/40 border border-[#00ff7f]/30">
                        <FontAwesomeIcon icon={faArrowTurnUp} className="rotate-90 text-[#00ff7f] text-xs shrink-0" />
                        <input
                            autoFocus className="bg-transparent text-sm font-medium text-white outline-none w-full placeholder-white/30"
                            placeholder="Name..." value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddChild(); if (e.key === 'Escape') setIsAddingChild(false); }} disabled={loading}
                        />
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] text-xs shrink-0" /> : (
                            <>
                                <button onClick={handleAddChild} className="text-[#00ff7f] hover:text-white transition-colors shrink-0"><FontAwesomeIcon icon={faCheck} /></button>
                                <button onClick={() => setIsAddingChild(false)} className="text-white/40 hover:text-red-500 transition-colors shrink-0"><FontAwesomeIcon icon={faXmark} /></button>
                            </>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setIsAddingChild(true)} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5 text-left group cursor-pointer">
                        <FontAwesomeIcon icon={faPlus} className="text-white/20 group-hover:text-[#00ff7f] text-xs transition-colors" />
                        <span className="text-sm font-medium text-white/40 group-hover:text-[#00ff7f] transition-colors">Add sub-category</span>
                    </button>
                )}

                {children.map(child => (
                    <TagChildRow
                        key={child.name}
                        child={child}
                        walletId={walletId}
                        onSuccess={onSuccess}
                    />
                ))}
            </div>
        </div>
    );
}

export default TagCard;