import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronLeft, faChevronUp, faHashtag, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../../utils/types';
import { Icon } from '../../../components/icon/Icon.tsx';
import { TagPickerRow } from './TagPickerRow.tsx';
import { TagPickerAddForm } from './TagPickerAddForm.tsx';

interface HierarchicalTagSelectorProps {
    tags: Tag[];
    showLabel?: boolean;
    selectedTagName: string;
    onSelectTag: (tagName: string) => void;
}

export const TagPicker: React.FC<HierarchicalTagSelectorProps> = ({
                                                                      tags,
                                                                      selectedTagName,
                                                                      onSelectTag,
                                                                      showLabel = true,
                                                                  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentParentName, setCurrentParentName] = useState<string | null>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentParentTag = tags.find(t => t.name === currentParentName);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setCurrentParentName(null);
                setIsAddingTag(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Resetta l'aggiunta rapida se l'utente naviga tra le cartelle
    useEffect(() => {
        setIsAddingTag(false);
    }, [currentParentName]);

    const selectedTag = tags.find(t => t.name === selectedTagName);
    const displayedTags = tags.filter(t => (t.parentName || null) === currentParentName);

    const isAncestorOfSelected = (tagName: string, targetSelectedName: string): boolean => {
        if (!targetSelectedName) return false;
        let current = tags.find(t => t.name === targetSelectedName);
        while (current && current.parentName) {
            if (current.parentName === tagName) return true;
            current = tags.find(t => t.name === current?.parentName);
        }
        return false;
    };

    const selectTag = (tagName: string) => {
        onSelectTag(tagName);
        setIsOpen(false);
        setCurrentParentName(null);
        setIsAddingTag(false);
    };

    // Logica di routing al click della riga
    const handleRowClick = (tag: Tag, isParentHeader: boolean) => {
        const isMainCategory = !tag.parentName;
        if (isMainCategory && !isParentHeader) {
            setCurrentParentName(tag.name);
        } else {
            selectTag(tag.name);
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {showLabel &&
                <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                    <FontAwesomeIcon icon={faHashtag} className="mr-2" /> Category *
                </label>
            }

            {/* Bottone Principale */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-app-border bg-app-card px-4 text-left outline-none transition-all focus:border-app-green"
            >
                {selectedTag ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-app-input text-xs"
                            style={{ color: selectedTag.colorHex || '#ffffff' }}
                        >
                            <Icon icon={selectedTag.icon} color={selectedTag.colorHex || '#ffffff'} />
                        </div>
                        <span className="text-app-text font-medium">{selectedTag.name}</span>
                    </div>
                ) : (
                    <span className="text-app-muted">Select a category...</span>
                )}
                <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="transition-transform duration-300 text-app-muted" />
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out] flex flex-col max-h-[350px]">

                    {/* IL TASTO BACK RIMANE FISSO IN ALTO (Se siamo in una cartella) */}
                    {currentParentName && currentParentTag && (
                        <div className="shrink-0 mb-1 border-b border-app-border pb-1">
                            <button
                                type="button"
                                onClick={() => setCurrentParentName(currentParentTag.parentName || null)}
                                className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-bold text-app-green hover:bg-app-input transition-colors outline-none"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                                Back to {currentParentTag.parentName ? currentParentTag.parentName : 'Categories'}
                            </button>
                        </div>
                    )}

                    {/* --- INIZIO LISTA SCROLLABILE --- */}
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 min-h-[50px]">

                        {/* 1. TAG GENERALE (Scollabile, in cima) */}
                        {currentParentName && currentParentTag && (
                            <div className="mb-2">
                                <div className="bg-app-hover rounded-lg">
                                    <TagPickerRow
                                        tag={currentParentTag}
                                        isParentHeader={true}
                                        isSelected={currentParentTag.name === selectedTagName}
                                        isAncestor={isAncestorOfSelected(currentParentTag.name, selectedTagName)}
                                        onClick={() => handleRowClick(currentParentTag, true)}
                                    />
                                </div>
                                <hr className="mt-2 border-app-border" />
                            </div>
                        )}

                        {/* 2. LISTA DEI TAG FIGLI/MAIN (Scollabile, in mezzo) */}
                        {displayedTags.length > 0 ? (
                            displayedTags.map(tag => (
                                <TagPickerRow
                                    key={tag.name}
                                    tag={tag}
                                    isSelected={tag.name === selectedTagName}
                                    isAncestor={isAncestorOfSelected(tag.name, selectedTagName)}
                                    onClick={() => handleRowClick(tag, false)}
                                />
                            ))
                        ) : (
                            <div className="p-4 text-sm text-app-muted text-center italic border border-dashed border-app-border rounded-lg">
                                {currentParentName ? "No subcategories found." : "No tags found."}
                            </div>
                        )}

                        {/* 3. BOTTONE/FORM AGGIUNGI (Scollabile, in fondo) */}
                        <div className="pt-2 mt-2 border-t border-app-border">
                            {isAddingTag ? (
                                <TagPickerAddForm
                                    currentParentName={currentParentName}
                                    currentParentColor={currentParentTag ? currentParentTag.colorHex : 'var(--color-app-green)'}
                                    onClose={() => setIsAddingTag(false)}
                                />
                            ) : (
                                <button
                                    onClick={() => setIsAddingTag(true)}
                                    className="flex w-full items-center gap-3 rounded-lg border border-dashed border-app-border p-2.5 text-left hover:bg-app-input transition-colors group"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-input group-hover:bg-app-surface transition-colors">
                                        <FontAwesomeIcon icon={faPlus} className="text-app-muted group-hover:text-app-text" />
                                    </div>
                                    <span className="text-sm font-medium text-app-muted group-hover:text-app-text">
                                        {currentParentName ? 'Add Subcategory' : 'Add Main Category'}
                                    </span>
                                </button>
                            )}
                        </div>

                    </div>
                    {/* --- FINE LISTA SCROLLABILE --- */}

                </div>
            )}
        </div>
    );
};