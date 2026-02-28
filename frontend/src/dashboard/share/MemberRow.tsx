import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import type { WalletMember } from '../../utils/types';

interface MemberRowProps {
    member: WalletMember;
    icon: any;
    iconColor: string;
    canManage: boolean;
    onRemove: (id: string, name: string) => void;
    onChangeRole: (id: string, newRole: 'EDITOR' | 'VIEWER') => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({ member, icon, iconColor, canManage, onRemove, onChangeRole }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl transition-all hover:bg-white/10 group">
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 text-lg shadow-sm" style={{ color: iconColor }}>
                    <FontAwesomeIcon icon={icon} />
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{member.username}</span>
                        {member.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/20 text-white">YOU</span>
                        )}
                        {member.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500">PENDING</span>
                        )}
                    </div>
                    <span className="text-xs text-white/40 truncate">{member.email}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {canManage && !member.isCurrentUser && member.role !== 'OWNER' && (
                    <>
                        {member.status === 'ACTIVE' && (
                            <select
                                value={member.role}
                                onChange={(e) => onChangeRole(member.id, e.target.value as 'EDITOR' | 'VIEWER')}
                                className="bg-black/40 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1 outline-none focus:border-[#00ff7f] transition-colors cursor-pointer"
                            >
                                <option value="EDITOR">Editor</option>
                                <option value="VIEWER">Viewer</option>
                            </select>
                        )}

                        <button
                            onClick={() => onRemove(member.id, member.username)}
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