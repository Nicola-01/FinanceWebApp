import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../../utils/types';
import { Icon } from '../../../components/Icon.tsx';

interface TagPickerRowProps {
    tag: Tag;
    isSelected: boolean;
    isAncestor: boolean;
    isParentHeader?: boolean;
    onClick: () => void;
}

export const TagPickerRow: React.FC<TagPickerRowProps> = ({
                                                              tag,
                                                              isSelected,
                                                              isAncestor,
                                                              isParentHeader = false,
                                                              onClick
                                                          }) => {
    const isMainCategory = !tag.parentName;

    // Determina la classe visiva (Normale, Selezionato, o Padre di un tag selezionato)
    let visualClass = 'hover:bg-app-input border border-transparent cursor-pointer';
    if (isSelected) {
        visualClass = 'bg-app-surface border border-transparent';
    } else if (isAncestor && !isParentHeader) {
        visualClass = 'bg-[#00ff7f]/10 border border-[#00ff7f]/20';
    }

    return (
        <div
            onClick={onClick}
            className={`flex w-full items-center justify-between rounded-lg transition-colors p-3 ${visualClass} group`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-transform group-hover:scale-110
                        ${isSelected || isAncestor ? 'bg-black/40' : 'bg-black/20'}
                    `}
                    style={{ color: tag.colorHex || '#ffffff' }}
                >
                    <Icon icon={tag.icon} color={tag.colorHex || '#ffffff'} />
                </div>
                <span className={`text-sm font-medium ${isSelected || isAncestor ? 'text-white' : 'text-white/80'}`}>
                    {tag.name} {isParentHeader && <span className="opacity-50 text-xs italic ml-1">(General)</span>}
                </span>
            </div>

            <div className="flex items-center">
                {isMainCategory && !isParentHeader ? (
                    <FontAwesomeIcon
                        icon={faChevronRight}
                        className={isAncestor ? "text-[#00ff7f] text-sm" : "text-xs text-white/30 group-hover:text-app-muted"}
                    />
                ) : isSelected ? (
                    <FontAwesomeIcon icon={faCheck} className="text-[#00ff7f] text-sm" />
                ) : null}
            </div>
        </div>
    );
};