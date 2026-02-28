import React, {useEffect, useState} from 'react';
import api from '../api/axiosConfig';
import Sphere from '../assets/Sphere';
import {triggerToast} from '../components/ToastNotification.tsx';
import type {User} from "../utils/types.ts";

import {AdminStats} from './AdminStats';
import {CreateInviteForm} from './CreateInviteForm';
import {type AdminInvite, InvitesTable} from './InvitesTable';
import {UserDirectory} from './UserDirectory';
import {useDeleteModal} from "../modals/DeleteModalContext.tsx";
import {AppHeader} from "../header/AppHeader.tsx";

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [invites, setInvites] = useState<AdminInvite[]>([]);
    const deleteModalRef = useDeleteModal();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Promise.all permette di caricare utenti e inviti in parallelo velocizzando la dashboard
            const [usersRes, invitesRes] = await Promise.all([
                api.get('/admin/management/users'),
                api.get('/admin/management/invites')
            ]);
            setUsers(usersRes.data);
            setInvites(invitesRes.data);
        } catch (err: any) {
            triggerToast(err.response?.data?.title || 'Error loading dashboard data', false);
        }
    };

    const handleConfirmDelete = async (userId: string) => {
        try {
            await api.delete(`/admin/management/${userId}`);
            setUsers(prev => prev.filter(u => u.id !== userId));
            triggerToast("Deleted!", true);
        } catch (err: any) {
            triggerToast(err.response?.data?.title || 'Error deleting.', false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f10] text-white font-semibold">

            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Sphere
                    style={{
                        height: "400px",
                        width: "400px",
                        background: "#ff2299",
                        top: "-100px",
                        right: "-100px",
                        position: "absolute"
                    }}
                    animate={{ x: [0, 0], y: [0, 0] }}
                />
            </div>

            <AppHeader page={{ text: "Admin", accent: "Panel" }} />

            <main className="relative z-10 mx-auto my-10 flex w-[95%] max-w-[1600px] flex-col gap-[30px]">

                <AdminStats users={users} />

                <div className="rounded-2xl border border-white/10 bg-[#141414]/60 p-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">

                    {/* Nuovo form di invito */}
                    <CreateInviteForm onInviteCreated={loadData} />

                    {/* Nuova tabella con timer in tempo reale */}
                    <InvitesTable invites={invites} />

                    <UserDirectory
                        users={users}
                        onDeleteClick={(userToDelete: User) => {
                            deleteModalRef.current?.deleteObject(
                                userToDelete,
                                'user',
                                async () => await handleConfirmDelete(userToDelete.id)
                            );
                        }}
                    />

                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;