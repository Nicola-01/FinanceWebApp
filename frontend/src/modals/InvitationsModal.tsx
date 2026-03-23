import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEnvelope, faHistory, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import api from '../api/axiosConfig';
import type { Invitation } from "../utils/types.ts";
import { type IconKey, ICONS } from "../utils/icons.ts"; // Importiamo le icone

export interface InvitationsModalHandle {
    openModal: (invites: Invitation[]) => void;
}

export const InvitationsModal = forwardRef<InvitationsModalHandle>((_props, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [loading, setLoading] = useState(false);

    const [invitations, setInvitations] = useState<Invitation[]>([]);

    useImperativeHandle(ref, () => ({
        openModal: (invites: Invitation[]) => {
            setActiveTab('PENDING');
            setInvitations(invites);
            dialogRef.current?.showModal();
        }
    }));

    const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
        setLoading(true);
        try {
            await api.post(`/invitations/${id}/${action.toLowerCase()}`);
            triggerToast(`Invitation ${action.toLowerCase()}ed!`, true);
            // In un'applicazione reale qui dovresti chiamare una funzione per ricaricare i dati
            dialogRef.current?.close();
        } catch (err: any) {
            triggerToast("Error processing invitation.", false);
        } finally {
            setLoading(false);
        }
    };

    const pendingInvites = invitations.filter(i => i.status === 'PENDING');
    const historyInvites = invitations.filter(i => i.status !== 'PENDING');

    return (
        <ModalDialog
            ref={dialogRef}
            className="max-w-[500px]"
            onCloseClick={() => dialogRef.current?.close()}
            title={<><FontAwesomeIcon icon={faEnvelope} className="text-[#00ff7f]" /> Invitations</>}
        >
            <div className="text-center pb-2">
                {/* Tabs */}
                <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 mb-4">
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'PENDING' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                    >
                        Pending ({pendingInvites.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'HISTORY' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                    >
                        <FontAwesomeIcon icon={faHistory} />
                        History
                    </button>
                </div>

                {/* Contenuto delle Tab */}
                <div className="max-h-[350px] overflow-y-auto space-y-3 custom-scrollbar text-left pr-1">
                    {activeTab === 'PENDING' && (
                        pendingInvites.length > 0 ? pendingInvites.map(inv => (
                            <div
                                key={inv.wallet.id}
                                className="flex flex-col gap-3 rounded-xl border p-4 transition-all"
                                style={{
                                    borderColor: `${inv.wallet.color}4d`, // 30% opacità
                                    backgroundColor: `${inv.wallet.color}0d` // 5% opacità
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icona Wallet Dinamica */}
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl shadow-lg"
                                        style={{
                                            backgroundColor: `${inv.wallet.color}26`,
                                            borderColor: `${inv.wallet.color}40`,
                                            color: inv.wallet.color
                                        }}
                                    >
                                        <FontAwesomeIcon icon={ICONS[inv.wallet.icon as IconKey] || faEnvelope} />
                                    </div>

                                    <div>
                                        <p className="text-white font-bold text-lg leading-tight">{inv.wallet.name}</p>
                                        <p className="text-white/60 text-xs mt-1">
                                            Invited by <span className="text-white font-medium">{inv.walletOwner}</span> as <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/10 ml-1">{inv.role}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleAction(inv.wallet.id, 'REJECT')} disabled={loading} className="flex-1 rounded-lg bg-white/5 text-white/60 py-2.5 text-xs font-bold hover:bg-[#ff4d4d]/20 hover:text-[#ff4d4d] transition-all border border-transparent hover:border-[#ff4d4d]/30">
                                        <FontAwesomeIcon icon={faXmark} className="mr-2" /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(inv.wallet.id, 'ACCEPT')}
                                        disabled={loading}
                                        className="flex-1 rounded-lg py-2.5 text-xs font-bold text-black transition-all hover:scale-[1.02] active:scale-95"
                                        style={{ backgroundColor: inv.wallet.color }}
                                    >
                                        <FontAwesomeIcon icon={faCheck} className="mr-2" /> Accept
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-white/40 text-sm text-center py-8 italic">No pending invitations.</p>
                        )
                    )}

                    {activeTab === 'HISTORY' && (
                        historyInvites.length > 0 ? historyInvites.map(inv => (
                            <div key={inv.wallet.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                                <div className="flex items-center gap-3">
                                    {/* Icona ridotta per la cronologia */}
                                    <div
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                                        style={{
                                            backgroundColor: `${inv.wallet.color}20`,
                                            color: inv.wallet.color
                                        }}
                                    >
                                        <FontAwesomeIcon icon={ICONS[inv.wallet.icon as IconKey] || faEnvelope} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm leading-tight">{inv.wallet.name}</p>
                                        <p className="text-white/40 text-[11px]">From: {inv.walletOwner}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded ${inv.status === 'ACCEPTED' ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-[#ff4d4d]/20 text-[#ff4d4d]'}`}>
                                    {inv.status}
                                </span>
                            </div>
                        )) : (
                            <p className="text-white/40 text-sm text-center py-8 italic">No past invitations.</p>
                        )
                    )}
                </div>
            </div>
        </ModalDialog>
    );
});