import React, {useEffect, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faClock, faCopy, faEnvelopeOpenText} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../components/ToastNotification';

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
}

export const InvitesTable: React.FC<InvitesTableProps> = ({ invites }) => {
    // Stato per forzare il re-render ogni secondo
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeRemaining = (expiresAt: string) => {
        const total = new Date(expiresAt).getTime() - Date.now();
        if (total <= 0) return "Expired";

        const h = Math.floor((total / (1000 * 60 * 60)) % 24);
        const m = Math.floor((total / 1000 / 60) % 60);
        const s = Math.floor((total / 1000) % 60);

        return `${h}h ${m}m ${s}s`;
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        triggerToast("Invite link copied to clipboard", true);
    };

    if (invites.length === 0) return null;

    return (
        <div className="mb-10">
            <h4 className="mb-[15px] flex items-center gap-2.5 text-[1.1rem] font-semibold text-white/80">
                <FontAwesomeIcon icon={faEnvelopeOpenText} /> Pending Invitations
            </h4>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-white/70">
                        <thead className="bg-white/5 text-xs uppercase text-white/40">
                        <tr>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Note</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expires In</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {invites.map((invite, index) => {
                            const isExpired = new Date(invite.expiresAt).getTime() - Date.now() <= 0;

                            return (
                                <tr key={index} className="transition-colors hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-white">{invite.email}</td>
                                    <td className="px-6 py-4">{invite.note || <span className="text-white/20 italic">No note</span>}</td>
                                    <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                                isExpired || invite.status === 'EXPIRED'
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                                {isExpired ? 'EXPIRED' : invite.status}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 font-app-mono text-[#00bfff]">
                                        <FontAwesomeIcon icon={faClock} className="mr-2 opacity-50" />
                                        {getTimeRemaining(invite.expiresAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleCopyUrl(invite.url)}
                                            className="rounded-lg bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                                            title="Copy Invite Link"
                                        >
                                            <FontAwesomeIcon icon={faCopy} />
                                        </button>
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