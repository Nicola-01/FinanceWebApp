import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheck, faEnvelope, faHistory, faXmark} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from './ModalDialog';
import {triggerToast} from '../components/ToastNotification';
import api from '../api/axiosConfig';

export interface InvitationsModalHandle {
    openModal: () => void;
}

export const InvitationsModal = forwardRef<InvitationsModalHandle>((_props, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
    const [loading, setLoading] = useState(false);

    // TODO: Questi andranno popolati con una chiamata api.get('/invitations')
    // Struttura di esempio:
    const mockInvites = [
        { id: '1', walletName: 'Family Budget', inviter: 'mario.rossi', status: 'PENDING', role: 'EDITOR' },
        { id: '2', walletName: 'Trip to Japan', inviter: 'luigi.verdi', status: 'ACCEPTED', role: 'VIEWER' },
        { id: '3', walletName: 'Scam Wallet', inviter: 'unknown_user', status: 'REJECTED', role: 'VIEWER' },
    ];

    useImperativeHandle(ref, () => ({
        openModal: () => {
            setActiveTab('PENDING');
            // TODO: fetchInvitations();
            dialogRef.current?.showModal();
        }
    }));

    const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
        setLoading(true);
        try {
            await api.post(`/invitations/${id}/${action.toLowerCase()}`);
            triggerToast(`Invitation ${action.toLowerCase()}ed!`, true);
            // TODO: Ricarica la lista degli inviti
        } catch (err: any) {
            triggerToast("Error processing invitation.", false);
        } finally {
            setLoading(false);
        }
    };

    const pendingInvites = mockInvites.filter(i => i.status === 'PENDING');
    const historyInvites = mockInvites.filter(i => i.status !== 'PENDING');

    return (
        <ModalDialog ref={dialogRef} className="max-w-[500px]">
            <div className="text-center">
                <h3 className="mb-4 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                    <FontAwesomeIcon icon={faEnvelope} className="text-[#00ff7f]" />
                    Invitations
                </h3>

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
                <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar text-left pr-1">
                    {activeTab === 'PENDING' && (
                        pendingInvites.length > 0 ? pendingInvites.map(inv => (
                            <div key={inv.id} className="flex flex-col gap-3 rounded-xl border border-[#00ff7f]/30 bg-[#00ff7f]/5 p-4">
                                <div>
                                    <p className="text-white font-bold text-base">{inv.walletName}</p>
                                    <p className="text-white/60 text-xs">Invited by <span className="text-white">{inv.inviter}</span> as <span className="font-bold">{inv.role}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAction(inv.id, 'REJECT')} disabled={loading} className="flex-1 rounded-lg bg-[#ff4d4d]/10 text-[#ff4d4d] py-2 text-sm font-bold hover:bg-[#ff4d4d]/20 transition-colors">
                                        <FontAwesomeIcon icon={faXmark} className="mr-1" /> Reject
                                    </button>
                                    <button onClick={() => handleAction(inv.id, 'ACCEPT')} disabled={loading} className="flex-1 rounded-lg bg-[#00ff7f] text-black py-2 text-sm font-bold hover:bg-[#00e673] transition-colors">
                                        <FontAwesomeIcon icon={faCheck} className="mr-1" /> Accept
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-white/40 text-sm text-center py-8">No pending invitations.</p>
                        )
                    )}

                    {activeTab === 'HISTORY' && (
                        historyInvites.length > 0 ? historyInvites.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4">
                                <div>
                                    <p className="text-white font-bold text-sm">{inv.walletName}</p>
                                    <p className="text-white/40 text-xs">From: {inv.inviter}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${inv.status === 'ACCEPTED' ? 'bg-[#00ff7f]/20 text-[#00ff7f]' : 'bg-[#ff4d4d]/20 text-[#ff4d4d]'}`}>
                                    {inv.status}
                                </span>
                            </div>
                        )) : (
                            <p className="text-white/40 text-sm text-center py-8">No past invitations.</p>
                        )
                    )}
                </div>

                <div className="pt-4 border-t border-white/10 mt-4">
                    <button type="button" onClick={() => dialogRef.current?.close()} className="w-full rounded-xl bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10">
                        Close
                    </button>
                </div>
            </div>
        </ModalDialog>
    );
});