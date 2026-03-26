import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faCheckSquare, faSquare, faMinusSquare } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../utils/types.ts';
import { Icon } from '../Icon.tsx';

export interface TagFilterRowProps {
    tag: Tag;
    childrenTags?: Tag[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    selectionState: 'checked' | 'unchecked' | 'indeterminate';
    onToggleSelection: () => void;
    color?: string;
}

export const TagFilterRow: React.FC<TagFilterRowProps> = ({
    tag,
    childrenTags = [],
    isExpanded,
    onToggleExpand,
    selectionState,
    onToggleSelection,
    color = '#00ff7f'
}) => {
    const hasChildren = childrenTags.length > 0;

    let checkboxIcon = faSquare;
    let iconClass = "text-white/40";
    if (selectionState === 'checked') {
        checkboxIcon = faCheckSquare;
        iconClass = "";
    } else if (selectionState === 'indeterminate') {
        checkboxIcon = faMinusSquare;
        iconClass = "";
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
            <div className="flex items-center gap-3 flex-1" onClick={onToggleSelection}>
                <FontAwesomeIcon
                    icon={checkboxIcon}
                    className={`text-lg transition-colors ${iconClass}`}
                    style={selectionState !== 'unchecked' ? { color } : {}}
                />
                <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs"
                    style={{ color: tag.colorHex || '#ffffff' }}
                >
                    <Icon icon={tag.icon} color={tag.colorHex || '#ffffff'} />
                </div>
                <span className="text-white text-sm font-medium truncate">{tag.name}</span>
            </div>

            {hasChildren && (
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                    }}
                >
                    <FontAwesomeIcon
                        icon={isExpanded ? faChevronDown : faChevronRight}
                        className="text-white/40 text-xs transition-transform duration-300"
                    />
                </div>
            )}
        </div>
    );
};
