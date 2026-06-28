import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { WalletMember } from '../../utils/types';
import { getUserAuth } from "../../utils/authHelper.ts";

interface MemberRowProps {
    member: WalletMember;
    icon: any;
    iconColor: string;
    canManage: boolean;
    onRemove: (id: string, name: string) => void;
    onChangeRole: (id: string, newRole: 'EDITOR' | 'VIEWER') => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, icon, iconColor, canManage, onRemove, onChangeRole }) => {
    const user = getUserAuth();
    const isCurrentUser = member.userId === user?.userId;

    const [selectedRole, setSelectedRole] = useState<'EDITOR' | 'VIEWER'>(
        member.role === 'OWNER' ? 'VIEWER' : member.role
    );
    const hasRoleChanged = selectedRole !== member.role;

    useEffect(() => {
        setSelectedRole(member.role === 'OWNER' ? 'VIEWER' : member.role);
    }, [member.role]);

    return (
        <div className="flex items-center justify-between p-4 bg-app-input border border-app-border rounded-2xl transition-all hover:bg-app-surface group">
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-surface text-lg shadow-sm" style={{ color: iconColor }}>
                    <FontAwesomeIcon icon={icon} />
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-app-text truncate">{member.username}</span>
                        {isCurrentUser && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-app-text/10 text-app-text">YOU</span>
                        )}
                        {member.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500">PENDING</span>
                        )}
                    </div>
                    <span className="text-xs text-app-muted truncate">{member.email}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {canManage && !isCurrentUser && member.role !== 'OWNER' && (
                    <>
                        {member.status === 'ACCEPTED' && (
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-lg bg-app-input p-1 border border-app-border w-36">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole('VIEWER')}
                                        className={`flex-1 rounded py-1 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'VIEWER'
                                            ? 'bg-cyan-600/20 text-app-text shadow-sm'
                                            : 'text-app-muted hover:text-app-text'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        Viewer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRole('EDITOR')}
                                        className={`flex-1 rounded py-1 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${selectedRole === 'EDITOR'
                                            ? 'bg-amber-400/20 text-amber-400 shadow-sm'
                                            : 'text-app-muted hover:text-app-text'
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faPen} />
                                        Editor
                                    </button>
                                </div>
                                <button
                                    onClick={() => onChangeRole(member.userId, selectedRole)}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-app-green/10 text-app-green hover:bg-app-green hover:text-black transition-colors ${
                                        hasRoleChanged ? '' : 'opacity-20 cursor-not-allowed'
                                    }`}
                                    disabled={hasRoleChanged}
                                    title="Save Role"
                                >
                                    <FontAwesomeIcon icon={faCheck} className="text-sm" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => onRemove(member.userId, member.username)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title={member.status === 'PENDING' ? "Cancel Invite" : "Remove User"}
                        >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};