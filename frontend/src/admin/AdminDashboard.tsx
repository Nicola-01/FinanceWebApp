import React, { useCallback, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import api from "../api/axiosConfig";
import Sphere from "../assets/Sphere";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { User } from "../utils/types.ts";
import { getApiErrorTitle } from "../utils/apiError.ts";

import { AdminStats } from "./AdminStats";
import { CreateInviteForm } from "./CreateInviteForm";
import { type AdminInvite, InvitesTable } from "./InvitesTable";
import { UserDirectory } from "./UserDirectory";
import { useDeleteModal } from "../modals/common/DeleteModalContext";
import { AppHeader } from "../header/AppHeader.tsx";
import Backups from "./Backups.tsx";

// ── Users sub-page ─────────────────────────────────────────────────────────────

interface UsersPageProps {
  users: User[];
  invites: AdminInvite[];
  onDeleteClick: (user: User) => void;
  onRevoke: (email: string) => void;
  onInviteCreated: () => void;
}

const UsersPage: React.FC<UsersPageProps> = ({
  users,
  invites,
  onDeleteClick,
  onRevoke,
  onInviteCreated,
}) => (
  <>
    <AdminStats users={users} />
    <div className="rounded-2xl border border-app-border bg-[#141414]/60 p-[30px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <CreateInviteForm onInviteCreated={onInviteCreated} />
      <InvitesTable invites={invites} onRevoke={onRevoke} />
      <UserDirectory users={users} onDeleteClick={onDeleteClick} />
    </div>
  </>
);

// ── Admin Dashboard ────────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { label: "Users", to: "/admin/dashboard/users" },
  { label: "Backups", to: "/admin/dashboard/backups" },
];

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const deleteModalRef = useDeleteModal();

  const loadData = useCallback(async () => {
    try {
      const [usersRes, invitesRes] = await Promise.all([
        api.get("/admin/management/users"),
        api.get("/admin/management/invites"),
      ]);
      setUsers(usersRes.data);
      setInvites(invitesRes.data);
    } catch (err: unknown) {
      triggerToast(
        getApiErrorTitle(err, "Error loading dashboard data"),
        false,
      );
    }
  }, []);

  useEffect(() => {
    // Fetch asincrono al mount: gli setState avvengono dopo l'await, non in modo sincrono.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleConfirmDelete = async (userId: string) => {
    try {
      await api.delete(`/admin/management/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      triggerToast("Deleted!", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting."), false);
    }
  };

  const handleRevokeInvite = async (email: string) => {
    if (
      !window.confirm(
        `Are you sure you want to revoke the invite for ${email}?`,
      )
    )
      return;
    try {
      await api.delete(`/admin/management/invite/${email}`);
      setInvites((prev) =>
        prev.map((inv) =>
          inv.email === email ? { ...inv, status: "REVOKED" } : inv,
        ),
      );
      triggerToast("Invite revoked!", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error revoking invite."), false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen xl:h-screen xl:overflow-hidden bg-app-bg text-app-text transition-colors">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Sphere
          style={{
            height: "400px",
            width: "400px",
            background: "#ff2299",
            top: "-100px",
            right: "-100px",
            position: "absolute",
          }}
          animate={{ x: [0, 0], y: [0, 0] }}
        />
      </div>

      <AppHeader
        page={{ text: "Admin", accent: "Panel" }}
        isAdmin={true}
        tabs={ADMIN_TABS}
      />

      <main className="relative z-10 mx-auto my-10 flex w-[95%] max-w-[1600px] flex-col gap-[30px]">
        <Routes>
          <Route index element={<Navigate to="users" replace />} />
          <Route
            path="users"
            element={
              <UsersPage
                users={users}
                invites={invites}
                onDeleteClick={(u: User) =>
                  deleteModalRef.current?.deleteObject(
                    u,
                    "user",
                    async () => await handleConfirmDelete(u.id),
                  )
                }
                onRevoke={handleRevokeInvite}
                onInviteCreated={loadData}
              />
            }
          />
          <Route path="backups" element={<Backups />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
