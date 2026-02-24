import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faChevronRight, faChevronLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../utils/types';
import { Icon } from '../../components/Icon.tsx'; // Ensure this path is correct

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

    // Close dropdown on outside click
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

    // Find the currently selected tag object for the main button display
    const selectedTag = tags.find(t => t.name === selectedTagName);

    // Filter tags to show based on the current parent
    const displayedTags = tags.filter(t => (t.parentName || null) === currentParentName);
    const currentParentTag = tags.find(t => t.name === currentParentName);

    const handleTagClick = (tag: Tag) => {
        const hasChildren = tags.some(t => t.parentName === tag.name);

        if (hasChildren) {
            setCurrentParentName(tag.name);
        } else {
            onSelectTag(tag.name);
            setIsOpen(false);
            setCurrentParentName(null);
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                <FontAwesomeIcon icon={faTags} className="mr-2" />
                Tag
            </label>

            {/* Main Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-[48px] w-full items-center justify-between rounded-xl border border-white/10 bg-[#1a1a1a] px-4 text-left outline-none transition-all focus:border-[#00ff7f]"
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
                    icon={isOpen ? faChevronLeft : faChevronRight}
                    className={`transition-transform duration-300 text-white/40 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl animate-[fadeIn_0.1s_ease-out]">

                    {/* Header: Back Button */}
                    {currentParentName && (
                        <button
                            type="button"
                            onClick={() => setCurrentParentName(currentParentTag?.parentName || null)}
                            className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-bold text-[#00ff7f] hover:bg-white/5 mb-2 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                            Back to {currentParentTag?.parentName ? currentParentTag.parentName : 'Main Categories'}
                        </button>
                    )}

                    {/* Tag List */}
                    <div className="max-h-[250px] overflow-y-auto space-y-1 custom-scrollbar pr-1">
                        {displayedTags.length > 0 ? (
                            displayedTags.map(tag => {
                                const hasChildren = tags.some(t => t.parentName === tag.name);
                                const isSelected = tag.name === selectedTagName;

                                return (
                                    <button
                                        key={tag.name}
                                        type="button"
                                        onClick={() => handleTagClick(tag)}
                                        className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors group
                                            ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Tag Icon */}
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-110
                                                    ${isSelected ? 'bg-black/40' : 'bg-black/20'}
                                                `}
                                                style={{ color: tag.colorHex || '#ffffff' }}
                                            >
                                                <Icon icon={tag.icon} color={tag.colorHex || '#ffffff'} />
                                            </div>

                                            {/* Tag Name */}
                                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                                                {tag.name}
                                            </span>
                                        </div>

                                        {/* Right Side Indicator (Children or Selected Checkmark) */}
                                        <div className="flex items-center">
                                            {hasChildren ? (
                                                <FontAwesomeIcon icon={faChevronRight} className="text-white/30 text-xs" />
                                            ) : isSelected ? (
                                                <FontAwesomeIcon icon={faCheck} className="text-[#00ff7f] text-sm" />
                                            ) : null}
                                        </div>
                                    </button>
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