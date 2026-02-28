import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faPen, faSpinner, faUserPlus} from '@fortawesome/free-solid-svg-icons';

interface InviteSectionProps {
    walletColor: string;
    onInvite: (identifier: string, role: 'EDITOR' | 'VIEWER') => Promise<boolean>;
}

export const InviteSection: React.FC<InviteSectionProps> = ({ walletColor, onInvite }) => {
    const [identifier, setIdentifier] = useState('');
    const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
    const [isInviting, setIsInviting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);

        const success = await onInvite(identifier, role);
        if (success) {
            setIdentifier('');
        }

        setIsInviting(false);
    };

    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
            <h3 className="mb-1 text-lg font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faUserPlus} style={{ color: walletColor }} />
                Invite People
            </h3>
            <p className="mb-4 text-xs text-white/40">Add users to collaborate on this wallet.</p>

            {/* Layout a colonna (stacked) per rispecchiare il design dell'immagine */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-4">

                {/* 1. Input Username/Email (Larghezza Piena) */}
                <div className="w-full">
                    <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Username or Email
                    </label>
                    <input
                        className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-white/30"
                        type="search"
                        placeholder="Username or Email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                    />
                </div>

                <div className="w-full self-end">
                    <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">
                        Permission Role
                    </label>
                    <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 w-full">
                        <button
                            type="button"
                            onClick={() => setRole('VIEWER')}
                            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                role === 'VIEWER'
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <FontAwesomeIcon icon={faEye} />
                            Viewer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('EDITOR')}
                            className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                role === 'EDITOR'
                                    ? 'bg-amber-400/20 text-amber-400 shadow-sm'
                                    : 'text-white/40 hover:text-white/70'
                            }`}
                        >
                            <FontAwesomeIcon icon={faPen} />
                            Editor
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-white/40 text-center">
                        {role === 'VIEWER'
                            ? "Viewers can only read transactions and statistics."
                            : "Editors can add, edit, and delete transactions."}
                    </p>
                </div>

                {/* 3. Submit Button (Larghezza Piena in basso) */}
                <button
                    type="submit"
                    disabled={isInviting || identifier.trim().length < 3}
                    className="h-[48px] mt-2 w-full rounded-xl font-bold text-black transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    style={{ backgroundColor: walletColor, boxShadow: `0 4px 15px -5px ${walletColor}66` }}
                >
                    {isInviting ? <FontAwesomeIcon icon={faSpinner} spin /> : "Send Invite"}
                </button>

            </form>
        </div>
    );
};