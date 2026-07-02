import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCrown,
  faEye,
  faPen,
  faSpinner,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../utils/types";
import { SettingsCard } from "../../components/settings/SettingsCard.tsx";

// Importiamo i nuovi sotto-componenti
import { InviteSection } from "./InviteSection";
import { MemberCategory } from "./MemberCategory";

import { useWalletContext } from "../wallet/WalletContext.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

export const ShareSettingsSection: React.FC = () => {
  const { wallet } = useWalletContext();
  const [members, setMembers] = useState<WalletMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/invitations/${wallet.id}`);
      setMembers(response.data);
    } catch {
      triggerToast("Error loading wallet members.", false);
    } finally {
      setIsLoading(false);
    }
  }, [wallet.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const isOwner = wallet.userRole === "OWNER";

  // Handler per InviteSection (ritorna un booleano così il form sa se resettarsi)
  const handleInvite = async (
    identifier: string,
    role: "EDITOR" | "VIEWER",
  ): Promise<boolean> => {
    try {
      await api.post(`/invitations/${wallet.id}`, {
        user: identifier.trim(),
        role: role,
      });

      triggerToast(`Invitation sent to ${identifier}!`, true);
      fetchMembers();
      return true;
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error sending invite"), false);
      return false;
    }
  };

  // Handler per MemberCategory/MemberRow
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName}?`))
      return;
    try {
      await api.delete(`/invitations/${wallet.id}/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== memberId));
      triggerToast(`${memberName} removed successfully.`, true);
    } catch {
      triggerToast("Error removing member.", false);
    }
  };

  const handleChangeRole = async (
    memberId: string,
    newRole: "EDITOR" | "VIEWER",
  ) => {
    try {
      await api.put(`/invitations/${wallet.id}/${memberId}`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberId ? { ...m, role: newRole } : m)),
      );
    } catch {
      triggerToast("Error updating role.", false);
    }
  };

  // Raggruppamenti logici
  const owners = members.filter((m) => m.role === "OWNER");
  const editors = members.filter(
    (m) => m.role === "EDITOR" && m.status === "ACCEPTED",
  );
  const viewers = members.filter(
    (m) => m.role === "VIEWER" && m.status === "ACCEPTED",
  );
  const pending = members.filter((m) => m.status === "PENDING");

  return (
    <div className="flex flex-col gap-6 w-full shrink-0 animate-[fadeIn_0.3s_ease-out]">
      {isOwner && (
        <InviteSection walletColor={wallet.color} onInvite={handleInvite} />
      )}

      <SettingsCard
        title="Wallet Members"
        icon={faUsers}
        subtitle="Manage roles and access for members."
      >
        {isLoading ? (
          <div className="flex justify-center py-10 theme-text-subtle">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <MemberCategory
              title="Owner"
              members={owners}
              icon={faCrown}
              iconColor="#ffd700"
              canManage={isOwner}
              onRemove={handleRemoveMember}
              onChangeRole={handleChangeRole}
            />
            <MemberCategory
              title="Editors"
              members={editors}
              icon={faPen}
              iconColor={wallet.color}
              canManage={isOwner}
              onRemove={handleRemoveMember}
              onChangeRole={handleChangeRole}
            />
            <MemberCategory
              title="Viewers"
              members={viewers}
              icon={faEye}
              iconColor="#a0aec0"
              canManage={isOwner}
              onRemove={handleRemoveMember}
              onChangeRole={handleChangeRole}
            />

            {/* I pending sono visibili solo all'owner per permettergli di revocarli */}
            {isOwner && (
              <MemberCategory
                title="Pending Invites"
                titleColor="theme-text-warning-muted"
                members={pending}
                icon={faClock}
                iconColor="#f59e0b"
                canManage={isOwner}
                onRemove={handleRemoveMember}
                onChangeRole={handleChangeRole}
              />
            )}
          </div>
        )}
      </SettingsCard>
    </div>
  );
};
