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
import { Card } from "../../components/ui/Card.tsx";
import { ConfirmModal } from "../../modals/common/ConfirmModal.tsx";

import { InviteSection } from "./InviteSection";
import { MemberCategory } from "./MemberCategory";

import { useWalletContext } from "../wallet/WalletContext.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

export const ShareSettingsSection: React.FC = () => {
  const { wallet } = useWalletContext();
  const [members, setMembers] = useState<WalletMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
    pending: boolean;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

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

  // Returns a boolean so the invite form knows whether to reset itself.
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

  // Open the confirm modal instead of a native window.confirm.
  const requestRemove = (memberId: string, memberName: string) => {
    const member = members.find((m) => m.userId === memberId);
    setRemoveTarget({
      id: memberId,
      name: memberName,
      pending: member?.status === "PENDING",
    });
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await api.delete(`/invitations/${wallet.id}/${removeTarget.id}`);
      setMembers((prev) => prev.filter((m) => m.userId !== removeTarget.id));
      triggerToast(`${removeTarget.name} removed successfully.`, true);
      setRemoveTarget(null);
    } catch {
      triggerToast("Error removing member.", false);
    } finally {
      setIsRemoving(false);
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

  // Logical groupings
  const owners = members.filter((m) => m.role === "OWNER");
  const editors = members.filter(
    (m) => m.role === "EDITOR" && m.status === "ACCEPTED",
  );
  const viewers = members.filter(
    (m) => m.role === "VIEWER" && m.status === "ACCEPTED",
  );
  const pending = members.filter((m) => m.status === "PENDING");

  return (
    <>
      {isOwner && (
        <InviteSection walletColor={wallet.color} onInvite={handleInvite} />
      )}

      <Card
        title="Wallet Members"
        subtitle="Manage roles and access for members."
        icon={faUsers}
        iconColor={wallet.color}
      >
        {isLoading ? (
          <div className="flex justify-center py-10 text-app-muted">
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
              onRemove={requestRemove}
              onChangeRole={handleChangeRole}
            />
            <MemberCategory
              title="Editors"
              members={editors}
              icon={faPen}
              iconColor={wallet.color}
              canManage={isOwner}
              onRemove={requestRemove}
              onChangeRole={handleChangeRole}
            />
            <MemberCategory
              title="Viewers"
              members={viewers}
              icon={faEye}
              iconColor="#a0aec0"
              canManage={isOwner}
              onRemove={requestRemove}
              onChangeRole={handleChangeRole}
            />

            {/* Pending invites are shown only to the owner, so they can revoke them. */}
            {isOwner && (
              <MemberCategory
                title="Pending Invites"
                titleColor="text-app-yellow"
                members={pending}
                icon={faClock}
                iconColor="#f59e0b"
                canManage={isOwner}
                onRemove={requestRemove}
                onChangeRole={handleChangeRole}
              />
            )}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={!!removeTarget}
        title={removeTarget?.pending ? "Cancel invitation" : "Remove member"}
        message={
          removeTarget?.pending ? (
            <>
              Cancel the pending invitation for{" "}
              <strong>{removeTarget?.name}</strong>?
            </>
          ) : (
            <>
              Remove <strong>{removeTarget?.name}</strong> from this wallet?
              They will lose access until you invite them again.
            </>
          )
        }
        confirmLabel={removeTarget?.pending ? "Cancel Invite" : "Remove"}
        tone="danger"
        busy={isRemoving}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};
