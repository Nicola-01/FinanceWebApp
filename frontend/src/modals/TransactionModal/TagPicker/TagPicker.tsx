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
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentParentTag = tags.find(t => t.name === currentParentName);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setCurrentParentName(null);
                setIsAddingTag(false);
                setSearchQuery('');
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

    const lowerQuery = searchQuery.toLowerCase();
    const isSearching = lowerQuery.trim().length > 0;

    const filteredGroups: { main: Tag, children: Tag[] }[] = [];
    if (isSearching) {
        const mainCategories = tags.filter(t => !t.parentName);
        mainCategories.forEach(main => {
            const isMainMatch = main.name.toLowerCase().includes(lowerQuery);
            const childrenOfMain = tags.filter(t => t.parentName === main.name);
            const matchingChildren = childrenOfMain.filter(t => t.name.toLowerCase().includes(lowerQuery));

            if (isMainMatch || matchingChildren.length > 0) {
                filteredGroups.push({
                    main: main,
                    children: matchingChildren
                });
            }
        });
    }

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
        setSearchQuery('');
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
            <div
                className={`flex h-12 w-full items-center justify-between rounded-xl border bg-app-card px-4 text-left transition-all ${isOpen ? 'border-app-green shadow-[0_0_0_2px_rgba(34,197,94,0.2)]' : 'border-app-border'}`}
                onClick={() => {
                    if (!isOpen) setIsOpen(true);
                }}
            >
                <div className="flex-1 flex items-center h-full overflow-hidden relative">
                    {!isOpen && selectedTag ? (
                        <div className="flex items-center gap-3 w-full cursor-pointer pointer-events-none">
                            <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-xs"
                                style={{ color: selectedTag.colorHex || '#ffffff' }}
                            >
                                <Icon icon={selectedTag.icon} color={selectedTag.colorHex || '#ffffff'} />
                            </div>
                            <span className="text-app-text font-medium truncate">{selectedTag.name}</span>
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!isOpen) setIsOpen(true);
                            }}
                            placeholder={isOpen ? "Tap to search..." : "Select a category..."}
                            className="w-full h-full theme-bg-transparent outline-none text-app-text font-medium placeholder:text-app-muted"
                        />
                    )}
                </div>

                <button 
                    type="button"
                    className="ml-2 h-full flex items-center justify-center px-2 cursor-pointer outline-none"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isOpen) {
                            setIsOpen(false);
                            setCurrentParentName(null);
                            setIsAddingTag(false);
                            setSearchQuery('');
                        } else {
                            setIsOpen(true);
                        }
                    }}
                >
                    <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="transition-transform duration-300 text-app-muted hover:text-app-text" />
                </button>
            </div>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-app-border bg-app-card p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out] flex flex-col max-h-[350px]">

                    {/* IL TASTO BACK RIMANE FISSO IN ALTO (Se siamo in una cartella) */}
                    {!isSearching && currentParentName && currentParentTag && (
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

                        {isSearching ? (
                            filteredGroups.length > 0 ? (
                                filteredGroups.map(group => (
                                    <div key={group.main.name} className="mb-2">
                                        <div className="bg-app-hover rounded-lg">
                                            <TagPickerRow
                                                tag={group.main}
                                                isParentHeader={true}
                                                isSelected={group.main.name === selectedTagName}
                                                isAncestor={isAncestorOfSelected(group.main.name, selectedTagName)}
                                                onClick={() => selectTag(group.main.name)}
                                            />
                                        </div>
                                        {group.children.length > 0 && (
                                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-app-border/30 pl-2">
                                                {group.children.map(child => (
                                                    <TagPickerRow
                                                        key={child.name}
                                                        tag={child}
                                                        isSelected={child.name === selectedTagName}
                                                        isAncestor={false}
                                                        onClick={() => selectTag(child.name)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-sm text-app-muted text-center italic border border-dashed border-app-border rounded-lg">
                                    No tags found for "{searchQuery}".
                                </div>
                            )
                        ) : (
                            <>
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
                            </>
                        )}

                        {/* 3. BOTTONE/FORM AGGIUNGI (Scollabile, in fondo) */}
                        {!isSearching && (
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
                        )}

                    </div>
                    {/* --- FINE LISTA SCROLLABILE --- */}

                </div>
            )}
        </div>
    );
};