import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { PatToken } from '../../utils/types';

interface TokenActionButtonsProps {
    token: PatToken;
    onEdit?: (token: PatToken) => void;
    onDelete?: (token: PatToken) => void;
    revokingId?: string | null;
}

export const TokenActionButtons: React.FC<TokenActionButtonsProps> = ({
    token,
    onEdit,
    onDelete,
    revokingId
}) => {
    return (
        <div className="flex shrink-0 gap-2">
            {onEdit && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(token); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#a78bfa]/15 hover:text-[#a78bfa]"
                    title="Edit permissions"
                >
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                </button>
            )}
            {onDelete && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(token); }}
                    disabled={revokingId === token.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-app-red/15 hover:text-app-red disabled:opacity-40"
                    title="Revoke Token"
                >
                    <FontAwesomeIcon 
                        icon={faTrash} 
                        className={`text-xs ${revokingId === token.id ? 'animate-pulse' : ''}`} 
                    />
                </button>
            )}
        </div>
    );
};
