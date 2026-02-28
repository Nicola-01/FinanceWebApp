import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faPlus, faSpinner, faXmark} from '@fortawesome/free-solid-svg-icons';
import type {Tag} from '../../utils/types.ts';
import TagCard from "./TagCard.tsx";
import {IconPickerButton} from '../../components/IconPickerButton.tsx';
import type {IconKey} from '../../utils/icons.ts';

interface TagsTabProps {
    tags: Tag[],
    onAddTag: (tag: Partial<Tag>) => Promise<boolean>,
    onUpdateTag: (oldName: string, updatedTag: Partial<Tag>) => Promise<boolean>,
    onDeleteTag: (tagName: string) => Promise<boolean>,
    isLoading: boolean
}

// --- COMPONENTE SKELETON INTERNO ---
const TagSkeleton = () => (
    // Aggiunto break-inside-avoid e mb-6 per il layout masonry
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

export const TagsTab: React.FC<TagsTabProps> = ({tags, onAddTag, onUpdateTag, onDeleteTag, isLoading}) => {
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
            setNewTag({name: '', icon: 'tag', colorHex: '#00ff7f', parentName: null});
            setIsAddingTag(false);
        }
        setSavingMain(false);
    };

    const organizedTags: Record<string, { parent: Tag, children: Tag[] }> = {};

    tags.forEach(tag => {
        if (!tag.parentName) organizedTags[tag.name] = {parent: tag, children: []};
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

            {/* RIMOSSO grid, INSERITO columns-1 md:columns-2 xl:columns-3 */}
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
                        {Object.values(organizedTags).map(({parent, children}) => (
                            /* WRAPPER OBBLIGATORIO: Evita che la card si tagli a metà tra le colonne */
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

                        {/* WRAPPER PER L'AGGIUNTA: Anch'esso con break-inside-avoid */}
                        <div className="break-inside-avoid mb-6">
                            {isAddingTag ? (
                                <div className="rounded-xl border border-[#00ff7f]/50 bg-[#00ff7f]/5 p-4 flex flex-col justify-center gap-3 min-h-[100px] shadow-[0_0_15px_rgba(0,255,127,0.1)]">
                                    <div className="flex items-center gap-3">
                                        <IconPickerButton
                                            icon={newTag.icon as IconKey} color={newTag.colorHex as string}
                                            onIconChange={(icon: IconKey) => setNewTag({...newTag, icon: icon})}
                                            onColorChange={(color: string) => setNewTag({...newTag, colorHex: color})}
                                            isOpen={showNewMainSelector} onToggle={setShowNewMainSelector}
                                        />
                                        <input
                                            autoFocus
                                            className="bg-transparent text-lg font-bold text-white outline-none w-full placeholder-white/30"
                                            placeholder="Name..." value={newTag.name}
                                            onChange={(e) => setNewTag({...newTag, name: e.target.value})} disabled={savingMain}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddMainTag();
                                                if (e.key === 'Escape') {
                                                    setIsAddingTag(false);
                                                    setNewTag({...newTag, name: ''})
                                                }
                                            }}
                                        />
                                        {savingMain ?
                                            <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] ml-auto"/> : (
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <button onClick={handleAddMainTag}
                                                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#00ff7f]/20 text-[#00ff7f] hover:bg-[#00ff7f] hover:text-black transition-colors"
                                                            title="Save"><FontAwesomeIcon icon={faCheck}/></button>
                                                    <button onClick={() => {
                                                        setIsAddingTag(false);
                                                        setNewTag({...newTag, name: ''})
                                                    }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                                            title="Cancel"><FontAwesomeIcon icon={faXmark}/></button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ) : (
                                /* Aggiunto w-full al bottone in modo che riempia la colonna in larghezza */
                                <button onClick={() => setIsAddingTag(true)}
                                        className="w-full cursor-pointer group flex items-center justify-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/50 text-left min-h-[100px]">
                                    <div className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl text-white/40 group-hover:text-[#00ff7f] transition-colors shrink-0">
                                        <FontAwesomeIcon icon={faPlus}/>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="m-0 text-lg font-bold text-white/40 group-hover:text-white transition-colors truncate">
                                            Add Main Category
                                        </h4>
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};