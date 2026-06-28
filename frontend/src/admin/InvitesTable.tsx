import React, {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faClock, faCopy, faEnvelopeOpenText, faTrash} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../components/ui/ToastNotification.tsx';

export interface AdminInvite {
    email: string;
    note: string;
    url: string;
    createdAt: string;
    expiresAt: string;
    status: string;
}

interface InvitesTableProps {
    invites: AdminInvite[];
    onRevoke: (email: string) => void;
}

export const InvitesTable: React.FC<InvitesTableProps> = ({ invites, onRevoke }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeRemaining = (expiresAt: string) => {
        const total = new Date(expiresAt).getTime() - Date.now();
        if (total <= 0) return "Expired";

        const d = Math.floor(total / (1000 * 60 * 60 * 24));
        const h = Math.floor((total / (1000 * 60 * 60)) % 24);
        const m = Math.floor((total / 1000 / 60) % 60);
        const s = Math.floor((total / 1000) % 60);

        if (d > 0) {
            return `${d}d ${h}h ${m}m ${s}s`;
        }
        return `${h}h ${m}m ${s}s`;
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        triggerToast("Invite link copied to clipboard", true);
    };

    if (invites.length === 0) return null;

    return (
        <div className="mb-10">
            <h4 className="mb-[15px] flex items-center gap-2.5 text-[1.1rem] font-semibold theme-text-muted">
                <FontAwesomeIcon icon={faEnvelopeOpenText} /> Pending Invitations
            </h4>

            <div className="overflow-hidden rounded-xl border border-app-border theme-bg-overlay-light">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-app-muted">
                        <thead className="bg-app-input text-xs uppercase text-app-muted">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Note</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expires In</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y theme-divide-subtle">
                        {invites.map((invite, index) => {
                            // Calcolo dello stato effettivo
                            const isExpiredTime = new Date(invite.expiresAt).getTime() - Date.now() <= 0;

                            let displayStatus = invite.status;
                            if (displayStatus === 'PENDING' && isExpiredTime) {
                                displayStatus = 'EXPIRED';
                            }

                            // Assegnazione dei colori in base allo stato
                            let statusColorClasses = '';
                            switch (displayStatus) {
                                case 'ACCEPTED':
                                    statusColorClasses = 'bg-app-green/10 text-app-green border border-app-green/20';
                                    break;
                                case 'EXPIRED':
                                case 'REVOKED':
                                    statusColorClasses = 'theme-bg-danger-transparent theme-text-danger border theme-border-danger-light';
                                    break;
                                case 'PENDING':
                                default:
                                    statusColorClasses = 'theme-bg-warning-transparent theme-text-warning border theme-border-warning';
                                    break;
                            }

                            const isRevoked = displayStatus === 'REVOKED';
                            const isExpired = displayStatus === 'EXPIRED';
                            const isAccepted = displayStatus === 'ACCEPTED';
                            const isPending = displayStatus === 'PENDING';

                            return (
                                <tr key={index} className="transition-colors hover:bg-app-input">
                                    <td className="px-6 py-4 font-medium theme-text-default">{invite.email}</td>
                                    <td className="px-6 py-4">{invite.note || <span className="theme-text-subtle italic">No note</span>}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColorClasses}`}>
                                            {displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-app-mono text-app-sky">
                                        {/* Nascondiamo il timer se l'invito non è più PENDING */}
                                        {!isRevoked && !isExpired && !isAccepted ? (
                                            <>
                                                <FontAwesomeIcon icon={faClock} className="mr-2 opacity-50" />
                                                {getTimeRemaining(invite.expiresAt)}
                                            </>
                                        ) : (
                                            <span className="theme-text-subtle italic font-sans text-xs">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* Il pulsante di copia è visibile solo se l'invito è ancora attivo/PENDING */}
                                        {!isRevoked && !isExpired && !isAccepted && (
                                            <button
                                                onClick={() => handleCopyUrl(invite.url)}
                                                className="rounded-lg bg-app-input p-2 text-app-muted transition-colors hover:bg-app-surface hover:theme-text-default"
                                                title="Copy Invite Link"
                                            >
                                                <FontAwesomeIcon icon={faCopy} />
                                            </button>
                                        )}

                                        {isPending && (
                                            <button
                                                onClick={() => onRevoke(invite.email)}
                                                className="ml-2 rounded-lg theme-bg-danger-transparent p-2 theme-text-danger transition-colors hover:theme-bg-danger hover:theme-text-default"
                                                title="Revoke Invitation"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};