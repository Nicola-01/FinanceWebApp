import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faUserPlus, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { SettingsCard } from '../../components/settings/SettingsCard.tsx';

interface InviteSectionProps {
    walletColor: string;
    onInvite: (identifier: string, role: 'EDITOR' | 'VIEWER') => Promise<boolean>;
}

export const InviteSection: React.FC<InviteSectionProps> = ({ walletColor, onInvite }) => {
    const [identifier, setIdentifier] = useState('');
    const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
    const [isInviting, setIsInviting] = useState(false);

    const handleSubmit = async () => {
        setIsInviting(true);

        const success = await onInvite(identifier, role);
        if (success) {
            setIdentifier('');
        }

        setIsInviting(false);
    };

    return (
        <SettingsCard
            title="Invite People"
            icon={faUserPlus}
            iconColor={walletColor}
            subtitle="Add users to collaborate on this wallet."
            actionText="Send Invite"
            actionIcon={faPaperPlane}
            actionColor={walletColor}
            onAction={handleSubmit}
            actionDisabled={isInviting || identifier.trim().length < 3}
            isActionLoading={isInviting}
        >
            {/* Layout a colonna (stacked) per rispecchiare il design dell'immagine */}
            <div className="flex flex-col gap-5 mt-2">

                {/* 1. Input Username/Email (Larghezza Piena) */}
                <div className="w-full">
                    <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                        Username or Email
                    </label>
                    <input
                        className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-sm text-app-text outline-none transition-all focus:border-app-border shadow-inner"
                        type="search"
                        placeholder="Username or Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                    />
                </div>

                <div className="w-full self-end">
                    <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                        Permission Role
                    </label>
                    <div className="flex rounded-xl bg-app-input p-1 border border-app-border w-full shadow-inner h-[48px]">
                        <button
                            type="button"
                            onClick={() => setRole('VIEWER')}
                            className={`flex-1 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 ${role === 'VIEWER'
                                ? 'theme-bg-primary-light  text-app-text shadow-sm'
                                : 'text-app-muted hover:text-app-text'
                                }`}
                        >
                            <FontAwesomeIcon icon={faEye} />
                            Viewer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('EDITOR')}
                            className={`flex-1 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 ${role === 'EDITOR'
                                ? 'theme-bg-warning-light theme-text-warning shadow-sm'
                                : 'text-app-muted hover:text-app-text'
                                }`}
                        >
                            <FontAwesomeIcon icon={faPen} />
                            Editor
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-app-muted text-center">
                        {role === 'VIEWER'
                            ? "Viewers can only read transactions and statistics."
                            : "Editors can add, edit, and delete transactions."}
                    </p>
                </div>
            </div>
        </SettingsCard>
    );
};