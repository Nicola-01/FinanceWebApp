import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTags,
    faChevronRight,
    faChevronLeft,
    faCheck,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../utils/types';
import { Icon } from '../../components/Icon.tsx'; // Assicurati che il percorso sia corretto

interface HierarchicalTagSelectorProps {
    tags: Tag[];
    selectedTagName: string;
    onSelectTag: (tagName: string) => void;
}

export const HierarchicalTagSelector: React.FC<HierarchicalTagSelectorProps> = ({
                                                                                    tags,
                                                                                    selectedTagName,
                                                                                    onSelectTag,
                                                                                }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentParentName, setCurrentParentName] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Chiude il dropdown se si clicca fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setCurrentParentName(null);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Trova il tag attualmente selezionato per il bottone principale
    const selectedTag = tags.find(t => t.name === selectedTagName);

    // Filtra i tag da mostrare in base al genitore corrente
    const displayedTags = tags.filter(t => (t.parentName || null) === currentParentName);
    const currentParentTag = tags.find(t => t.name === currentParentName);

    // FUNZIONE MAGICA: Controlla se il tag è un "antenato" (padre/nonno) del tag attualmente selezionato
    const isAncestorOfSelected = (tagName: string, targetSelectedName: string): boolean => {
        if (!targetSelectedName) return false;
        let current = tags.find(t => t.name === targetSelectedName);

        while (current && current.parentName) {
            if (current.parentName === tagName) return true;
            current = tags.find(t => t.name === current?.parentName);
        }
        return false;
    };

    // 1. Seleziona DEFINITIVAMENTE il tag
    const selectTag = (tagName: string) => {
        onSelectTag(tagName);
        setIsOpen(false);
        setCurrentParentName(null);
    };

    // 2. Naviga nei figli
    const navigateToChildren = (e: React.MouseEvent, tagName: string) => {
        e.stopPropagation(); // Evita che il click si propaghi selezionando il tag
        setCurrentParentName(tagName);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                <FontAwesomeIcon icon={faTags} className="mr-2" />
                Tag *
            </label>

            {/* Bottone Principale */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-12 w-full items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-left outline-none transition-all focus:border-[#00ff7f]"
            >
                {selectedTag ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs"
                            style={{ color: selectedTag.colorHex || '#ffffff' }}
                        >
                            <Icon icon={selectedTag.icon} color={selectedTag.colorHex || '#ffffff'} />
                        </div>
                        <span className="text-white font-medium">{selectedTag.name}</span>
                    </div>
                ) : (
                    <span className="text-white/40">Select a tag...</span>
                )}

                <FontAwesomeIcon
                    icon={isOpen ? faChevronUp : faChevronDown}
                    className="transition-transform duration-300 text-white/40"
                />
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out]">

                    {/* Header: Bottone Back e Linea Divisoria */}
                    {currentParentName && (
                        <>
                            <button
                                type="button"
                                onClick={() => setCurrentParentName(currentParentTag?.parentName || null)}
                                className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-bold text-[#00ff7f] hover:bg-white/5 transition-colors outline-none"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                                Back to {currentParentTag?.parentName ? currentParentTag.parentName : 'Main Categories'}
                            </button>
                            <hr className="my-2 border-white/10" />
                        </>
                    )}

                    {/* Lista dei Tag */}
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {displayedTags.length > 0 ? (
                            displayedTags.map(tag => {
                                const hasChildren = tags.some(t => t.parentName === tag.name);
                                const isSelected = tag.name === selectedTagName;
                                const isAncestor = isAncestorOfSelected(tag.name, selectedTagName);

                                // Determina la classe visiva (Normale, Selezionato, o Padre di un selezionato)
                                let visualClass = 'hover:bg-white/5 border border-transparent';
                                if (isSelected) {
                                    visualClass = 'bg-white/10 border border-transparent';
                                } else if (isAncestor) {
                                    visualClass = 'bg-[#00ff7f]/10 border border-[#00ff7f]/20';
                                }

                                return (
                                    <div
                                        key={tag.name}
                                        className={`flex w-full items-stretch justify-between rounded-lg transition-colors group ${visualClass}`}
                                    >
                                        {/* PARTE SINISTRA: Seleziona il Tag */}
                                        <button
                                            type="button"
                                            onClick={() => selectTag(tag.name)}
                                            className="flex flex-1 items-center gap-3 p-3 text-left outline-none rounded-l-lg"
                                        >
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-110
                                                    ${isSelected || isAncestor ? 'bg-black/40' : 'bg-black/20'}
                                                `}
                                                style={{ color: tag.colorHex || '#ffffff' }}
                                            >
                                                <Icon icon={tag.icon} color={tag.colorHex || '#ffffff'} />
                                            </div>

                                            <span className={`text-sm font-medium ${isSelected || isAncestor ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                {tag.name}
                                            </span>
                                        </button>

                                        {/* PARTE DESTRA: Naviga nei figli */}
                                        <div className="flex items-center">
                                            {hasChildren ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => navigateToChildren(e, tag.name)}
                                                    className="flex h-full items-center justify-center px-4 text-white/30 hover:bg-white/10 hover:text-white rounded-r-lg transition-colors outline-none"
                                                    title={`Vedi sottocategorie di ${tag.name}`}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faChevronRight}
                                                        // Se è il padre del tag selezionato, illumina anche la freccia di verde!
                                                        className={isAncestor ? "text-[#00ff7f] text-sm" : "text-xs"}
                                                    />
                                                </button>
                                            ) : isSelected ? (
                                                <div className="flex h-full items-center justify-center px-4">
                                                    <FontAwesomeIcon icon={faCheck} className="text-[#00ff7f] text-sm" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-4 text-sm text-white/40 text-center italic border border-dashed border-white/10 rounded-lg">
                                No tags found in this category.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};