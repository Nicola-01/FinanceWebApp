import React, {useEffect, useState} from 'react';
import api from '../../api/axiosConfig';
import {triggerToast} from '../../components/ToastNotification';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faClock, faCrown, faEye, faPen, faSpinner} from '@fortawesome/free-solid-svg-icons';
import type {Wallet, WalletMember} from '../../utils/types';

// Importiamo i nuovi sotto-componenti
import {InviteSection} from './InviteSection';
import {MemberCategory} from './MemberCategory';
import {getUserAuth} from "../../utils/authHelper.ts";

interface ShareTabProps {
    wallet: Wallet;
}

const user = getUserAuth();

export const ShareTab: React.FC<ShareTabProps> = ({wallet}) => {
    const [members, setMembers] = useState<WalletMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, [wallet.id,]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/invitations/${wallet.id}`);
            setMembers(response.data);
        } catch (err) {
            triggerToast("Error loading wallet members.", false);
        } finally {
            setIsLoading(false);
        }
    };

    const isOwner = members.find(m => m.userId === user?.userId)?.role === 'OWNER';
    console.log("userId", user?.userId)
    console.log("filtered", members.find(m => m.userId === user?.userId))
    console.log("members", members)
    console.log("isOwner", isOwner)

    // Handler per InviteSection (ritorna un booleano così il form sa se resettarsi)
    const handleInvite = async (identifier: string, role: 'EDITOR' | 'VIEWER'): Promise<boolean> => {
        try {
            await api.post(`/invitations/${wallet.id}`, {
                user: identifier.trim(),
                role: role
            });

            triggerToast(`Invitation sent to ${identifier}!`, true);
            fetchMembers();
            return true;
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error sending invite", false);
            return false;
        }
    };

    // Handler per MemberCategory/MemberRow
    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName}?`)) return;
        try {
            await api.delete(`/wallets/${wallet.id}/invitations/${memberId}`);
            setMembers(prev => prev.filter(m => m.userId !== memberId));
            triggerToast(`${memberName} removed successfully.`, true);
        } catch (err) {
            triggerToast("Error removing member.", false);
        }
    };

    const handleChangeRole = async (memberId: string, newRole: 'EDITOR' | 'VIEWER') => {
        try {
            await api.put(`/wallets/${wallet.id}/invitations/${memberId}/role`, {role: newRole});
            setMembers(prev => prev.map(m => m.userId === memberId ? {...m, role: newRole} : m));
            triggerToast("Role updated successfully.", true);
        } catch (err) {
            triggerToast("Error updating role.", false);
        }
    };

    // Raggruppamenti logici
    const owners = members.filter(m => m.role === 'OWNER');
    const editors = members.filter(m => m.role === 'EDITOR' && m.status === 'ACCEPTED');
    const viewers = members.filter(m => m.role === 'VIEWER' && m.status === 'ACCEPTED');
    const pending = members.filter(m => m.status === 'PENDING');

    return (
        <div
            className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar animate-[fadeIn_0.3s_ease-out]">

            {isOwner && (
                <InviteSection walletColor={wallet.color} onInvite={handleInvite}/>
            )}

            <div className="flex flex-col gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-10 text-white/30">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-2xl"/>
                    </div>
                ) : (
                    <>
                        <MemberCategory
                            title="Owner" members={owners} icon={faCrown} iconColor="#ffd700"
                            canManage={isOwner} onRemove={handleRemoveMember} onChangeRole={handleChangeRole}
                        />
                        <MemberCategory
                            title="Editors" members={editors} icon={faPen} iconColor={wallet.color}
                            canManage={isOwner} onRemove={handleRemoveMember} onChangeRole={handleChangeRole}
                        />
                        <MemberCategory
                            title="Viewers" members={viewers} icon={faEye} iconColor="#a0aec0"
                            canManage={isOwner} onRemove={handleRemoveMember} onChangeRole={handleChangeRole}
                        />

                        {/* I pending sono visibili solo all'owner per permettergli di revocarli */}
                        {isOwner && (
                            <MemberCategory
                                title="Pending Invites" titleColor="text-amber-500/50" members={pending} icon={faClock}
                                iconColor="#f59e0b"
                                canManage={isOwner} onRemove={handleRemoveMember} onChangeRole={handleChangeRole}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};