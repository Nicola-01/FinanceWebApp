import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { triggerToast } from '../components/ToastNotification';
import type { Tag } from '../utils/types';
import TagCard from "./TagCard";
import { IconPickerButton } from '../components/IconPickerButton'; // <-- Importa il nuovo wrapper
import type { WalletIconKey } from '../utils/walletIcons';

interface TagsTabProps {
    walletId: string;
}

export const TagsTab: React.FC<TagsTabProps> = ({ walletId }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddingMain, setIsAddingMain] = useState(false);
    const [newMainName, setNewMainName] = useState("");
    const [newMainIcon, setNewMainIcon] = useState<WalletIconKey>('tag');
    const [newMainColor, setNewMainColor] = useState('#00ff7f');
    const [showNewMainSelector, setShowNewMainSelector] = useState(false);
    const [savingMain, setSavingMain] = useState(false);

    const fetchTags = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tags/${walletId}`);
            const sortedTags = response.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setTags(sortedTags);
        } catch (err) {
            triggerToast("Error loading tags", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, [walletId]);

    const handleAddMainTag = async () => {
        if (!newMainName.trim()) { setIsAddingMain(false); return; }
        setSavingMain(true);
        try {
            await api.post(`/tags/${walletId}`, {
                name: newMainName.trim(), icon: newMainIcon, colorHex: newMainColor, parentName: null
            });
            setNewMainName(""); setNewMainIcon('tag'); setNewMainColor('#00ff7f');
            setIsAddingMain(false); fetchTags();
        } catch (err: any) { triggerToast(err.response?.data?.title || "Error creating tag", false); }
        finally { setSavingMain(false); }
    };

    const organizedTags: Record<string, { parent: Tag, children: Tag[] }> = {};
    tags.forEach(tag => { if (!tag.parentName) organizedTags[tag.name] = { parent: tag, children: [] }; });
    tags.forEach(tag => {
        if (tag.parentName && organizedTags[tag.parentName]) organizedTags[tag.parentName].children.push(tag);
        else if (tag.parentName && !organizedTags[tag.parentName]) organizedTags[tag.parentName] = { parent: tag, children: [] };
    });

    return (
        <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-md">
            {loading ? (
                <div className="flex justify-center py-10 text-white/40"><FontAwesomeIcon icon={faSpinner} spin size="2x" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">

                    {Object.values(organizedTags).map(({ parent, children }) => (
                        <TagCard key={parent.name} parent={parent} children={children} walletId={walletId} onSuccess={fetchTags} />
                    ))}

                    {isAddingMain ? (
                        <div className="rounded-xl border border-[#00ff7f]/50 bg-[#00ff7f]/5 p-4 flex flex-col justify-center gap-3 min-h-[100px] shadow-[0_0_15px_rgba(0,255,127,0.1)]">
                            <div className="flex items-center gap-3">

                                {/* USO DEL NUOVO COMPONENTE PULITO! */}
                                <IconPickerButton
                                    icon={newMainIcon} color={newMainColor}
                                    onIconChange={setNewMainIcon} onColorChange={setNewMainColor}
                                    isOpen={showNewMainSelector} onToggle={setShowNewMainSelector}
                                />

                                <input
                                    autoFocus
                                    className="bg-transparent text-lg font-bold text-white outline-none w-full placeholder-white/30"
                                    placeholder="Name..." value={newMainName} onChange={(e) => setNewMainName(e.target.value)} disabled={savingMain}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddMainTag(); if (e.key === 'Escape') { setIsAddingMain(false); setNewMainName(""); } }}
                                />

                                {savingMain ? <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] ml-auto" /> : (
                                    <div className="flex items-center gap-1 ml-auto">
                                        <button onClick={handleAddMainTag} className="flex h-8 w-8 items-center justify-center rounded-md bg-[#00ff7f]/20 text-[#00ff7f] hover:bg-[#00ff7f] hover:text-black transition-colors" title="Save"><FontAwesomeIcon icon={faCheck} /></button>
                                        <button onClick={() => { setIsAddingMain(false); setNewMainName(""); }} className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-colors" title="Cancel"><FontAwesomeIcon icon={faXmark} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAddingMain(true)} className="cursor-pointer group flex items-center justify-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/50 text-left min-h-[100px]">
                            <div className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl text-white/40 group-hover:text-[#00ff7f] transition-colors shrink-0"><FontAwesomeIcon icon={faPlus} /></div>
                            <div className="flex flex-col min-w-0"><h4 className="m-0 text-lg font-bold text-white/40 group-hover:text-white transition-colors truncate">Add Main Category</h4></div>
                        </button>
                    )}

                </div>
            )}
        </div>
    );
};