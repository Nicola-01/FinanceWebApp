import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../utils/types.ts';
import TagCard from "./TagCard.tsx";
import { IconPickerButton } from '../../components/IconPickerButton.tsx';
import type { IconKey } from '../../utils/icons.ts';
import { useWalletContext } from "../wallet/WalletContext.tsx";

// --- COMPONENTE SKELETON INTERNO ---
const TagSkeleton = () => (
    <div className="break-inside-avoid mb-6 rounded-xl border border-white/5 bg-white/5 p-4 flex flex-col gap-4 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 shrink-0"></div>
            <div className="h-6 w-32 bg-white/10 rounded-md"></div>
        </div>
        <div className="ml-4 flex flex-col gap-3 border-l-2 border-white/5 pl-4">
            <div className="h-3 w-3/4 bg-white/5 rounded"></div>
            <div className="h-3 w-1/2 bg-white/5 rounded"></div>
        </div>
    </div>
);

export const TagsTab: React.FC = () => {
    const { tags, handleAddTag: onAddTag, handleUpdateTag: onUpdateTag, handleDeleteTag: onDeleteTag, isLoading } = useWalletContext();
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showNewMainSelector, setShowNewMainSelector] = useState(false);
    const [savingMain, setSavingMain] = useState(false);

    const [newTag, setNewTag] = useState<Tag>({
        name: '', icon: 'tag', colorHex: '#00ff7f', parentName: null
    });

    const handleAddMainTag = async () => {
        if (!newTag.name.trim()) {
            setIsAddingTag(false);
            return;
        }
        setSavingMain(true);
        const success = await onAddTag(newTag);

        if (success) {
            setNewTag({ name: '', icon: 'tag', colorHex: '#00ff7f', parentName: null });
            setIsAddingTag(false);
        }
        setSavingMain(false);
    };

    const organizedTags: Record<string, { parent: Tag, children: Tag[] }> = {};

    tags.forEach(tag => {
        if (!tag.parentName) organizedTags[tag.name] = { parent: tag, children: [] };
    });
    tags.forEach(tag => {
        if (tag.parentName && organizedTags[tag.parentName]) organizedTags[tag.parentName].children.push(tag);
        else if (tag.parentName && !organizedTags[tag.parentName]) organizedTags[tag.parentName] = {
            parent: tag,
            children: []
        };
    });

    return (
        <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-6 backdrop-blur-md">

            {/* 1. SEZIONE AGGIUNGI MAIN CATEGORY (Sopra a tutto, larghezza intera) */}
            {!isLoading && (
                <div className="mb-8 w-full">
                    {isAddingTag ? (
                        /* GRAFICA AGGIORNATA: Form quando si sta aggiungendo */
                        <div className="group flex w-full items-center gap-4 rounded-2xl border-2 border-[#00ff7f]/30 bg-[#00ff7f]/5 p-4 text-white transition-all shadow-[0_0_20px_rgba(0,255,127,0.05)]">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                                <IconPickerButton
                                    icon={newTag.icon as IconKey}
                                    color={newTag.colorHex as string}
                                    onIconChange={(icon: IconKey) => setNewTag({ ...newTag, icon: icon })}
                                    onColorChange={(color: string) => setNewTag({ ...newTag, colorHex: color })}
                                    isOpen={showNewMainSelector}
                                    onToggle={setShowNewMainSelector}
                                />
                            </div>

                            <input
                                autoFocus
                                className="flex-1 bg-transparent text-left font-bold tracking-wide text-white outline-none placeholder-white/20"
                                placeholder="Category Name..."
                                value={newTag.name}
                                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                                disabled={savingMain}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddMainTag();
                                    if (e.key === 'Escape') {
                                        setIsAddingTag(false);
                                        setNewTag({ ...newTag, name: '' });
                                    }
                                }}
                            />

                            {savingMain ? (
                                <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] mx-2" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleAddMainTag}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ff7f]/20 text-[#00ff7f] hover:bg-[#00ff7f] hover:text-black transition-all"
                                        title="Confirm"
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAddingTag(false);
                                            setNewTag({ ...newTag, name: '' });
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                        title="Cancel"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* NUOVO STILE RICHIESTO: Pulsante tratteggiato */
                        <button
                            onClick={() => setIsAddingTag(true)}
                            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 bg-transparent p-4 text-white/50 transition-all hover:border-white/30 hover:bg-white/5 hover:text-white"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 transition-all group-hover:bg-white/10 group-hover:scale-105">
                                <FontAwesomeIcon icon={faPlus}/>
                            </div>

                            <div className="flex-1 text-left font-bold tracking-wide">
                                Add Main Category
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* 2. GRIGLIA DEI TAG (Masonry Layout) */}
            <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
                {isLoading ? (
                    <>
                        <TagSkeleton />
                        <TagSkeleton />
                        <TagSkeleton />
                        <TagSkeleton />
                    </>
                ) : (
                    <>
                        {Object.values(organizedTags).map(({ parent, children }) => (
                            <div key={parent.name} className="break-inside-avoid mb-6">
                                <TagCard
                                    parent={parent}
                                    children={children}
                                    onAddTag={onAddTag}
                                    onUpdateTag={onUpdateTag}
                                    onDeleteTag={onDeleteTag}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};