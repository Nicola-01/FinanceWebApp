import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconKey, ICONS, ICON_CATEGORIES } from '../../utils/icons.ts';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

interface IconSelectorProps {
    value: IconKey;
    onChange: (icon: IconKey) => void;
    currentColor: string; // <-- Added to receive the updated color
}

export const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, currentColor }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter categories based on search query
    const filteredCategories = Object.entries(ICON_CATEGORIES).map(([category, keys]) => {
        const filteredKeys = keys.filter(key => key.toLowerCase().includes(searchQuery.toLowerCase()));
        return { category, keys: filteredKeys };
    }).filter(c => c.keys.length > 0);

    const toggleSearch = () => {
        if (isSearchOpen) {
            setIsSearchOpen(false);
            setSearchQuery('');
        } else {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    };

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="custom-scrollbar flex max-h-[220px] flex-col gap-4 overflow-y-auto pr-2 relative">
                {/* Search Header */}
                <div className="flex items-center justify-between min-h-[32px] shrink-0">
                    {!isSearchOpen && <span className="text-sm font-medium text-app-text">Select an Icon</span>}
                    <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'w-full' : 'w-auto'}`}>
                        {isSearchOpen ? (
                            <div className="flex w-full items-center gap-2 rounded-lg bg-app-background px-3 py-1.5 focus-within:ring-1 focus-within:ring-app-primary">
                                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-app-muted text-xs" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search icons..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-sm text-app-text outline-none placeholder:text-app-muted"
                                />
                                <button onClick={toggleSearch} className="text-app-muted hover:text-app-text flex items-center justify-center">
                                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={toggleSearch}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-background hover:text-app-text transition-colors"
                                title="Search Icons"
                            >
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Icon Categories */}
                {filteredCategories.length === 0 ? (
                    <div className="flex h-20 items-center justify-center text-sm text-app-muted">
                        No icons found.
                    </div>
                ) : (
                    filteredCategories.map(({ category, keys }) => (
                        <div key={category} className="flex flex-col gap-2">
                            <div className="py-0 text-center w-full">
                                <h3 className="text-[10px] font-semibold text-app-muted/60 uppercase tracking-wider">
                                    &mdash; {category} &mdash;
                                </h3>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {keys.map((key) => {
                                    const isActive = value === key;
                                    return (
                                        <div
                                            key={key}
                                            className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-lg transition-all hover:scale-110 ${isActive ? '' : 'text-app-muted hover:bg-app-background'}`}
                                            style={{
                                                color: isActive ? currentColor : undefined,
                                                backgroundColor: isActive ? `${currentColor}33` : undefined,
                                            }}
                                            onClick={() => onChange(key)}
                                            title={key}
                                        >
                                            <FontAwesomeIcon icon={ICONS[key]} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};