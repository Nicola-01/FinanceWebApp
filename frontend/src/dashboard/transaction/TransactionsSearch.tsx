import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import type { Tag } from '../../utils/types.ts';

interface TransactionsSearchProps {
    tags: Tag[];
    selectedTags: string[];
    color?: string;
    onChange: (selectedTags: string[]) => void;
}

const TransactionsSearch: React.FC<TransactionsSearchProps> = ({ color = 'var(--color-app-green)' }) => {
    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon 
                    icon={faSearch} 
                    className="text-app-muted group-focus-within:text-white transition-colors"
                    style={{ color:  undefined }}
                />
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 bg-app-input border border-app-border rounded-xl text-sm placeholder-app-muted text-white focus:outline-none focus:ring-1 transition-all h-[48px] sm:w-64"
                placeholder="Search transactions..."
                style={{ 
                    borderColor: 'var(--app-border)',
                }}
                onFocus={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 0 0 1px ${color}40`;
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                }}
            />
        </div>
    );
};

export default TransactionsSearch;