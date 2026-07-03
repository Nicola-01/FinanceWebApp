import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEye,
  faPen,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { WalletMember } from "../../utils/types";
import { getUserAuth } from "../../utils/authHelper.ts";
import { Selector } from "../../components/ui/Selector.tsx";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface MemberRowProps {
  member: WalletMember;
  icon: IconDefinition;
  iconColor: string;
  canManage: boolean;
  onRemove: (id: string, name: string) => void;
  onChangeRole: (id: string, newRole: "EDITOR" | "VIEWER") => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  icon,
  iconColor,
  canManage,
  onRemove,
  onChangeRole,
}) => {
  const user = getUserAuth();
  const isCurrentUser = member.userId === user?.userId;

  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">(
    member.role === "OWNER" ? "VIEWER" : member.role,
  );

  // Re-sync the selected role when the saved role changes (no effect needed).
  const [prevRole, setPrevRole] = useState(member.role);
  if (prevRole !== member.role) {
    setPrevRole(member.role);
    setSelectedRole(member.role === "OWNER" ? "VIEWER" : member.role);
  }

  const hasRoleChanged = selectedRole !== member.role;

  return (
    <div className="group flex items-center justify-between gap-3 rounded-[var(--r-input)] border border-app-border bg-app-surface p-3 transition-colors hover:bg-app-hover">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-card text-lg shadow-sm"
          style={{ color: iconColor }}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-app-text">
              {member.username}
            </span>
            {isCurrentUser && (
              <span className="rounded bg-app-text/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-text">
                You
              </span>
            )}
            {member.status === "PENDING" && (
              <span className="rounded bg-app-yellow/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-app-yellow">
                Pending
              </span>
            )}
          </div>
          <span className="truncate text-xs text-app-muted">
            {member.email}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {canManage && !isCurrentUser && member.role !== "OWNER" && (
          <>
            {member.status === "ACCEPTED" && (
              <div className="flex items-center gap-2">
                <Selector
                  value={selectedRole}
                  onChange={setSelectedRole}
                  size="sm"
                  fullWidth={false}
                  className="w-36"
                  options={[
                    {
                      value: "VIEWER",
                      label: "Viewer",
                      icon: <FontAwesomeIcon icon={faEye} />,
                      activeBgClass: "bg-app-surface",
                      activeColorClass: "text-app-text",
                    },
                    {
                      value: "EDITOR",
                      label: "Editor",
                      icon: <FontAwesomeIcon icon={faPen} />,
                      activeBgClass: "bg-app-surface",
                      activeColorClass: "text-app-text",
                    },
                  ]}
                />
                <button
                  onClick={() => onChangeRole(member.userId, selectedRole)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg bg-app-green/10 text-app-green transition-colors hover:bg-app-green hover:text-white ${
                    hasRoleChanged ? "" : "cursor-not-allowed opacity-20"
                  }`}
                  disabled={!hasRoleChanged}
                  title="Save role"
                >
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                </button>
              </div>
            )}

            <button
              onClick={() => onRemove(member.userId, member.username)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted opacity-40 transition-all hover:bg-app-red/10 hover:text-app-red group-hover:opacity-100"
              title={
                member.status === "PENDING" ? "Cancel invite" : "Remove user"
              }
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
