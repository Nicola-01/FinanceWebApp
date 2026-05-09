import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../../utils/types';
import { useWalletContext } from '../../../dashboard/wallet/WalletContext.tsx';
import { IconPickerButton } from '../../../components/IconPickerButton.tsx';
import type { IconKey } from '../../../utils/icons.ts';

interface TagPickerAddFormProps {
    currentParentName: string | null;
    currentParentColor: string;
    onClose: () => void;
}

export const TagPickerAddForm: React.FC<TagPickerAddFormProps> = ({
                                                                      currentParentName,
                                                                      currentParentColor,
                                                                      onClose
                                                                  }) => {
    const { handleAddTag } = useWalletContext();
    const [showIconSelector, setShowIconSelector] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newTag, setNewTag] = useState<Tag>({
        name: '', icon: 'tag', colorHex: currentParentColor, parentName: currentParentName
    });

    // Aggiorna colore e padre se l'utente naviga nel menu mentre il form è aperto
    useEffect(() => {
        setNewTag(prev => ({ ...prev, colorHex: currentParentColor, parentName: currentParentName }));
    }, [currentParentColor, currentParentName]);

    const handleSave = async () => {
        if (!newTag.name.trim()) {
            onClose();
            return;
        }
        setIsSaving(true);
        const success = await handleAddTag(newTag);

        if (success) {
            setNewTag({ name: '', icon: 'tag', colorHex: currentParentColor, parentName: currentParentName });
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="flex items-center gap-2 rounded-lg border border-[#00ff7f]/30 bg-[#00ff7f]/5 p-2 shadow-inner overflow-hidden w-full">
            <div className="shrink-0 flex items-center justify-center">
                <IconPickerButton
                    icon={newTag.icon as IconKey}
                    color={newTag.colorHex as string}
                    onIconChange={(icon: IconKey) => setNewTag({ ...newTag, icon })}
                    onColorChange={(color: string) => setNewTag({ ...newTag, colorHex: color })}
                    isOpen={showIconSelector}
                    onToggle={setShowIconSelector}
                />
            </div>
            <input
                autoFocus
                className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder-white/30 font-medium"
                placeholder={currentParentName ? "Subcategory name..." : "Category name..."}
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                disabled={isSaving}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') onClose();
                }}
            />
            {isSaving ? (
                <FontAwesomeIcon icon={faSpinner} spin className="text-[#00ff7f] px-2" />
            ) : (
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={handleSave} className="flex h-7 w-7 items-center justify-center text-[#00ff7f] hover:bg-[#00ff7f]/20 rounded-md transition-colors">
                        <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button onClick={onClose} className="flex h-7 w-7 items-center justify-center text-app-muted hover:text-red-500 hover:bg-red-500/20 rounded-md transition-colors">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}
        </div>
    );
};